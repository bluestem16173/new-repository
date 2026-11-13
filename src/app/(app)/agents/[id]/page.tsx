import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AgentStatusBadge } from "@/components/agents/agent-status-badge";
import { ScientificSection } from "@/components/scientific/scientific-section";
import { Button } from "@/components/ui/button";
import {
  AGENT_CATEGORY_LABELS,
  getAgentById,
  listAgents,
} from "@/domain/agents/registry";
import { renderAppPage } from "@/lib/page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return listAgents().map((agent) => ({ id: agent.id }));
}

export default function AgentDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={renderAppPage(
        "Agent",
        <p className="p-6 text-sm text-[#17212B]/60">Loading agent…</p>,
      )}
    >
      <AgentDetailContent params={params} />
    </Suspense>
  );
}

async function AgentDetailContent({ params }: PageProps) {
  const { id } = await params;
  const agent = getAgentById(id);
  if (!agent) notFound();

  const unavailable =
    agent.status === "planned" ||
    (agent.plannedCapabilities.length > 0 &&
      agent.implementedCapabilities.length === 0);

  return renderAppPage(
    agent.name,
    <div className="mx-auto w-full max-w-[960px] space-y-10 bg-white px-1 py-2">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative mx-auto aspect-[4/3] w-full max-w-[240px] shrink-0 overflow-hidden rounded-md bg-white sm:mx-0">
          <Image
            src={agent.icon}
            alt=""
            fill
            className="object-contain"
            sizes="240px"
            priority
          />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <AgentStatusBadge status={agent.status} />
            <span className="text-xs uppercase tracking-wide text-[#17212B]/45">
              {AGENT_CATEGORY_LABELS[agent.category]}
            </span>
          </div>
          <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#17212B]">
            {agent.name}
          </h2>
          <p className="max-w-2xl text-[16px] leading-[1.65] text-[#17212B]/70">
            {agent.description}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="outline"
              className="border-[#E5E7EB]"
              render={<Link href="/agents" />}
            >
              Back to Agent Center
            </Button>
            {agent.workflowHref && agent.status !== "planned" ? (
              <Button
                className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                render={<Link href={agent.workflowHref} />}
              >
                Open related workflow
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {unavailable ? (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] leading-relaxed text-amber-950"
          role="status"
        >
          This agent is not fully operational. Planned capabilities below are
          unavailable and must not be treated as live controls.
        </div>
      ) : null}

      <ScientificSection title="Responsibilities">
        <ul className="list-disc space-y-2 pl-5 text-[15px] leading-[1.65] text-[#17212B]/80">
          {agent.responsibilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </ScientificSection>

      <div className="grid gap-8 md:grid-cols-2">
        <ScientificSection title="Available capabilities">
          {agent.implementedCapabilities.length === 0 ? (
            <p className="text-[15px] text-[#17212B]/60">
              No capabilities are functional yet.
            </p>
          ) : (
            <ul className="list-disc space-y-2 pl-5 text-[15px] leading-[1.65] text-[#17212B]/80">
              {agent.implementedCapabilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </ScientificSection>

        <ScientificSection title="Planned capabilities">
          {agent.plannedCapabilities.length === 0 ? (
            <p className="text-[15px] text-[#17212B]/60">
              No additional capabilities planned beyond the available set.
            </p>
          ) : (
            <ul className="list-disc space-y-2 pl-5 text-[15px] leading-[1.65] text-[#17212B]/65">
              {agent.plannedCapabilities.map((item) => (
                <li key={item}>
                  <span className="mr-2 rounded border border-[#E5E7EB] bg-[#F8FAFC] px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[#17212B]/55">
                    Unavailable
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </ScientificSection>
      </div>

      <ScientificSection title="Permitted tools">
        <ul className="list-disc space-y-2 pl-5 text-[15px] leading-[1.65] text-[#17212B]/80">
          {agent.permittedTools.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </ScientificSection>

      <ScientificSection title="Review requirements">
        <ul className="list-disc space-y-2 pl-5 text-[15px] leading-[1.65] text-[#17212B]/80">
          {agent.reviewRequirements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </ScientificSection>

      {agent.workflowHref ? (
        <p className="text-[14px] text-[#17212B]/65">
          Related surface:{" "}
          <Link
            href={agent.workflowHref}
            className="font-medium text-[#2563EB] hover:underline"
          >
            {agent.workflowHref}
          </Link>
          {agent.status === "planned"
            ? " (informational link only — agent controls unavailable)"
            : null}
        </p>
      ) : null}
    </div>,
  );
}
