import { Badge } from "@/components/ui/badge";
import type { InquiryStatus } from "@/domain/types";
import { WORKFLOW_STATUS_LABELS } from "@/domain/workflow";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<InquiryStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  submitted: "bg-sky-50 text-sky-800 border-sky-200",
  evidence_review: "bg-cyan-50 text-cyan-900 border-cyan-200",
  response_drafted: "bg-teal-50 text-teal-900 border-teal-200",
  medical_review: "bg-amber-50 text-amber-900 border-amber-200",
  approved: "bg-emerald-50 text-emerald-900 border-emerald-200",
  closed: "bg-zinc-100 text-zinc-700 border-zinc-200",
  rejected: "bg-rose-50 text-rose-900 border-rose-200",
  needs_revision: "bg-orange-50 text-orange-900 border-orange-200",
};

interface StatusIndicatorProps {
  status: InquiryStatus;
  className?: string;
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", STATUS_STYLES[status], className)}
    >
      {WORKFLOW_STATUS_LABELS[status]}
    </Badge>
  );
}
