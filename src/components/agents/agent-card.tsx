import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AgentStatusBadge } from "@/components/agents/agent-status-badge";
import type { MedIntelAgent } from "@/domain/agents/registry";
import { AGENT_CATEGORY_LABELS } from "@/domain/agents/registry";
import { cn } from "@/lib/utils";

export function AgentCard({ agent }: { agent: MedIntelAgent }) {
  return (
    <Link
      href={agent.route}
      className={cn(
        "group flex h-full flex-col rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-none outline-none transition-all",
        "hover:border-[#2563EB]/35 hover:bg-[#FAFBFC] focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 focus-visible:ring-offset-2",
      )}
    >
      <div className="relative mx-auto mb-4 aspect-square w-full max-w-[148px] overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
        <Image
          src={agent.icon}
          alt=""
          fill
          className="object-contain p-2 transition-transform duration-200 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 148px"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[16px] font-semibold leading-snug tracking-tight text-[#17212B]">
            {agent.name}
          </h3>
          <ChevronRight
            className="mt-0.5 size-4 shrink-0 text-[#17212B]/35 transition-transform group-hover:translate-x-0.5 group-hover:text-[#2563EB]"
            aria-hidden
          />
        </div>
        <p className="text-[14px] leading-[1.6] text-[#17212B]/70">
          {agent.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          <AgentStatusBadge status={agent.status} />
          <span className="text-[11px] uppercase tracking-wide text-[#17212B]/45">
            {AGENT_CATEGORY_LABELS[agent.category]}
          </span>
        </div>
      </div>
    </Link>
  );
}
