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

## Subsequent live read-only verification

The connected Supabase project has 54 public tables with RLS enabled, including 111 inquiries and 45 knowledge items, all assigned a tenant. There are five Auth identities, four profiles, four memberships and two organizations. Migration history is empty even though the tables exist; do not replay 001–009 or assert the historical application method is known. The live schema includes policy/helper modifications beyond the repository's original migrations.

Actual schema TypeScript types were generated into src/lib/supabase/database.types.ts. Proposed migrations 010–012 passed the isolated PostgreSQL 17 harness (npm run test:database-auth with the documented network-disabled container). This supersedes the earlier statement that no schema types or SQL-execution evidence were available. Production migrations remain unapplied, and managed-tool read results are not authenticated-session RLS proof.

## Approved production Auth repair and administrator provisioning

The user explicitly approved migrations 010–012 and requested repair of the owner-confirmed administrator account. Applied through Supabase migration tooling:

| Repository migration | Supabase version | Recorded name |
| --- | --- | --- |
| 010 | 20261114002350 | identity_and_tenant_guards |
| 011 | 20261114002405 | registration_profiles |
| 012 | 20261114002414 | backfill_pending_profiles |

A trusted administrative transaction then upgraded only the confirmed existing account to application admin and inserted its admin membership in medintel-demo. It rejected conflicting existing tenant assignments, changed no Auth identity/password/confirmation, granted no isolation-test-tenant membership, and wrote an admin.access.bootstrap audit event. No permanent bootstrap RPC was exposed.

Post-change checks: Auth users stayed at 5, profiles increased 4→5, memberships 4→5, organizations stayed at 2, inquiries stayed at 111 and knowledge items stayed at 45. No missing profiles remain; all public tables retain RLS. The new organization helper is executable by authenticated but not anon. Its trigger helpers have no direct client execution grants.

Read-only verification switched to the nonprivileged authenticated database role with the target identity's controlled request claim: app role admin, one visible membership, own profile and organization authorized, and zero visible inquiry/knowledge rows from the other tenant. This is database-context authorization evidence, not a claim of a browser password sign-in or a JWT-signature test. The user must sign out/in and verify the deployed UI with their existing credentials.

Security advisor still reports pre-existing mutable search paths, SECURITY DEFINER grants needing review and disabled leaked-password protection. SMTP/rate-limit and hosted callback settings remain unresolved; no email delivery or password change was attempted. No GitHub PR was merged or closed. Existing GitHub publishing permission remains blocked.
