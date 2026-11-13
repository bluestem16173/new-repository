import { AgentCard } from "@/components/agents/agent-card";
import { ScientificSection } from "@/components/scientific/scientific-section";
import {
  AGENT_STATUS_LABELS,
  listAgents,
  type AgentStatus,
} from "@/domain/agents/registry";
import { renderAppPage } from "@/lib/page";

export default async function AgentsCenterPage() {
  const agents = listAgents();
  const counts = agents.reduce(
    (acc, agent) => {
      acc[agent.status] += 1;
      return acc;
    },
    { active: 0, in_development: 0, planned: 0 } satisfies Record<
      AgentStatus,
      number
    >,
  );

  return renderAppPage(
    "AI Agent Center",
    <div className="mx-auto w-full max-w-[1200px] space-y-10 bg-white px-1 py-2">
      <header className="space-y-3">
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#17212B]">
          AI Agent Center
        </h2>
        <p className="max-w-3xl text-[16px] leading-[1.65] text-[#17212B]/70">
          Fifteen MedIntel agents spanning evidence, Medical Information, Field
          Medical, safety, and operations. Status labels reflect genuine
          implementation — Active only when a real workflow is functional.
        </p>
        <p className="text-[14px] text-[#17212B]/60">
          {counts.active} {AGENT_STATUS_LABELS.active} ·{" "}
          {counts.in_development} {AGENT_STATUS_LABELS.in_development} ·{" "}
          {counts.planned} {AGENT_STATUS_LABELS.planned}
        </p>
      </header>

      <div
        className="border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[14px] leading-relaxed text-[#17212B]/80"
        role="status"
      >
        Demo portfolio only. Agents do not auto-approve medical responses,
        readiness, or regulatory reporting. Planned controls are clearly labeled
        and not presented as functional.
      </div>

      <ScientificSection
        title="Agent roster"
        description="Select an agent for responsibilities, capabilities, permitted tools, and links to existing workflows."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </ScientificSection>
    </div>,
  );
}
