# Deployment

## Frontend

Deploy `apps/web` to Vercel. Configure:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## API

Deploy `apps/api` to Render as a Node service. Configure all API variables from `.env.example`.

## Supabase

1. Create a Supabase project.
2. Run `db/migrations/001_initial_schema.sql`.
3. Create storage bucket `knowledge-base`.
4. Copy project URL, anon key, and service role key into deployment secrets.

## Smoke Test

Register, create a business, upload a TXT file, ask a question, and confirm analytics increments.
