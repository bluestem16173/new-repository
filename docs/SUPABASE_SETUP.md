# MedIntel Supabase setup (no MCP)

## Project

- Project ref / ID: `gnrkhekyjhfbisvsxowc`
- URL env: `NEXT_PUBLIC_SUPABASE_URL=https://gnrkhekyjhfbisvsxowc.supabase.co`

## Environment variables

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Preferred publishable key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Legacy anon; used if publishable unset |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Secret / service_role — never `NEXT_PUBLIC_*` |

The app accepts **either** publishable or anon. If both are set, publishable wins.

Copy `.env.example` → `.env.local` (gitignored). Never commit secrets.

## Connection check

```bash
node scripts/verify-supabase-connection.mjs
```

Interpretation:

- Auth health OK → project reachable
- Table `missing_table` → reachable; migrations not applied yet
- RLS / permission errors → reachable; policy blocked the read (not offline)
- Network / invalid URL failures → not connected

## Migrations

Version-controlled SQL lives in `supabase/migrations/` (`001`–`008`).

**Do not apply automatically from this agent.** Approved methods:

1. **Supabase Dashboard → SQL Editor** — paste/review each migration in order
2. **Supabase CLI** — only after `supabase login` / access token from an approved secret store

Cursor Cloud currently has **no** bound app secrets for CLI login, and Supabase MCP OAuth is out of scope (`client ID not recognized`). Prefer Dashboard SQL Editor until CLI auth is configured.

## Runtime modes

- Missing URL or public key → **demo** mode (in-memory synthetic data)
- URL + publishable/anon present → **supabase** mode (middleware requires Auth session)
