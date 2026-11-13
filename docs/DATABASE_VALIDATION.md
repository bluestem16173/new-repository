# Database validation checklist

## Connection (env path, no MCP)

```bash
node scripts/verify-supabase-connection.mjs
npm run typecheck
npm run lint
npm run build
```

## After migrations are applied (manual)

- [ ] Tables from `001`–`008` exist in `public`
- [ ] RLS enabled; anon cannot read restricted org data cross-tenant
- [ ] Membership roles enforce admin vs MSL capabilities
- [ ] No `auth.users` rows created by seed SQL
- [ ] Demo rows marked `is_demo` / synthetic provenance
- [ ] Dashboard metrics reconcile to source tables (no double-count)

## Known current remote status

Last agent probe: Auth API healthy; MedIntel application tables **missing** until migrations are applied via Dashboard or authenticated CLI.
