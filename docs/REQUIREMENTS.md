# SupportAI Requirements

## Goal

SupportAI enables businesses to upload support knowledge and answer customer questions with a tenant-isolated RAG chatbot.

## Functional Requirements

| ID | Priority | Requirement | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-001 | Must | Users authenticate with Supabase Auth. | Users can register, login, logout, and call protected APIs with a Supabase JWT. |
| FR-002 | Must | Owners create a business tenant. | A business and owner membership are created and used for scoped data access. |
| FR-003 | Must | Owners upload PDF/TXT documents. | Uploads are stored in Supabase Storage and document records track status. |
| FR-004 | Must | System processes documents for RAG. | Text is extracted, chunked, embedded with Gemini, and stored in pgvector. |
| FR-005 | Must | Customers ask questions. | The system retrieves tenant chunks and returns a grounded Gemini answer. |
| FR-006 | Must | Data is tenant isolated. | Cross-business access is blocked by API filters and Supabase RLS. |
| FR-007 | Should | Owners manage FAQs. | FAQs can be listed, created, updated, and deleted. |
| FR-008 | Should | Dashboard shows analytics. | Owners see total queries, daily usage, common questions, and average response time. |

## Non-Functional Requirements

- API response target: p95 under 1 second for metadata endpoints and under 5 seconds for chat answers.
- Upload limit: 10 MB per PDF/TXT file in MVP.
- Availability target: 99% for MVP deployment.
- Accessibility: UI should meet WCAG 2.1 AA for core flows.
- Security: JWT verification, RLS, strict validation, rate limiting, no secret logging.
- Compliance: US + Pakistan first; GDPR readiness documented for future global launch.

## User Stories

- US-001: As a business owner, I want to register and create a business so that my data is isolated.
- US-002: As a business owner, I want to upload documents so that the chatbot learns my policies.
- US-003: As a customer, I want to ask questions so that I receive quick support answers.
- US-004: As a business owner, I want analytics so that I understand support demand.

## Out of Scope

Billing, WhatsApp, voice, live human handoff, CRM integrations, fine-tuning, and global GDPR launch flows are deferred.
