import { Badge } from "@/components/ui/badge";
import {
  AGENT_STATUS_LABELS,
  type AgentStatus,
} from "@/domain/agents/registry";
import { cn } from "@/lib/utils";

export function AgentStatusBadge({
  status,
  className,
}: {
  status: AgentStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border font-medium",
        status === "active" &&
          "border-emerald-200 bg-emerald-50 text-emerald-900",
        status === "in_development" &&
          "border-amber-200 bg-amber-50 text-amber-950",
        status === "planned" && "border-[#E5E7EB] bg-[#F8FAFC] text-[#17212B]/70",
        className,
      )}
    >
      {AGENT_STATUS_LABELS[status]}
    </Badge>
  );
}
