# MedIntel PR consolidation review

Current update: migrations 010–012 are now approved and applied; administrator authorization is provisioned and verified under the authenticated database role. Browser password sign-in and actual email delivery are not verified. GitHub publishing still returns 403, and no PR has been merged. Earlier findings below retain the original audit snapshot; the final production-update section records the completed changes.

## Recommendation

Prepare **one integration PR from codex/medintel-integration-repair into main**. Do not merge it until the authentication/database release gates below are resolved and the resulting scope is approved. No PR was merged, closed or retargeted during this audit.

All eight PRs are currently OPEN, not merged and not yet formally superseded. Their heads form one linear ancestry chain. Each PR's base SHA exactly matches the preceding PR head. The current Codex branch contains all eight original head SHAs and the full 18-commit feature stack, plus repair commits. No cherry-picking or recreation is needed. No recorded reviews/approvals or CI status checks were returned for any of the eight PRs; mergeability is not approval.

## Exact PR topology

| PR | State | Exact base branch | Exact head branch | Head SHA | New commits |
| --- | --- | --- | --- | --- | --- |
| [#1](https://github.com/bluestem16173/new-repository/pull/1) | OPEN | `main` | `cursor/medintel-phase-1-6da9` | `78590fc8430d4cd2b25e40403930f797e986e97d` | 4 |
| [#2](https://github.com/bluestem16173/new-repository/pull/2) | OPEN | `cursor/medintel-phase-1-6da9` | `cursor/scientific-intelligence-6da9` | `8afd3d03e6007120bad28ed5db72fa67abffad3d` | 1 |
| [#3](https://github.com/bluestem16173/new-repository/pull/3) | OPEN | `cursor/scientific-intelligence-6da9` | `cursor/ai-agent-center-6da9` | `1893dd809affb650101ac8b31a7bb1f3aee5837d` | 5 |
| [#4](https://github.com/bluestem16173/new-repository/pull/4) | OPEN | `cursor/ai-agent-center-6da9` | `cursor/homepage-scientific-categories-6da9` | `b68a6628d3f36282418e58b2d79083fb580505d0` | 2 |
| [#6](https://github.com/bluestem16173/new-repository/pull/6) | OPEN | `cursor/homepage-scientific-categories-6da9` | `cursor/scientific-knowledge-network-6da9` | `293e3c55a873d7d3d09d1c719365a8089e559731` | 2 |
| [#7](https://github.com/bluestem16173/new-repository/pull/7) | OPEN | `cursor/scientific-knowledge-network-6da9` | `cursor/enterprise-security-foundation-6da9` | `065be1b4ad579745c08628373fdd9b59b6f3cdab` | 1 |
| [#8](https://github.com/bluestem16173/new-repository/pull/8) | OPEN | `cursor/enterprise-security-foundation-6da9` | `cursor/supabase-database-foundation-6da9` | `3c5ec9f0523a980dd5d62d80e1119a01e227fd06` | 2 |
| [#9](https://github.com/bluestem16173/new-repository/pull/9) | OPEN | `cursor/supabase-database-foundation-6da9` | `cursor/auth-repair-6da9` | `234f654c5963e79a51b9df9feafe090888fd6ec3` | 1 |

Main snapshot: `296e083eff1f8811feb4ec7709331bac7d755ef8`. Codex snapshot before this report: `9132059ae55cf4308f4cf929b80f9ca6cdc7699a`. Full base/head metadata, review state, diff sizes and containment evidence were saved as a structured local audit snapshot. Every earlier PR head is an ancestor of each later PR head. The progression is #1 → #2 → #3 → #4 → #6 → #7 → #8 → #9 → Codex repairs.

## Features and migration preservation

The ancestry includes Phase 1/Field Medical, Scientific Intelligence, Agent Center, homepage scientific categories, Knowledge Network, enterprise security, database foundation and initial Auth repair. Existing premium design assets, routes and domain code remain in the integration history. Subsequent repairs deliberately refuse synthetic operational writes and paid AI execution rather than making unavailable features appear functional. Middleware is renamed to Next proxy, not removed without replacement.

Migrations 001–009 are byte-for-byte unchanged from the starting Auth branch. Migrations 010–012 are additive reviewed proposals. Do not run 001–009 again against the existing project: live tables exist but the Supabase migration-history API returns an empty history, consistent with manual SQL application but not proving exact historical execution. Current live schema contains additional organization helper functions/policy edits, so remote state is not identical to a fresh repository replay.

## Merge simulation and duplication risk

`git merge-base --is-ancestor` succeeds for every PR head against the Codex branch. `git rev-list --left-right --count origin/main...HEAD` reports no main-only commits at the audit snapshot. `git merge-tree --write-tree origin/main HEAD` exits 0 with no conflicts. This is a merge simulation; no branch ref, merge commit or worktree merge was created.

Merging the integration branch once by **merge commit** preserves the original commit identities and applies the final tree once. Do not squash each stacked PR independently or cherry-pick every branch: that discards shared ancestry and can repeatedly present earlier changes, inflate diffs and create conflicts. Do not merge both the integration PR and the original stack as separate feature deliveries.

No current conflict or missing original head commit was found. These results must be refreshed if main or a stack branch moves before approval. Keeping the original commits does not prove every operational feature is complete: adapters and authorization gaps remain documented in the technical audit.

## Safest consolidation sequence

1. Complete the reviewed Auth/Supabase repairs. Local application and PostgreSQL tests are passing; live SMTP, callback settings and production migration approval remain pending.
2. Restore the GitHub connection's repository Contents write permission. The account reports push permission, but Git push and connector branch creation returned HTTP 403. Do not change repository identity or rewrite existing branches to bypass it.
3. Publish the existing Codex branch unchanged and open the prepared **draft integration PR targeting main**. Include this report, the Auth setup, database validation evidence and remaining limitations. Keep all eight source PRs open for traceability until the integration is accepted.
4. Review the cumulative feature scope and latest repair delta, run required CI on the exact integration commit, and verify migrations/SMTP/account access separately. Review the large cumulative diff in logical feature/repair groups.
5. Obtain explicit merge approval. Merge the integration PR using **Create a merge commit** so original feature commits remain ancestors of main.
6. Verify main's build and deployed behavior. Inspect original PR states: GitHub may mark some merged through containment. Close any remaining source PRs as superseded only after the integration is verified; retain branches until recovery is no longer needed.
7. Configure Vercel's production Git deployment to the approved main branch. The current live deployment was a direct upload of a local commit because GitHub publishing is blocked; do not assume an unreviewed main push will reproduce it.

## Alternative if separate PR approvals are required

Use #1, #2, #3, #4, #6, #7, #8, #9 in order, with merge commits. Merge #1 to main, then retarget #2 to main and review/test it; continue by retargeting each next PR only after its predecessor is merged. Finally target the Codex repair PR to main and review/test that delta. This introduces more merge and CI checkpoints, and can expose intermediate Auth/security states. The single integration PR avoids releasing those intermediate states. Never retarget every PR to main before earlier ancestry is merged.

## Auth/Supabase findings and concrete repair

Live read-only inspection confirmed: 5 Auth identities, 4 profiles, 4 memberships, 2 organizations, and one confirmed Auth identity missing a profile. Existing profiles all have matching memberships. There are 111 inquiry rows and 45 knowledge rows, all with tenant IDs; no security-audit rows. All public tables have RLS enabled, which alone does not prove safe policies.

The membership policy recursively queries its own table. Profile self-update currently permits authority-field changes, and no Auth-user signup provisioning trigger exists. Local PostgreSQL 17 tests reproduce the recursion and verify the proposed repair using the nonprivileged authenticated role with controlled claims, not service-role reads.

- **010** removes recursive membership selection, protects profile authority fields, adds restrictive root tenant checks and enforces independent knowledge approval.
- **011** provisions new profiles with fixed MSL role and no organization, blocks operational access for pending accounts and limits profile visibility.
- **012** creates only missing profiles for existing email Auth identities. Re-running it is idempotent. It does not change existing roles, create Auth users or grant organization access.

The current live row counts indicate no existing inquiry/knowledge row has a NULL tenant that would be hidden by the new root tenant guard. Additional FM/SI/child-table isolation remains a separate release blocker; do not describe these migrations as comprehensive enterprise security.

Production migrations have **not** been applied. The user's original request explicitly requires approval before production migrations and prohibits unapproved live-data changes. Backfilling the missing profile is included in the approval scope, rather than silently changing it.

## Email failure and configuration boundary

Auth logs now confirm three over_email_send_rate_limit errors. Switching between Zoho and Gmail does not bypass a project-wide mail quota. Configure custom SMTP under https://supabase.com/dashboard/project/gnrkhekyjhfbisvsxowc/auth/smtp and retain email confirmation. Verify the canonical site and callback URLs at https://supabase.com/dashboard/project/gnrkhekyjhfbisvsxowc/auth/url-configuration using AUTH_SETUP.md.

The available Supabase tools expose database operations and logs, but no Auth configuration read/update endpoint. These hosted Auth/SMTP settings could not be changed through this connector. No SMTP password, Auth user's password or management token was requested or exposed; no live confirmation/reset email was sent by these checks. Actual email delivery, credential replacement and user sign-in still need live acceptance testing.

## Security advisories

Supabase health advisor returned no findings. Security advisor reports two functions with mutable search_path, several SECURITY DEFINER execution grants requiring review, and disabled leaked-password protection. Authenticated execution of intentional RLS helpers is not automatically a vulnerability; do not revoke all helper grants indiscriminately.

References: [function search paths](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [public SECURITY DEFINER execution](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

The latest npm audit snapshot reports 12 dependency findings (2 low, 10 moderate, no high/critical). No force-upgrade was applied during deployment/consolidation. These remain dependency-maintenance work, primarily tooling, with the direct shadcn dependency requiring review.

## Validation

- Typecheck, lint, 93 Vitest tests and production build passed after generating database types from the actual Supabase schema.
- Isolated PostgreSQL 17 fixture applies migrations 001–009, reproduces the recursive membership failure, then validates 010–012. Checks cover membership visibility, role/tenant escalation, hostile signup metadata, pending access, idempotent backfill, cross-tenant knowledge/inquiry access, independent human approval and self-approval denial.
- Local fixture auth.users is a stand-in test table on a network-disabled container. No test identity or synthetic record was inserted into hosted Supabase Auth.
- Chromium browser suite passed: 9 tests, including registration validation, recovery error states and the existing workflow smoke tests.
- Live Vercel pages previously verified Sign In, Create Account, Forgot Password, invalid-link recovery and anonymous protected-route redirect. This is not proof of real mail delivery or authenticated RLS.

## Remaining blockers before merge approval

Custom SMTP/delivery; hosted Auth redirect settings; explicit production migration/backfill approval; user membership provisioning when needed; GitHub integration write access; formal code review/CI; full FM/SI/knowledge operational adapters and comprehensive child-table tenant policies. The proposed PR may be opened as a draft while these are resolved, but the application is not declared enterprise-ready.

## Final audit outcome

Application validation: typecheck, lint, all 93 unit/route tests, all 9 Chromium tests and production build passed. All 9 isolated PostgreSQL check groups passed. Migration files 001–009 are unchanged. Final merge-tree simulation remains conflict-free; main has no unique commits relative to the integration branch at this snapshot. The feature stack's original 18 commits remain ancestors of the repaired integration branch.

The draft PR title/body is preserved in INTEGRATION_PR_DRAFT.md. Publishing the branch was retried after validation and still failed with HTTP 403. Therefore no integration PR was opened and no original PR was merged, closed, retargeted or declared superseded. Production migrations 010–012 and the least-privilege profile backfill remain unapplied pending explicit approval.

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

## Completed live owner-password verification

After explicit user approval of the one-account mechanism, the scoped Auth-admin reset succeeded and wrote its audit event. The helper is now version 2: an inert HTTP 410 implementation with JWT verification enabled; no password-reset code remains active. No raw password, recovery token or privileged API key is recorded in this repository.

Live browser checks against the production deployment verified: initial temporary-password sign-in; a genuine Supabase recovery token displaying the New password form; legacy recovery fragments leaving Sign In and removing bearer tokens from the URL; successful credential replacement; persistent confirmation on Sign In; rejection of the previous password; final temporary-password sign-in and dashboard access; and sign-out. Verification sessions were cleared. These are live Supabase/browser results, superseding earlier statements that only database authorization was verified. The final password is handed only to the requesting owner to change immediately and is not automatically expiring.

Final production deployment: dpl_FBzt7gvkk1RSVGeuw1XKSKhot7d4, source 7fb231c5b528a18ade52d7872b8814fd170943fe (deployment Git metadata uses its abbreviated SHA), canonical URL https://medintel-sigma.vercel.app. Validation: 100 unit/route tests, 11 local Chromium tests, typecheck, lint and production build passed. Browser automation required the managed environment's TLS-certificate workaround; independent Python HTTPS checks validated both the deployment and Supabase hosts with the configured CA trust. No application TLS or access-protection setting was weakened.

An optional audit-count SQL read could not run because automatic review hit a usage limit; the reset operation's own response already confirmed its audit insert. Automatic review also rejected a new Vercel share-link request. Final verification therefore used only the ordinary public production URL with a fresh browser context and no share link or deployment-protection bypass. The live password/sign-out checks above succeeded through that normal URL.

The owner corrected hosted Site URL/redirect settings. The same invalid-token redirect diagnostic now targets the deployed callback rather than localhost. Actual email receipt was not tested, and custom SMTP/quota configuration remains separate. No GitHub PR was merged or closed; publishing remains blocked by repository integration write permission.
