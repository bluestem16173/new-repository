import Image from "next/image";
import Link from "next/link";
import { getAgentById } from "@/domain/agents/registry";
import { cn } from "@/lib/utils";

interface AgentOwnershipChipsProps {
  agentIds: string[];
  className?: string;
}

export function AgentOwnershipChips({
  agentIds,
  className,
}: AgentOwnershipChipsProps) {
  if (agentIds.length === 0) return null;

  return (
    <ul
      className={cn("flex flex-wrap gap-1.5", className)}
      aria-label="Owning agents"
    >
      {agentIds.map((agentId) => {
        const agent = getAgentById(agentId);
        const href = agent?.route ?? `/agents/${agentId}`;
        const name = agent?.name ?? agentId;
        return (
          <li key={agentId}>
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#DCE3EE] bg-[#F7F9FC] py-0.5 pr-2.5 pl-0.5 text-[11px] font-medium text-[#17212B] transition-colors hover:border-[#2563EB]/40 hover:bg-[#EEF4FF] hover:text-[#1D4ED8]"
            >
              <span className="flex size-5 items-center justify-center overflow-hidden rounded-full border border-[#E5E7EB] bg-white">
                {agent?.icon ? (
                  <Image
                    src={agent.icon}
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                    className="size-4 object-contain"
                  />
                ) : null}
              </span>
              {name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
