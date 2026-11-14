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

- Supabase migrations / schemas / RLS
- API routes
- Auth logic / authorization matrices
- AI gateway
- Agent execution services
- Agent registry contents (read-only usage of ids/icons/names)

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
