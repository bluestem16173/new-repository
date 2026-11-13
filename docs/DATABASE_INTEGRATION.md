# Database integration status

## Source of truth

The repository contains migrations 001–009; their remote deployment is reported by the user but not verified in this environment. No remote schema, records or migration history were read or modified. No database types were generated: no configured remote project/type-generation command is available, and hand-written types must not be represented as generated schema evidence.

| Module | Actual adapter | Status |
| --- | --- | --- |
| Auth/session | Supabase SSR/browser with user cookies and publishable key | Implemented; remote tests blocked |
| Profiles and membership | Authenticated Supabase SELECT | Requires profile plus matching membership; no fallback privilege |
| Medical inquiries, citations, review decisions, audit events | Supabase query path plus explicit synthetic mode | Tenant ID added on create; query failures surfaced; remote execution unverified |
| Evidence Library | Existing Supabase query path | No live scientific retrieval verified |
| Field Medical directory, competencies, assessments, coaching/readiness | Deterministic in-memory adapter | Now unavailable in Supabase mode; database adapter not implemented |
| Knowledge items, versions, matching, reuse, analytics | In-memory adapter | Now unavailable in Supabase mode; durable database workflow incomplete |
| SI documents/passages, drafts, simulation transcripts | In-memory adapter | Now unavailable in Supabase mode |
| Security audit | User-scoped Supabase insert in configured mode | Persistence path added; operation and audit not atomic |
| AI runs/budgets | Tables exist in migrations; gateway uses local demo counters | No durable quota execution; live models denied |
| Safety cases/protocols | Schema scaffolding | No operational workflow verified |

## Reviewed migrations, not applied

- **010_identity_and_tenant_guards.sql**: protects profile authority fields, removes recursive membership SELECT, adds restrictive inquiry/knowledge/security-audit tenant policies and independent knowledge approval checks.
- **011_registration_profiles.sql**: fixed MSL role, NULL organization and idempotent profile insert on Auth signup. Uses existing `profiles`. Pending users get no operational table access through the added restrictive policies.

Both require staging SQL execution and tests with nonprivileged authenticated sessions before approval for production. They preserve existing records but deliberately deny access to unassigned legacy records until a trusted administrator reviews tenancy. Do not auto-populate arbitrary tenant assignments. The scripts are migration files, not rerunnable standalone provisioning commands; profile creation inside the signup trigger is idempotent.

## Remaining integrity/security work

Field Medical and scientific child tables lack a complete tenant model. Their existing role-based policies remain too broad for member-to-member organization isolation. Evidence citations and reviews require policies based on the authorized parent inquiry. Knowledge versions/evidence links/reuse events require corresponding parent-scoped checks and durable uniqueness constraints. Draft 010 only scopes the named root tables; do not infer it closes all direct-API leaks.

Workflow status, review decision and audit inserts are still separate transactions. A narrowly scoped authenticated RPC is needed for atomic transitions and durable reuse validation. Inquiry references now include a UUID to avoid tenant-filtered count collisions. Normal users do not use the service-role client; the read-only connection probe also no longer chooses privileged keys.

## Required staging verification

Apply reviewed migrations only after explicit approval, in order. Validate FKs/indexes against the actual deployed schema and run rollback/recovery rehearsal in staging. Use two tenants, an MSL, a reviewer, a director, an unprovisioned account and an anonymous request. Verify self-role updates fail, missing memberships fail, cross-tenant restricted reads/writes fail, audit updates/deletes fail and self-approval fails. Verify child tables independently, including direct REST requests. Do not treat a service-role query as an RLS test.
