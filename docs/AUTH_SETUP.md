# MedIntel authentication setup and recovery repair

## Status and observed failure

The starting callback only exchanged a PKCE `code`, rejected token-hash links, and defaulted successful callbacks to `/dashboard`. The original application had no reset view or registration flow. Depending on the email template and redirect configuration, recovery therefore returned to Sign In or an ordinary workspace guard instead of a password form. The exact deployed email template and redirect settings could not be inspected here.

The repair implements `/login`, `/register`, `/forgot-password`, `/auth/callback`, `/reset-password`, and `/onboarding`. Recovery routes bypass organization gating but password updates require a server-verified Auth user and a short-lived HttpOnly recovery marker bound to that user. Successful password changes clear the marker and request global sign-out. Invalid links show an explanation and a fresh-link action. Ordinary sign-in and registration callbacks do not set the recovery marker.

No live email delivery, password replacement, session persistence against Supabase, or remote RLS test has been verified. Provider interactions in automated tests use mocks. Do not delete or recreate existing Auth users to troubleshoot recovery.

## Environment and dashboard configuration

1. Set a server-only `MEDINTEL_AUTH_RECOVERY_SECRET` to a cryptographically random value of at least 32 characters, shared by all hosted replicas. Keep it in deployment secrets; never prefix it with NEXT_PUBLIC or commit it. Development uses an ephemeral signing key. Recovery cookies are signed and expire after ten minutes.
1. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The existing `NEXT_PUBLIC_SUPABASE_ANON_KEY` alias remains supported. No management PAT or service role is required for application Auth.
1. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS application origin, with no path. For example, if the deployed origin is `https://medintel.example.com`, use that exact value. The actual deployed domain was not supplied or verified. Production requests fail clearly if the site URL is absent.
1. In Supabase Authentication → URL Configuration, set **Site URL** to that same origin. Add these exact redirect URLs, replacing the example host with the deployed host:
   - `https://medintel.example.com/auth/callback?flow=recovery&next=/reset-password`
   - `https://medintel.example.com/auth/callback?flow=registration&next=/onboarding`
   - `https://medintel.example.com/auth/callback?next=/dashboard`
1. For local testing add the equivalent URLs beginning `http://localhost:3000`. Use one browser origin consistently; `127.0.0.1` and `localhost` do not share PKCE cookies. If using `127.0.0.1`, configure its origin and URLs instead.
1. Keep email confirmations enabled as required by your Auth policy. Configure a verified SMTP sender and inspect Supabase Auth/SMTP logs. An accepted API request is not evidence of email delivery.
1. Configure Supabase Auth rate limits for signup, password recovery, sign-in, and token verification. Enable Turnstile abuse protection for public registration and recovery. Put its secret only in the Supabase dashboard; set the matching public site key as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in the application. Allow the actual application hostname in Turnstile.
1. Restart/rebuild after changing public environment settings. Do not commit `.env.local`.

## Recovery email templates: choose a supported format

### PKCE default

The Reset Password template can retain Supabase's `{{ .ConfirmationURL }}` link. The application requests recovery with the full redirect URL above. Supabase verifies the one-time email link and returns `code` to `/auth/callback?flow=recovery&next=/reset-password`. The callback exchanges the code and writes Auth cookies. Open it in the browser where recovery was requested so the PKCE verifier cookie is available.

### Explicit token hash (also supports opening in a different browser)

Use a Reset Password template with the canonical application host hardcoded to the approved deployment:

```html
<a href="https://medintel.example.com/auth/callback?token_hash={{ .TokenHash }}&type=recovery">Reset your MedIntel password</a>
```

The callback calls `verifyOtp({ token_hash, type: 'recovery' })`, writes the resulting Auth cookies, marks the verified recovery identity, and always redirects to `/reset-password`. It never forwards token material to the destination. Use this only in the recovery template; registration keeps its confirmation template. Never construct redirect targets from user-supplied hosts.

Legacy implicit recovery fragments, including valid links targeting `/login`, are now handled by the root recovery handler and verified server-side before issuing recovery authorization. Expired links or links targeting another origin still require a fresh request after correcting the hosted template/redirect settings. Disable callback query-string capture in hosting/access logs and analytics; never send token hashes to telemetry. Callback responses use `no-store` and `no-referrer`.

## Profile provisioning and organization bootstrap

The existing repository table is **public.profiles**, not `user_profiles`. Migration 011 provisions it on Auth user creation, using a fixed `msl` role and NULL organization. It ignores client-supplied roles and organization IDs, and uses `ON CONFLICT (id) DO NOTHING`. It changes the prior specialist default to MSL. No records are directly inserted into `auth.users`.

Migrations 010 and 011 are review artifacts, **not applied**. Review them and verify in staging before any production approval. Migration 011 requires 010. Until provisioning is applied, signup may create an Auth identity without its application profile; access remains pending, not elevated. Existing identities are not silently backfilled or re-created.

Manual administrator procedure (no public invitation endpoint is introduced):

1. Authenticate the administrator through the Supabase dashboard with appropriate project privileges.
1. Confirm the user's identity and email through the approved invitation/confirmation process in Supabase Auth. Users can self-register, or an administrator can send an Auth invitation using trusted administrative tooling.
1. Inspect the newly provisioned profile by its Auth UUID. For a pre-existing identity missing a profile, create only its `public.profiles` record, with `msl`, no organization, and the verified Auth email. Never insert into `auth.users`.
1. Select the approved organization. In a reviewed administrative transaction, set the profile's organization and insert the matching organization_memberships row. Use `ON CONFLICT (organization_id, profile_id) DO NOTHING` for the membership. Check for an existing membership in another tenant before making changes.
1. Bootstrap an initial administrator role only through trusted dashboard/database administration after independently verifying the intended person. Browser-authenticated profile editing cannot change role, organization, ID, or demo status under migration 010.
1. Ask the user to sign in again. A profile alone is insufficient: the matching membership must exist. New or unapproved users see “Your account is ready. Organization access is pending.”

There is no tested self-service organization invitation acceptance flow in this repair. Do not grant strangers an organization membership to make onboarding disappear.

## Abuse protections and limitations

Server actions validate email/password, cap input sizes, and use bounded hashed-email counters (5 attempts per 15 minutes per process). Supabase's distributed Auth rate limits and Turnstile are required authoritative protections; the process-local limiter resets on restart and is not a distributed quota. Raw passwords and recovery tokens are never logged by application code. Registration and reset messages avoid confirming whether an email exists. Provider/network outages and rate limits produce explicit errors.

Passwords require 12–128 characters, with confirmation and provider password policy enforcement. Recovery authorization expires after ten minutes. Successful update requests global session revocation, but existing provider access JWTs may remain valid until their configured expiration. Configure an appropriate Auth JWT lifetime.

## Acceptance checklist on the configured staging project

- Register with a new test email; verify receipt and completion of confirmation, profile role `msl`, no organization, and pending-access onboarding.
- Repeat signup and recovery for known and unknown emails; compare neutral messages. Test weak/mismatched passwords and rate limits/CAPTCHA.
- Verify password sign-in, refresh across reload, magic-link callback, sign-out, and unauthenticated protected-route redirects.
- Request recovery → receive actual email → follow PKCE or token-hash link → verify `/reset-password` displays New password, Confirm new password, Update Password, even without organization membership.
- Submit a new password; verify confirmation, then verify new-password sign-in succeeds and old-password sign-in fails against Supabase. This final credential replacement test has **not** been run here.
- Retry expired/reused/missing links and links in a different browser; expect actionable errors (or successful token-hash verification for a fresh cross-browser link).
- Confirm callback cookies survive navigation and token values do not appear in destination URLs or telemetry.
- Attempt direct PostgREST reads/writes as an authenticated nonmember and as two users in different organizations. These require nonprivileged test sessions; service-role results do not demonstrate RLS.

## “Email rate limit exceeded” troubleshooting

This is a Supabase Auth/email-provider throttle, distinct from the application's supplemental per-email limiter. Stop repeatedly requesting reset links. Inspect Authentication → Rate Limits, Auth logs, SMTP settings and the configured email provider's quota. The default built-in mail service has restrictive sending limits and is unsuitable as a general production mail provider. Configure a verified custom SMTP sender for deployment. Exact limits/reset times depend on the project/provider; do not promise a specific wait without inspecting them. Do not disable confirmation, delete users, or bypass recovery to work around the throttle. Request one fresh recovery link only after the relevant window/quota permits it. A rate-limit error is not evidence of successful delivery.

## Confirmed deployment origin

The current MedIntel Vercel origin is `https://medintel-sigma.vercel.app`. Set Supabase Site URL to that exact origin, and allow these callback URLs:

- `https://medintel-sigma.vercel.app/auth/callback?flow=recovery&next=/reset-password`
- `https://medintel-sigma.vercel.app/auth/callback?flow=registration&next=/onboarding`
- `https://medintel-sigma.vercel.app/auth/callback?next=/dashboard`

For the optional direct token-hash recovery email template, use `https://medintel-sigma.vercel.app/auth/callback?token_hash={{ .TokenHash }}&type=recovery` as the recovery link. These Supabase administrative settings were not changed during the deployment.

## Live database inspection and pending repair

After Supabase was connected, read-only inspection confirmed five Auth identities and four profiles; one confirmed email identity lacks a profile. The live membership policy self-references organization_memberships and no signup profile trigger exists. Existing profiles all have matching memberships. Do not identify the missing profile with a particular email without checking its ownership.

The proposed repair is migrations 010, 011 and 012 in order. Migration 012 backfills only missing public.profiles rows as MSL with no organization; it does not create Auth users, elevate roles or grant access. Production execution still requires explicit approval. Their local PostgreSQL 17 integration tests pass, including RLS checks as authenticated, not service_role.

Reproduce safely in an isolated local container:

```bash
docker run --detach --name medintel-auth-db-verify --network none --env POSTGRES_HOST_AUTH_METHOD=trust postgres:17-alpine@sha256:d3244e8ce3f165ee3c93d9c4a4b1d0fe48b3a89e2287b717fdcbbde92d405065
MEDINTEL_TEST_DB_CONTAINER=medintel-auth-db-verify npm run test:database-auth
```

The test harness refuses containers with network access. Auth tables and identities in this fixture are test stand-ins; no hosted Auth users are inserted. Each run uses a new local test database.

Auth logs confirmed repeated over_email_send_rate_limit errors. The connected Supabase tools do not expose hosted Auth configuration updates. Configure custom SMTP and exact redirects in the dashboard links in PR_CONSOLIDATION.md; do not disable confirmation or rely on changing the recipient email to avoid a project quota.

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

## Additional recovery and password-change repair

Added a root-level handler for legacy implicit recovery URL fragments, including links redirected to /login. It clears token fragments from browser history immediately, establishes the session on the server, verifies the user with Supabase Auth and sets the same signed user-bound recovery cookie used by PKCE/token-hash callbacks. Tokens are not forwarded to destination URLs or logged.

Added /change-password for authenticated users, independently of organization membership. The action verifies the user and sends the current password plus the new password to Supabase Auth, then signs out globally. The installed SDK expects current_password (not the camel-case example in some docs). The recovery-only /reset-password guard remains intact.

A read-only invalid-token redirect diagnostic, using the exact deployed recovery callback as redirect_to, fell back to http://localhost:3000. This confirms that the hosted callback is not accepted under the current URL configuration; correcting the Supabase Site URL/allowed redirects is required. The available MCP tools do not expose that configuration endpoint. No diagnostic email was sent.

Validation for the additional repair: 99 unit/route tests, 11 Chromium browser tests, typecheck, lint and production build. A temporary privileged owner-password operation, if executed, must use the supported Auth admin API with a fixed verified target, short-lived capability authentication and immediate disabling afterward. No raw API key may leave the Edge Function. Never store password values or recovery tokens in the repository or audit metadata.

## Latest deployed recovery status

Deployment dpl_96kqX7DWpQ4rzicVNoSzW7vMm62T (source d911dd22e64c49a15ac0e6c97b0d7fdd2053da15) is READY at the canonical MedIntel domain. The owner saved Supabase URL settings; repeating the same invalid-token diagnostic now redirects to the deployed /auth/callback rather than localhost. No email was sent by this diagnostic. The deployed /change-password route does not render a password-change form to an anonymous request and emits the server redirect to sign in.

The requested temporary administrator password has not been set. Automatic approval review rejected the proposed short-lived server-side credential-reset helper because it would expose a high-impact privileged credential-control endpoint, despite its fixed account and capability checks. The helper was not deployed. Explicit approval of that mechanism was requested; no indirect password-table update or alternative execution bypass was attempted. Existing passwords, Auth identity and email confirmation are unchanged.

## Live password recovery feedback regression

After explicit authorization, a fixed-target, short-lived owner credential helper executed the supported Auth admin password update and generated a genuine recovery token for verification. Its implementation was immediately replaced with an inert 410 response and JWT verification re-enabled. No privileged API key left the function and no password/token was stored in audit metadata.

Live browser checks proved password sign-in and both genuine token-hash callback and legacy recovery-fragment handling. The first password update changed the credential successfully (verified independently through Auth: preceding password rejected and updated password accepted), but clearing the recovery/session cookies caused the gated page to replace its client-side success message. Successful updates now navigate to /login?notice=password_updated, where confirmation persists after sign-out. A regression test covers the sign-in confirmation. Further live checks must verify this final feedback fix before handing over the credential. No actual email delivery was tested; the SMTP quota remains independent of these direct checks.

## Completed live owner-password verification

After explicit user approval of the one-account mechanism, the scoped Auth-admin reset succeeded and wrote its audit event. The helper is now version 2: an inert HTTP 410 implementation with JWT verification enabled; no password-reset code remains active. No raw password, recovery token or privileged API key is recorded in this repository.

Live browser checks against the production deployment verified: initial temporary-password sign-in; a genuine Supabase recovery token displaying the New password form; legacy recovery fragments leaving Sign In and removing bearer tokens from the URL; successful credential replacement; persistent confirmation on Sign In; rejection of the previous password; final temporary-password sign-in and dashboard access; and sign-out. Verification sessions were cleared. These are live Supabase/browser results, superseding earlier statements that only database authorization was verified. The final password is handed only to the requesting owner to change immediately and is not automatically expiring.

Final production deployment: dpl_FBzt7gvkk1RSVGeuw1XKSKhot7d4, source 7fb231c5b528a18ade52d7872b8814fd170943fe (deployment Git metadata uses its abbreviated SHA), canonical URL https://medintel-sigma.vercel.app. Validation: 100 unit/route tests, 11 local Chromium tests, typecheck, lint and production build passed. Browser automation required the managed environment's TLS-certificate workaround; independent Python HTTPS checks validated both the deployment and Supabase hosts with the configured CA trust. No application TLS or access-protection setting was weakened.

An optional audit-count SQL read could not run because automatic review hit a usage limit; the reset operation's own response already confirmed its audit insert. Automatic review also rejected a new Vercel share-link request. Final verification therefore used only the ordinary public production URL with a fresh browser context and no share link or deployment-protection bypass. The live password/sign-out checks above succeeded through that normal URL.

The owner corrected hosted Site URL/redirect settings. The same invalid-token redirect diagnostic now targets the deployed callback rather than localhost. Actual email receipt was not tested, and custom SMTP/quota configuration remains separate. No GitHub PR was merged or closed; publishing remains blocked by repository integration write permission.
