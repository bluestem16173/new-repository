# Integrate complete MedIntel stack with authentication and database safety repairs

Base: `main`  
Head: `codex/medintel-integration-repair`  
State: prepared draft; not opened because GitHub repository publishing returns HTTP 403.

MedIntel's eight open feature PRs form a linear stack based on main, while authentication registration/recovery and database security repairs exist only on the Codex branch. This integration brings the entire original stack plus the repairs into one reviewable target without replaying or discarding earlier commits.

Includes the existing Field Medical, Scientific Intelligence, AI Agent Center, homepage categories, Knowledge Network, security and database features; adds registration, signed recovery flows, pending-access onboarding, runtime safety guards, generated database types and locally validated migration proposals. Migrations 001–009 are preserved unchanged. New migrations require separate production approval and have not been applied.

Validation: typecheck, lint, 93 unit/route tests, production build and isolated PostgreSQL authenticated-role checks pass. All 9 Chromium browser tests also pass. No live email delivery or credential replacement is claimed.

Keep draft until SMTP/callback settings, production migration approval, security gaps and formal review gates are resolved. Prefer a merge commit to preserve the original PR head identities. See docs/PR_CONSOLIDATION.md for exact base/head branches, full SHAs, ancestry, merge simulation, alternative ordering, advisories and release blockers. No PRs were automatically merged, closed or retargeted.
