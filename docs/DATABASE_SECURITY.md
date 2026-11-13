# Database security notes

- RLS enabled on application tables in migrations `002`, `004`, `006`, `007`, `008`
- Organization isolation via `organization_memberships` (`007`)
- Public publishable/anon key is browser-safe; **service role is server-only**
- Middleware fail-closed when Supabase is configured (session required)
- Do not treat service-role query success as proof of RLS correctness
- Audit tables are append-oriented; ordinary clients must not update/delete audit history
- Never log secrets, service keys, or full restricted scientific prompts
