import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { DataRoomPackage } from "@/domain/data-room/types";
import { AgentOwnershipChips } from "@/components/workflow-studio/agent-ownership-chips";
import { DemoOversightBanner } from "@/components/workflow-studio/demo-oversight-banner";
import { Badge } from "@/components/ui/badge";

interface DataRoomPackageDetailProps {
  pkg: DataRoomPackage;
}

export function DataRoomPackageDetail({ pkg }: DataRoomPackageDetailProps) {
  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-6 bg-white px-1 py-2">
      <Link
        href="/data-room"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#2563EB] hover:underline"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to Data Room
      </Link>

      <DemoOversightBanner label={pkg.oversightLabel} />

      <header className="space-y-3 rounded-2xl border border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFF] via-white to-[#F7FAFC] p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 font-medium text-amber-950"
          >
            Illustrative Demo
          </Badge>
          <Badge
            variant="outline"
            className="border-[#E5E7EB] font-medium text-[#17212B]/60"
          >
            {pkg.workflowType}
          </Badge>
          <Badge
            variant="outline"
            className="border-[#E5E7EB] font-medium text-[#17212B]/60"
          >
            {pkg.persistence === "demo_memory"
              ? "Demo memory store"
              : "Supabase + RLS"}
          </Badge>
        </div>
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#17212B]">
          {pkg.title}
        </h2>
        <p className="max-w-3xl text-[15px] leading-relaxed text-[#17212B]/70">
          {pkg.summary}
        </p>
        <dl className="grid gap-3 text-[13px] text-[#17212B]/65 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#17212B]/45">
              Sender
            </dt>
            <dd className="mt-1">
              {pkg.senderDisplayName} ({pkg.senderEmail})
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#17212B]/45">
              Access list
            </dt>
            <dd className="mt-1">
              {pkg.accessEmails.length > 0
                ? pkg.accessEmails.join(", ")
                : "Sender / same organization only"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#17212B]/45">
              Created
            </dt>
            <dd className="mt-1">{new Date(pkg.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#17212B]/45">
              Audit fields
            </dt>
            <dd className="mt-1">
              id={pkg.id.slice(0, 8)}… · sections={pkg.sections.length}
            </dd>
          </div>
        </dl>
      </header>

      <div className="space-y-3">
        {pkg.sections.map((section, index) => (
          <article
            key={`${section.id}-${index}`}
            className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_0_rgba(23,33,43,0.04)]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#17212B]/55">
                Section {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-[15px] font-semibold text-[#17212B]">
                {section.title}
              </h3>
            </div>
            <div className="mt-2">
              <AgentOwnershipChips agentIds={section.agentIds} />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-[#17212B]/75">
              {section.body}
            </p>
          </article>
        ))}
      </div>

      <p className="rounded-xl border border-dashed border-[#E5E7EB] px-4 py-3 text-[12px] text-[#17212B]/55">
        {pkg.demoLabel}
      </p>
    </div>
  );
}
