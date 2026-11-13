# MedIntel Security Audit

**Scope:** Repository inspection of Next.js App Router, server actions, Supabase clients, RLS migrations, session handling, AI usage, and demo posture.  
**Date:** 2026-11-13 (America/New_York)  
**Certification claims:** None. This audit does not assert HIPAA, SOC 2, GxP, or enterprise certification.

## Architecture summary (threat model)

MedIntel is a Medical Affairs demo/platform using Next.js, TypeScript, and optional Supabase. Default runtime is **demo mode** (in-memory synthetic data) when public Supabase env vars are absent. Consequential workflows (inquiry approval, knowledge approval, Field Medical readiness) rely on server-side role checks. Primary threats: unauthenticated access when Supabase is configured, overly broad RLS SELECT policies, silent demo-identity fallback, missing edge auth middleware, unrestricted future LLM spend, publication of restricted KOL content into shared knowledge search, and missing append-only security audit for consequential actions.

## Findings

| ID | Finding | Severity | Affected component | Exploitation scenario | Recommended mitigation | Status | Verification |
|---|---|---|---|---|---|---|---|
| F-01 | No Next.js middleware auth gate | High | Routing | With Supabase configured, unauthenticated clients could hit app pages before session checks | Add middleware requiring Supabase session when configured | **Remediated** | `src/middleware.ts` |
| F-02 | Silent demo-user impersonation in supabase mode | High | `getCurrentUser` | Missing session returned MI specialist demo identity | Fail closed; reject demo identity on mutations via `requireUser` | **Remediated** | `src/lib/session.ts`, `require-user.ts` |
| F-03 | `medical_inquiries` SELECT `using (true)` | High | RLS | Any authenticated user could read all inquiries | Restrict to MI/reviewer/admin/FD or owner/assignee | **Remediated (migration)** | `007_enterprise_security_foundation.sql` |
| F-04 | SI sim sessions policy `or true` | High | RLS | Effectively open SELECT | Replace with role-scoped policy | **Remediated (migration)** | `007_...sql` |
| F-05 | Unprovisioned auth user defaulted to MI specialist | Medium | Session | Privilege by missing profile row | Default to `msl` least privilege | **Remediated** | `session.ts` |
| F-06 | No organization/tenant isolation columns | Medium | Schema | Future multi-tenant leakage | Add organizations + memberships + org_id columns | **Partial** | Migration 007 scaffolding |
| F-07 | No centralized AI gateway / quotas | Medium | AI agents | Future browser or unbounded server LLM cost | Server gateway with allowlist + quotas; no client keys | **Remediated (foundation)** | `ai-gateway.ts` |
| F-08 | Knowledge mutations lacked shared `requireUser` + audit | Medium | Server actions | Weaker consistency / missing audit | Wrap knowledge actions; emit security audit | **Remediated** | `actions/knowledge.ts` |
| F-09 | Missing security response headers | Low | HTTP | Clickjacking / MIME sniffing | Set baseline headers in middleware | **Remediated** | `middleware.ts` |
| F-10 | No data classification metadata | Medium | Knowledge/MI/SI | Restricted content could be confused with reusable | Enum + columns + knowledge approval guard | **Partial** | Migration 007 + domain helpers |
| F-11 | CSP not enforced | Low | Headers | XSS defense-in-depth gap | Add CSP after route testing | **Open** | Documented NOT_VERIFIED |
| F-12 | Live RLS not exercised in CI | Medium | Test env | Policy regressions undetected | Add Supabase-connected policy tests | **Open** | NOT_VERIFIED without DB |
| F-13 | Admin client exists | Low | `createSupabaseAdminClient` | Misuse could bypass RLS | Keep unused on request paths; narrow future use | **Accepted risk** | Grep shows unused by services |
| F-14 | Demo mode open by design | Info | Portfolio demo | Public read of synthetic data | Keep; label synthetic; rate-limit AI; no prod writes | **Accepted** | Demo posture documented |

No secrets are recorded in this report. No exploit payloads included.
