# SupportAI

SupportAI is a production-minded MVP for a multi-tenant AI customer support SaaS. Businesses upload knowledge-base content, the platform indexes it with Gemini embeddings in Supabase pgvector, and customers receive grounded support answers through a RAG chatbot.

## Status

MVP scaffold implemented. CI, docs, migrations, API routes, shared contracts, and frontend screens are included.

## Architecture

The project is a pnpm TypeScript monorepo with a Next.js web app, an Express API, shared contracts, Supabase Auth/Postgres/Storage/pgvector, and Gemini AI services. See [docs/DESIGN.md](docs/DESIGN.md).

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Create the Supabase project, run the SQL migrations in `db/migrations`, create the storage bucket, and add Gemini/Supabase credentials before using live AI or storage features.

## Documentation

- [Requirements](docs/REQUIREMENTS.md)
- [Design](docs/DESIGN.md)
- [Technology Stack](docs/TECH_STACK.md)
- [Testing](docs/TESTING.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Security](docs/SECURITY.md)
- [API Reference](docs/api/openapi.yaml)

## License

Proprietary MVP. Add a formal license before public distribution.
