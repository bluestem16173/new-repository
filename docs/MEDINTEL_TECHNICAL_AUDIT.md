# MedIntel technical audit — 2026-11-13

## Baseline and architecture

Base: `cursor/auth-repair-6da9`, commit `234f654c5963e79a51b9df9feafe090888fd6ec3`, 18 commits ahead of main with no main-only commits when inspected. Working branch: `codex/medintel-integration-repair`. No stack merges, deployments, live writes, or migrations were performed.

Next.js 16.4.6 App Router, React 19.3, Tailwind, Supabase SSR/JS clients, Zod, Vitest, Playwright. Migrations 001–009 define Medical Information, Field Medical, scientific evidence/simulations, knowledge/reuse, organization scaffolding, AI runs/budgets and security auditing. Their reported remote application cannot be independently verified without a configured project.

Medical Information and evidence have Supabase query paths. Field Medical, Scientific Intelligence and the Scientific Knowledge Network use global in-memory synthetic stores. Existing deterministic seeds and domain metric tests are substantial; they do not establish database integration. Agent cards are a mixture of synthetic deterministic tools and planned capabilities, not fifteen operational AI agents.

## Findings and disposition

| Priority | Finding | Repair / remaining risk |
| --- | --- | --- |
| P0 | Profile self-update policy permits changing role/organization | Draft 010 protects authority fields. Not remotely applied or RLS-tested. |
| P0 | Global role checks and broadly readable child tables can cross tenant boundaries | 010 adds restrictive inquiry/knowledge/security-audit tenant checks; 011 blocks pending accounts from operational tables. Full member-to-member tenant isolation in FM/SI/children still requires further schema/policy work. Do not use for production data. |
| P0 | Membership SELECT policy recursively reads its own table | 010 replaces it with self-membership visibility. Staging verification required. |
| P0 | Synthetic global stores used with operational authentication | Stores now throw in Supabase mode. Explicit unavailable boundary replaces false persistence; operational adapters remain incomplete. |
| P0 | AI gateway could authorize paid models without durable budgets/provider execution | Live authorization now fails closed. Synthetic-only authorization remains; no paid provider calls were made. |
| P1 | Missing signup, recovery screens and profile provisioning | Added account flows; draft 011 provisions least-privilege profiles. Provider and migration verification pending. |
| P1 | Recovery callback only accepted code and defaulted to dashboard | Added PKCE/token-hash recovery handling, recovery-bound cookies, independent reset route, actionable invalid-link states. Local mocked tests cover it; real email and password replacement remain unverified. |
| P1 | Missing membership defaulted to member; missing profile defaulted to MSL | Removed identity fallback and fabricated membership. Proxy routes pending users to onboarding; services reject them. |
| P1 | Callback and login duplicated redirect validation; tests tested copied helper | Shared production helper rejects external URLs, backslashes/control characters and auth loops; tests now import it. |
| P1 | Pending/outdated knowledge could be returned as reusable; word overlap labeled applicability approved | Suggestions now require current approval; lexical match always requires applicability verification. |
| P1 | Self-approval and duplicate/expired adaptation allowed | Independent-author check; accepted/adapted events require current approval, linked accessible inquiry, verification notes, consistent match, no duplicate inquiry/item event. Not a durable multi-instance uniqueness guarantee. |
| P1 | Inquiry reference count races; missing organization on insert; concurrent transitions overwrite | UUID-based reference, verified tenant on insert, compare previous status on update. Workflow/review/audit remain separate transactions; atomic RPC still required. |
| P1 | Related inquiry query errors silently appeared as empty evidence/reviews | Related failures now raise a clear query failure. |
| P1 | Security audit always wrote memory | Configured mode now writes security_audit_events with the user-scoped client and surfaces failures. Full operation+audit atomicity is not implemented. |
| P1 | Synthetic knowledge IDs violated UUID output schema, breaking a real matching search | Replaced knowledge record IDs/references with deterministic valid UUIDs; added successful-match schema regression coverage. |
| P1 | Configured-mode build tried to prerender unavailable synthetic workflows | App data now waits for request-time connection inside Suspense boundaries; authenticated workspace data is not serialized at build time. |
| P1 | Clean npm ci fails from missing lockfile peer dependencies; fresh typecheck lacks route types | Repaired lockfile; typecheck now runs next typegen first. |
| P2 | Deprecated middleware convention and request data outside Suspense | Migrated to proxy.ts; wrapped affected request-dependent pages. |
| P2 | Smoke tests use ambiguous page-wide locators | Scoped to the intended landmarks, preserving assertions. |
| P2 | Agent status “Active” overstates synthetic functionality | UI now says Demonstration only / Configured but unavailable / Not implemented. |
| P2 | Connectivity probe prefers service-role key | Removed privileged key use from diagnostic probe; an anonymous probe still does not verify user RLS. |

## Remaining release blockers

No Supabase environment or deployed canonical origin supplied. Remote schema, SMTP, redirects, RLS, signup trigger, real sign-in/out and password replacement are unverified. Production migration approval is required. FM/SI/knowledge database adapters, comprehensive tenant policies, durable AI quotas, authoritative event-based ROI durations and isolated recruiter sessions remain incomplete. Shared demo identity/state is unsuitable for concurrent public recruiter access. Do not describe this application as enterprise-ready or compliant.

See AUTH_SETUP.md, DATABASE_INTEGRATION.md, KNOWLEDGE_REUSE_WORKFLOW.md, AI_SECURITY_ARCHITECTURE.md and DEMO_READINESS.md for setup and scope.
