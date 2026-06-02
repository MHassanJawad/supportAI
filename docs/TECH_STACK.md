# Technology Stack

| Layer | Choice | Rationale | Risk |
| --- | --- | --- | --- |
| Frontend | Next.js + React + Tailwind | Strong SaaS UI foundation and Vercel fit. | Requires environment setup for Supabase Auth. |
| API | Node.js + Express + TypeScript | Clear REST API and document-processing control. | Long-running ingestion may later need a queue. |
| Auth | Supabase Auth | Avoids custom password/security implementation. | Vendor dependency. |
| Database | Supabase Postgres + pgvector | Relational SaaS data and vector search together. | Vector scale may require tuning or a dedicated vector DB later. |
| Storage | Supabase Storage | Fits tenant document uploads. | Bucket policies must be configured carefully. |
| AI | Gemini | User-selected default provider for embeddings and generation. | Provider limits and model dimensions can change. |
| Hosting | Vercel + Render | Matches plan and common SaaS deployment split. | Cross-origin configuration must be exact. |
