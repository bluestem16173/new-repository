import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkflowStatusCount } from "@/services/inquiries";
import { cn } from "@/lib/utils";

const BAR_TONES: Record<string, string> = {
  draft: "bg-[#94A3B8]",
  submitted: "bg-[#2563EB]",
  evidence_review: "bg-[#0F9D92]",
  response_drafted: "bg-[#1D4ED8]",
  medical_review: "bg-[#D97706]",
  approved: "bg-[#059669]",
  needs_revision: "bg-[#EA580C]",
  rejected: "bg-[#DC2626]",
  closed: "bg-[#64748B]",
};

interface WorkflowDistributionProps {
  items: WorkflowStatusCount[];
  totalInquiries: number;
}

export function WorkflowDistribution({
  items,
  totalInquiries,
}: WorkflowDistributionProps) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <Card className="h-full rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-[#10243A]">
          Workflow overview
        </CardTitle>
        <CardDescription className="text-sm text-[#10243A]/60">
          Inquiry distribution by current lifecycle status
          {totalInquiries > 0 ? ` · ${totalInquiries} total` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="rounded-lg bg-[#F3F6FA] px-4 py-8 text-center text-sm text-[#10243A]/60">
            No inquiries yet. Create a Medical Information inquiry to populate
            workflow status.
          </p>
        ) : (
          <ul className="space-y-4" aria-label="Inquiry status distribution">
            {items.map((item) => {
              const widthPercent = Math.max(
                (item.count / maxCount) * 100,
                item.count > 0 ? 8 : 0,
              );
              return (
                <li key={item.status} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-[#10243A]">
                      {item.label}
                    </span>
                    <span className="tabular-nums text-[#10243A]/70">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#F3F6FA]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width]",
                        BAR_TONES[item.status] ?? "bg-[#2563EB]",
                      )}
                      style={{ width: `${widthPercent}%` }}
                      role="presentation"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
