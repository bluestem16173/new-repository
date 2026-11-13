# MedIntel Security Architecture

## Trust boundaries

1. **Browser** — untrusted. No service-role keys, no raw BYOK keys in `localStorage`, no direct provider calls.
2. **Next.js server** — trusted application boundary for session resolution, RBAC, AI gateway, and mutations.
3. **Supabase Auth + Postgres RLS** — authoritative identity and row filters when configured.
4. **Demo in-memory stores** — synthetic portfolio data only; not a multi-tenant production store.

## Authentication

- **Demo mode** (default): synthetic users; recruiter does not supply API keys; middleware allows access and marks `x-medintel-runtime-mode: demo`.
- **Supabase mode**: middleware requires `auth.getUser()` session for app routes; unauthenticated users redirect to `/login`.
- Server mutations should call `requireUser()` rather than trusting client-submitted roles.

## Authorization

Application RBAC (`src/domain/authorization.ts`, knowledge/FM helpers) plus database triggers for approval transitions. Roles are read from `profiles.role` server-side.

Conceptual mapping:

| Concept role | Current `user_role` |
|---|---|
| MSL | `msl` |
| Medical Information Reviewer | `medical_reviewer` |
| Medical Director | `field_director` / `admin` (interim) |
| Organization Administrator | `admin` |
| Demo User | demo identities (`@demo.medintel.local`) |

Enterprise SSO is architectural only in this milestone.

## Data flow for Scientific Knowledge Network

Restricted inquiries → evidence retrieval → human draft → authorized approval → `internal_approved` knowledge item → searchable reuse. Raw KOL/field transcripts are not globally searchable by default.

## AI gateway

All future model calls must pass `authorizeAiGatewayRequest` (`src/lib/security/ai-gateway.ts`) with model allowlist, per-user/global quotas, and audit events. Modes: `demo` | `byok` | `enterprise` via `MEDINTEL_AI_MODE`.

## Admin visibility

`/admin/security` is admin-only and shows PASS / FAIL / NOT_VERIFIED / NOT_APPLICABLE with evidence — never certification badges.
