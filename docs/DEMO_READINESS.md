# Demo readiness

## Assessment

**Not ready for a production-connected or public multiuser recruiter demonstration.** Local development synthetic walkthroughs are possible; production protected routes return 503 without complete Auth configuration. Partial Supabase configuration never falls back to demo. shared process identity/state is not visitor isolation. Do not publish an unrestricted demo login or use customer data. No deployment or live data changes were performed.

| Demo | Local state | Remaining gate |
| --- | --- | --- |
| A: assessment → coaching → readiness analytics | Existing deterministic synthetic FM workflow and human readiness decisions | Durable authorized FM adapter; isolated visitor state |
| B: inquiry → knowledge → evidence → reuse | Existing synthetic workflow, now stricter approval/currency/applicability/reuse checks | Transactional Supabase knowledge adapter, complete RLS and durable deduplication |
| C: leadership → drill-down → ROI | Existing synthetic analytics with scenario estimates | Full event duration capture and actual inquiry denominator; authoritative record drill-down |
| Registration and recovery | Application routes, validation, callbacks, signed recovery authorization and pending-membership onboarding implemented | Apply reviewed provisioning/security migrations in staging, configure Auth and signing secret, verify real email and credentials |

## Recruiter architecture target

Use a separate Supabase project/environment containing only clearly labeled synthetic records, a least-privilege preprovisioned visitor identity, isolated tenant/session state and no paid AI credentials. Disable live AI execution. Separate recruiter sessions must not share a global mutable demo identity. Require nonprivileged RLS tests before granting access. Current global in-memory stores do not meet those requirements; no secure demo login is exposed by this repair.

## Existing seed tooling

Existing deterministic in-memory Field Medical, knowledge, evidence and inquiry seeds were preserved. They are not database seed scripts and must not be represented as persisted records. No synthetic Auth users were inserted, no real scientific references were manufactured, and no remote seed was run. The requested full 100+ inquiry / 40+ knowledge / simulation database corpus has not been completed. A future isolated seeder must upsert by stable IDs, use approved Auth invitation/user creation tooling, preserve verified references and refuse production targets.

## Manual configuration sequence

1. Review all changes and the audit. Confirm the actual canonical deployed origin.
2. Configure public Supabase URL/key, canonical NEXT_PUBLIC_SITE_URL and server-only MEDINTEL_AUTH_RECOVERY_SECRET. Configure SMTP, exact redirects, confirmations, provider rate limits and Turnstile using AUTH_SETUP.md.
3. Obtain explicit migration approval; validate 010 then 011 in staging. Do not apply to production automatically.
4. Provision a test Auth user through supported Auth registration/invitation. Verify profile MSL role and pending access; grant only an approved tenant membership through trusted administration.
5. Verify reset email receipt, both supported callback formats as applicable, new-password success and old-password rejection, refreshed sessions, sign-out and direct-API tenant isolation.
6. Complete the remaining adapters and tenant policy work before operational or public recruiter use.

## Validation record

Baseline npm ci failed because required peer dependencies were missing from the lockfile; repaired. Fresh typecheck initially failed because generated Next LayoutProps were missing; typecheck now runs next typegen. Initial browser runs required Chromium installation and identified ambiguous test selectors; scoped selectors preserve the original assertions.

Browser smoke tests also exposed invalid synthetic knowledge UUIDs and a configured-mode build exposed eager synthetic data access; repaired with stable UUIDs and request-time rendering boundaries.

Final command results are recorded in the pull request and final implementation report. Unit/route tests mock external Auth. Local browser smoke tests use synthetic mode. They cannot verify remote migrations, SMTP, live credential replacement, distributed rate limits or Supabase RLS.
