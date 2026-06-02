# Testing

Install dependencies and run all suites:

```bash
pnpm install
pnpm test
```

Recommended checks before handoff:

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
pnpm audit
```

Integration tests require a Supabase test project and environment variables from `.env.example`.
