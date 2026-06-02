# Runbook

## Health Check

Call `GET /health` on the API.

## Rollback

Revert the last deployment in Vercel or Render. If a migration caused the issue, apply a reviewed rollback migration.

## Debugging

Use the `x-request-id` response header to correlate API logs. Never log secrets, tokens, passwords, or document contents in production.
