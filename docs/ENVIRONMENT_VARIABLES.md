# Environment Variables

| Variable | Required | Used By | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Yes | Web | Public web URL. |
| `NEXT_PUBLIC_API_URL` | Yes | Web | API base URL. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Web | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Web | Browser auth key. |
| `PORT` | Yes | API | HTTP server port. |
| `API_ALLOWED_ORIGINS` | Yes | API | CORS allowlist. |
| `SUPABASE_URL` | Yes | API | Supabase project URL. |
| `SUPABASE_ANON_KEY` | Yes | API | JWT verification client key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | API | Server-only database/storage key. |
| `SUPABASE_STORAGE_BUCKET` | Yes | API | Knowledge-base bucket name. |
| `GEMINI_API_KEY` | Yes | API | Gemini API access. |
| `GEMINI_EMBEDDING_MODEL` | Yes | API | Embedding model name. |
| `GEMINI_GENERATION_MODEL` | Yes | API | Generation model name. |
| `RATE_LIMIT_WINDOW_MS` | Yes | API | Rate-limit window. |
| `RATE_LIMIT_MAX` | Yes | API | Max requests per window. |
