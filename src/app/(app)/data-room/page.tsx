import { connection } from "next/server";
import Link from "next/link";
import { Archive } from "lucide-react";
import { DataRoomPackageCard } from "@/components/data-room/data-room-package-card";
import { DemoOversightBanner } from "@/components/workflow-studio/demo-oversight-banner";
import { DATA_ROOM_DEMO_NOTICE } from "@/domain/data-room/types";
import { renderAppPage } from "@/lib/page";
import { getCurrentUser } from "@/lib/session";
import { getRuntimeMode } from "@/lib/supabase/env";
import { listAccessibleDataRoomPackages } from "@/services/data-room/packages";

async function DataRoomPageContent() {
  await connection();
  const user = await getCurrentUser();
  const mode = getRuntimeMode();
  const packages = await listAccessibleDataRoomPackages({ user });

  return renderAppPage(
    "Data Room",
    <div className="mx-auto w-full max-w-[1100px] space-y-8 bg-white px-1 py-2">
      <header className="space-y-3">
        <p className="text-[12px] font-medium uppercase tracking-wide text-[#2563EB]">
          Shared retrieval
        </p>
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#17212B] sm:text-[2rem]">
          Data Room
        </h2>
        <p className="max-w-3xl text-[16px] leading-[1.65] text-[#17212B]/70">
          Authenticated colleagues retrieve Workflow Studio packages you send
          here. Access is limited to the sender, same-organization members, or
          an explicit invite email list — never a public anonymous dump.
        </p>
      </header>

      <DemoOversightBanner label={DATA_ROOM_DEMO_NOTICE} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] text-[#17212B]/70">
          <Archive className="size-4 text-[#2563EB]" aria-hidden />
          {packages.length} accessible package
          {packages.length === 1 ? "" : "s"} · runtime {mode}
          {mode === "demo" ? " (in-memory)" : " (RLS)"}
        </div>
        <Link
          href="/workflow-studio"
          className="text-[13px] font-medium text-[#2563EB] hover:underline"
        >
          Open Workflow Studio
        </Link>
      </div>

      {packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-[#FAFBFC] px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-[#17212B]">
            No packages yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[#17212B]/60">
            Generate or open a KOL / Manager deliverable in Workflow Studio,
            then use <span className="font-medium">Send to Data Room</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg) => (
            <DataRoomPackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}
    </div>,
  );
}

export default async function DataRoomPage() {
  return <DataRoomPageContent />;
}
