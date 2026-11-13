# Security Test Results

**Runtime:** local agent environment, demo mode (no Supabase credentials)  
**Date:** 2026-11-13 (America/New_York)

## Commands

| Command | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm test` (Vitest) | PASS — 54 tests |
| `npm run build` | PASS |
| `npm audit --omit=dev` | 6 advisories (2 low, 4 moderate) in tooling deps (`shadcn`/`minimatch` chain) — **NOT remediated in this PR**; track separately |

## Security suite (`tests/security-foundation.test.ts`)

| Case | Result |
|---|---|
| Data classification defaults / shared-knowledge gate | PASS |
| AI gateway deny non-allowlisted model + audit | PASS |
| AI gateway authorize demo-synthetic | PASS |
| Audit metadata strips `api_key` | PASS |
| MSL cannot approve knowledge via server action | PASS |
| `requireUser` role enforcement | PASS |
| Security status never claims certifications | PASS |

## Not executed here

| Test | Why |
|---|---|
| Live RLS cross-org Postgres policy tests | No connected Supabase project in this environment |
| Unauthenticated browser access against supabase-mode middleware | Requires configured Auth env |
| Full prompt-injection corpus against live LLM | No provider keys; gateway is fail-closed to allowlist/demo |
| Dependency force upgrades | Avoid breaking toolchain mid-release without dedicated PR |

## Honest status

Application unit/integration-style security tests pass in demo mode. **Live multi-tenant RLS verification remains NOT_VERIFIED** until migrations are applied to a real database and policy tests are run against it.
