-- Add business addresses to existing SupportAI installations.
alter table public.businesses
  add column if not exists address text;

update public.businesses
set address = 'Address not provided'
where address is null or btrim(address) = '';

alter table public.businesses
  alter column address set not null;

alter table public.businesses
  drop constraint if exists businesses_address_check;

alter table public.businesses
  add constraint businesses_address_check check (char_length(address) between 5 and 240);
