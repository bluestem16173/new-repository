import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import type { DataRoomPackage } from "@/domain/data-room/types";
import { Badge } from "@/components/ui/badge";

interface DataRoomPackageCardProps {
  pkg: DataRoomPackage;
}

export function DataRoomPackageCard({ pkg }: DataRoomPackageCardProps) {
  return (
    <Link
      href={`/data-room/${pkg.id}`}
      className="group block rounded-xl border border-[#E5E7EB] bg-white p-5 outline-none transition-all hover:border-[#2563EB]/35 hover:shadow-[0_8px_24px_rgba(23,33,43,0.06)] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
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
              className="border-[#DBEAFE] bg-[#EFF6FF] font-medium text-[#1D4ED8]"
            >
              <Lock className="size-3" aria-hidden />
              Auth-gated
            </Badge>
            {pkg.generationSource === "openai_live" ? (
              <Badge className="bg-[#2563EB] font-medium text-white">
                Live OpenAI
              </Badge>
            ) : null}
            {pkg.generationSource === "fixture_fallback_labeled" ? (
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 font-medium text-amber-950"
              >
                Labeled fallback
              </Badge>
            ) : null}
          </div>
          <h3 className="text-[16px] font-semibold text-[#17212B] group-hover:text-[#1D4ED8]">
            {pkg.title}
          </h3>
          <p className="max-w-2xl text-[13px] leading-relaxed text-[#17212B]/65">
            {pkg.summary}
          </p>
        </div>
        <ArrowUpRight className="size-4 text-[#17212B]/35 transition-colors group-hover:text-[#2563EB]" />
      </div>
      <dl className="mt-4 grid gap-2 text-[12px] text-[#17212B]/55 sm:grid-cols-3">
        <div>
          <dt className="font-medium text-[#17212B]/45">Sender</dt>
          <dd>{pkg.senderDisplayName}</dd>
        </div>
        <div>
          <dt className="font-medium text-[#17212B]/45">Sections</dt>
          <dd>{pkg.sections.length}</dd>
        </div>
        <div>
          <dt className="font-medium text-[#17212B]/45">Sent</dt>
          <dd>{new Date(pkg.createdAt).toLocaleString()}</dd>
        </div>
      </dl>
    </Link>
  );
}
