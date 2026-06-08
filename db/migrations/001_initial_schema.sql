-- SupportAI initial Supabase schema with pgvector and tenant isolation.
create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  industry text not null check (char_length(industry) between 2 and 80),
  address text not null check (char_length(address) between 5 and 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  filename text not null,
  mime_type text not null check (mime_type in ('application/pdf', 'text/plain')),
  storage_path text not null unique,
  status text not null check (status in ('uploaded', 'processing', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_text text not null,
  embedding vector(768) not null,
  chunk_index integer not null check (chunk_index >= 0),
  token_estimate integer not null check (token_estimate >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id text,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender text not null check (sender in ('customer', 'assistant', 'owner', 'system')),
  content text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_name text not null,
  properties jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_business_members_user_id on public.business_members(user_id);
create index if not exists idx_documents_business_id on public.documents(business_id);
create index if not exists idx_document_chunks_business_id on public.document_chunks(business_id);
create index if not exists idx_document_chunks_embedding on public.document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists idx_faqs_business_id on public.faqs(business_id);
create index if not exists idx_conversations_business_id on public.conversations(business_id);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_analytics_events_business_id on public.analytics_events(business_id);

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members
    where business_id = target_business_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.match_document_chunks(
  query_embedding vector(768),
  match_business_id uuid,
  match_count int
)
returns table (
  id uuid,
  document_id uuid,
  filename text,
  chunk_text text,
  similarity float
)
language sql
stable
as $$
  select
    document_chunks.id,
    document_chunks.document_id,
    documents.filename,
    document_chunks.chunk_text,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from public.document_chunks
  join public.documents on documents.id = document_chunks.document_id
  where document_chunks.business_id = match_business_id
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.faqs enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.analytics_events enable row level security;

create policy "members can read businesses" on public.businesses
  for select using (public.is_business_member(id));

create policy "members can read memberships" on public.business_members
  for select using (public.is_business_member(business_id));

create policy "members can read documents" on public.documents
  for select using (public.is_business_member(business_id));

create policy "members can read chunks" on public.document_chunks
  for select using (public.is_business_member(business_id));

create policy "members can manage faqs" on public.faqs
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage conversations" on public.conversations
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage messages" on public.messages
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can read analytics" on public.analytics_events
  for select using (public.is_business_member(business_id));
