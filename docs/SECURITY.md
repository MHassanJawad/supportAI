# Security

## Controls

- Supabase Auth verifies user identity.
- Express verifies bearer tokens before `/api/v1` routes.
- Tenant-owned rows include `business_id`.
- Supabase RLS policies restrict member access.
- Inputs are validated with Zod.
- File uploads are limited to PDF/TXT and 10 MB.
- Helmet, CORS allowlists, and rate limiting are enabled.
- Secrets are loaded from environment variables only.

## Incident Response

Rotate Supabase and Gemini keys, disable affected accounts in Supabase Auth, review logs by request ID, redeploy with patched configuration, and document the incident timeline.

## Deferred Hardening

- MFA policy.
- Dedicated background worker for ingestion.
- External WAF and uptime monitoring.
- Formal penetration test before public launch.
