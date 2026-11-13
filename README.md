# MedIntel

Independent demonstration portfolio for pharmaceutical **Medical Affairs** and **Clinical Intelligence** workflows.

**Not affiliated with any pharmaceutical company. All data is synthetic. Not for clinical decision-making.**

## Phase 1 scope

| Area | Status |
| --- | --- |
| App shell (sidebar + header) | Validated |
| Medical Information inquiry intake & detail workflow | Validated |
| Evidence library (illustrative metadata) | Validated (sample only) |
| PostgreSQL schema + RLS migrations | Validated (apply to your project) |
| Demo mode with seeded synthetic data | Validated |
| Field Medical module | Scaffold / planned |
| OpenAI medical response generation | Not implemented (no auto-release) |

### Workflow states

`draft` → `submitted` → `evidence_review` → `response_drafted` → `medical_review` → `approved` → `closed`

Also: `rejected`, `needs_revision` (with transition guards).

**Only `medical_reviewer` or `admin` may approve.**

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Lucide
- Supabase PostgreSQL + Auth (optional)
- Zod + React Hook Form
- Vitest + Playwright

No Express, Prisma, or Inngest in V1.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without Supabase env vars the app runs in **demo mode**.

### Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | For persistence | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For persistence | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional admin ops | **Server-only** — never ship to the browser |

If URL + anon key are missing, MedIntel uses in-memory seeded fictional data and labels it clearly as non-persisted.

### Database

Apply migrations in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`

Then create Auth users and matching `profiles` rows with roles:
`admin`, `medical_reviewer`, `medical_information_specialist`, `msl`, `field_director`.

## Architecture

```
src/
  app/                 # App Router pages + server actions
  components/          # Shell, shared UI, inquiry forms
  domain/              # Types, Zod schemas, workflow, RBAC
  services/            # Business logic (no UI)
  lib/                 # Supabase clients, demo store, session
supabase/migrations/   # Schema + RLS
tests/                 # Vitest unit tests
e2e/                   # Playwright smoke tests
```

- Server Components by default; client components only for forms/navigation.
- Zod schemas and workflow transitions are centralized under `src/domain/`.
- Mutations go through server actions → services (authorization + audit).
- Retrieved scientific content is treated as untrusted; sample evidence is labeled `illustrative_unverified` or `planned`.

## Scripts

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

## Security

- No real patient/PHI data.
- Service-role key is never imported into client modules.
- Server-side authorization for transitions; RLS + DB trigger reinforce approve-only roles.
- Audit events recorded for consequential workflow transitions.
- AI-generated medical responses are not auto-released (feature not implemented).

## Known limitations

- Demo mode state lives in the Node process and resets on restart.
- Supabase Auth UI / invite flows are not built; connect your own auth when configuring Supabase.
- Evidence catalog does not retrieve live literature APIs.
- Field Medical competencies, simulations, and coaching are types/schema placeholders.
- Citations in seed data are fictional illustrations — not real publications.

## Routes

- `/dashboard`
- `/medical-information`
- `/medical-information/inquiries/new`
- `/medical-information/inquiries/[id]`
- `/field-medical`
- `/evidence`
- `/settings`
