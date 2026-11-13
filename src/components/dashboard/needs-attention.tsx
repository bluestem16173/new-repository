import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MedicalInquiry } from "@/domain/types";

interface NeedsAttentionProps {
  inquiries: MedicalInquiry[];
}

function formatUpdatedAt(iso: string): string {
  const updated = new Date(iso);
  if (Number.isNaN(updated.getTime())) return "Unknown update time";
  return `Updated ${updated.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function NeedsAttention({ inquiries }: NeedsAttentionProps) {
  return (
    <Card className="h-full rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-[#10243A]">
          Needs attention
        </CardTitle>
        <CardDescription className="text-sm text-[#10243A]/60">
          Medical review, revision, and response follow-ups
        </CardDescription>
      </CardHeader>
      <CardContent>
        {inquiries.length === 0 ? (
          <EmptyState
            title="All clear"
            description="No inquiries currently require medical review or revision."
            icon={<CheckCircle2 className="size-5 text-[#0F9D92]" />}
            className="border-[#10243A]/10 bg-[#F3F6FA] py-10"
          />
        ) : (
          <ul className="divide-y divide-[#10243A]/8" aria-label="Action queue">
            {inquiries.map((inquiry) => (
              <li key={inquiry.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  href={`/medical-information/inquiries/${inquiry.id}`}
                  className="group flex items-start justify-between gap-3 rounded-lg outline-none transition-colors hover:bg-[#F3F6FA] focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 focus-visible:ring-offset-2"
                >
                  <div className="min-w-0 space-y-1.5 p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#2563EB] group-hover:underline">
                        {inquiry.referenceCode}
                      </span>
                      <StatusIndicator status={inquiry.status} />
                    </div>
                    <p className="line-clamp-2 text-sm leading-relaxed text-[#10243A]">
                      {inquiry.title}
                    </p>
                    <p className="text-xs text-[#10243A]/55">
                      {inquiry.therapeuticArea} ·{" "}
                      {formatUpdatedAt(inquiry.updatedAt)}
                    </p>
                  </div>
                  <ArrowRight
                    className="mt-3 mr-2 size-4 shrink-0 text-[#10243A]/35 transition-transform group-hover:translate-x-0.5 group-hover:text-[#2563EB]"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
