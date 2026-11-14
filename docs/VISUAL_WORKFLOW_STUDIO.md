# Visual Workflow Studio

Frontend-only prototype for **MedIntel Workflow Studio** — role-based guided pathways across the sixteen-agent portfolio.

**Demo Preview — No Live Agent Execution.** Illustrative Demo Data only. Works without API keys. Does not call the AI gateway, agent execution services, or mock network backends.

## Route

- App path: `/workflow-studio`
- Sidebar: **Workflow Studio** (Demo badge)
- Branch intended for morning visual evaluation: `feature/medintel-visual-workflow-studio`

## What it is

Users pick an objective by role. MedIntel presents a connected agent pathway on a canvas. Selecting a node opens a details panel (task, status, validation, input/output). Each pathway ends in an illustrative deliverable.

Role selection is a **UI preference only** — it does not alter authorization, RLS, or session roles.

## Roles and workflows

| Role | Pathway | Illustrative deliverable |
| --- | --- | --- |
| MSL | KOL Meeting Prep | Synthetic KOL briefing packet (Aurelia™-X fictional product) |
| MA Manager | Manager Education | Team education / coaching plan |
| MI Specialist | MI Inquiry | Provisional MI response draft for review |
| Leadership | Leadership Briefing | Leadership briefing summary |

All product names, KOLs, metrics, and citations are fictional/synthetic. No fabricated real-world literature citations.

## Demo mode

**Explore Demo Workflow** opens the KOL Meeting Prep pathway with guided navigation:

1. Select the demo pathway
2. Step through agent nodes (inspect details)
3. View the deliverable
4. Restart

There is **no** simulated network latency, fake streaming AI, fake token counters, or fake run timers.

### Structured deliverables + agent follow-up (KOL Meeting Prep + Manager Education)

Pathway deliverables and **Generate mock report** share a polished packet UI:

- Typed sections (Visit Context, Key Evidence, Talking Points, Coaching Plan, etc.)
- Owning-agent chips linking to `/agents/[id]`
- **Evaluate with agent** / **Add to agent task** → demo follow-up task list (validated server-side, persisted in browser localStorage; clearly labeled demo)
- Illustrative Demo / human oversight banners retained
- **Send to Data Room** creates an auth-gated retrieval package for colleagues
- **Run evaluation walkthrough** (KOL + Manager): auto-assigns each section to its primary owning agent, steps through short agent evaluations (fixture or OpenAI, evidence-only context), highlights the canvas agent node, then assembles a polished **Final Report** consolidating packet + evaluations (optional Data Room send)

Mock report generation prefers structured JSON sections + `agentIds` from OpenAI (`response_format: json_object`), with graceful fixture-compose fallback.

Never put OpenAI credentials in `NEXT_PUBLIC_*`.

### Data Room

- Routes: `/data-room`, `/data-room/[packageId]`
- Access: authenticated sender, same organization (Supabase + RLS), or explicit invite email list
- Demo mode: in-memory store (not durable across restarts)
- Migration: `supabase/migrations/013_data_room_packages.sql` (does not weaken existing RLS)
- No public anonymous medical content dump; no PHI

### Live staged OpenAI session (employer-wow path)

On `/data-room` and KOL/Manager Workflow Studio pathways:

1. **Start live session** — multi-stage pipeline (Literature Scout → … → Final Report → Data Room)
2. Each stage calls OpenAI (`OPENAI_API_KEY` or `OPENAI_API_Key`) over allowlisted fixture RAG context
3. Dense compiled cards with agent attribution + Illustrative Demo / oversight labels
4. **You must Approve** each stage before the next runs (mobile sticky approve bar)
5. Session state persists in browser localStorage (phone refresh safe) + server run mirror
6. Missing key / API errors fail clearly; optional **labeled fixture fallback** only when you opt in
7. Final approve compiles a Data Room package with Live OpenAI / labeled-fallback badges

**Preview:** after setting the OpenAI key in Vercel Preview env, redeploy so live stages can call the provider. Never put secrets in `NEXT_PUBLIC_*`.

## Canvas

- Library: `@xyflow/react` (React Flow 12)
- Desktop: horizontal pathway
- Mobile / compact viewports: vertical pathway
- Nodes show agent name, icon, task, status, input/output summary, and validation
- Nodes are not live-executable; dragging/connecting is disabled

## Architecture (frontend)

```
src/domain/workflow-studio/
  types.ts          # Role / workflow / adapter contracts
  fixtures.ts       # Illustrative Demo Data
  adapter.ts        # DemoWorkflowOrchestrationAdapter
  labels.ts         # Status / validation labels

src/components/workflow-studio/
  workflow-studio-app.tsx
  workflow-canvas.tsx
  agent-flow-node.tsx
  details-panel.tsx
  deliverable-panel.tsx

src/app/(app)/workflow-studio/page.tsx
```

### Orchestration adapter

`WorkflowOrchestrationAdapter` is the future boundary for live orchestration. The demo implementation:

- Reads local fixtures only
- Reports `supportsLiveExecution() === false`
- Does **not** modify `domain/agents/registry.ts`

Swap via `setWorkflowOrchestrationAdapter` in tests or a future integration — do not introduce mock API routes for this prototype.

## Out of scope (intentionally untouched)

- Live agent execution / orchestration backends
- Agent registry contents (read-only usage of ids/icons/names)
- Weakening auth or RLS for convenience

Additive Data Room migration `013_data_room_packages.sql` is included; apply only through normal migration review.

## Preview locally

From the isolated worktree:

```bash
cd /path/to/medintel-visual-workflow-studio
npm install
npm run dev
```

Open [http://localhost:3000/workflow-studio](http://localhost:3000/workflow-studio).

Leave Supabase public env unset for local demo mode (default).

## Hosted Vercel Preview / Production

### Why Preview showed “Authentication configuration is unavailable”

Vercel builds run with `NODE_ENV=production`. The edge proxy fails closed when public Supabase env is missing or partial — **except** `/workflow-studio`, which is allowed in illustrative **demo-read** mode when **both** public Supabase variables are fully unset.

Other routes (`/dashboard`, Medical Information, Field Medical, etc.) stay closed until Auth is configured. When Supabase **is** configured, `/workflow-studio` is **not** an auth bypass — it requires a session like other app routes.

### Required public env (Preview + Production)

Set these in the Vercel project for **Preview** and **Production** (no secrets in git):

| Variable | Required for Auth | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes (preferred) | Or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `NEXT_PUBLIC_SITE_URL` | Yes for Auth redirects | Canonical HTTPS origin for that deployment |
| `MEDINTEL_AUTH_RECOVERY_SECRET` | Yes for recovery cookies | Server-only; 32+ random characters |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-only admin ops — never `NEXT_PUBLIC_*` |

### Exact Vercel dashboard steps

1. Open the **medintel** project in Vercel → **Settings** → **Environment Variables**.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`) using the same values as the working Production deployment (or the Supabase project API settings). Enable **Preview** and **Production**.
3. Add `NEXT_PUBLIC_SITE_URL` for Production (e.g. `https://medintel-sigma.vercel.app`). For Preview auth redirects, either use a stable preview domain policy or rely on demo-read for Workflow Studio only.
4. Add server-only `MEDINTEL_AUTH_RECOVERY_SECRET` for Preview + Production if Auth recovery must work on that deployment.
5. **Redeploy** the Preview deployment (or push an empty commit / use Redeploy) so `NEXT_PUBLIC_*` values are baked into the build.
6. Confirm Preview `/workflow-studio` loads. With Auth env present, sign-in is required for the rest of the app.

**Without** setting Supabase public env on Preview: open `/workflow-studio` only (demo-read). Other paths return an actionable 503 naming the missing variable names (not values).

## Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Frontend fixture/adapter coverage: `tests/workflow-studio.test.ts`.  
Proxy demo-read / 503 coverage: `tests/proxy-demo-read.test.ts`.

## Merge readiness

- Isolated feature branch for visual evaluation
- Prefer Preview env parity with Production for full-app walkthroughs; Workflow Studio alone works in demo-read without secrets
