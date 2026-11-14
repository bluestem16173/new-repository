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

## Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Frontend fixture/adapter coverage: `tests/workflow-studio.test.ts`.

## Merge readiness

- Isolated feature branch for visual evaluation
- **Do not merge / deploy** until product review after Auth stack stabilization (per program notes)
- No PR required for overnight evaluation unless explicitly requested
