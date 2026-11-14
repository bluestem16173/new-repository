"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { sendToDataRoomAction } from "@/app/actions/data-room";
import type { MockReportWorkflowId } from "@/domain/workflow-studio/mock-report";
import type { ReportSectionViewModel } from "@/components/workflow-studio/report-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SendToDataRoomButtonProps {
  workflowId: MockReportWorkflowId;
  title: string;
  summary: string;
  sections: ReportSectionViewModel[];
}

export function SendToDataRoomButton({
  workflowId,
  title,
  summary,
  sections,
}: SendToDataRoomButtonProps) {
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState(
    "jordan.lee@demo.medintel.local, sam.patel@demo.medintel.local",
  );
  const [error, setError] = useState<string | null>(null);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [persistenceNote, setPersistenceNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSend() {
    setError(null);
    setPackageId(null);
    setPersistenceNote(null);
    const accessEmails = emails
      .split(/[,;\s]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    startTransition(async () => {
      const result = await sendToDataRoomAction({
        title,
        summary,
        workflowType: workflowId,
        sections: sections.map((section) => ({
          id: String(section.id),
          title: section.title,
          body: section.body,
          agentIds: section.agentIds,
        })),
        accessEmails,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setPackageId(result.package.id);
      if (result.package.persistence === "demo_memory") {
        setPersistenceNote(
          "Saved to demo memory (Data Room tables missing or demo mode). Apply migration 013 for durable org-shared packages.",
        );
      }
      setOpen(false);
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="border-[#2563EB]/30 bg-white text-[#1D4ED8] hover:bg-[#EEF4FF]"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <PackagePlus className="size-4" aria-hidden />
        Send to Data Room
      </Button>

      {open ? (
        <div className="w-full max-w-sm space-y-2 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-sm sm:w-80">
          <p className="text-[12px] leading-relaxed text-[#17212B]/65">
            Creates an authenticated Data Room package for colleagues (same org
            or explicit invite emails). Illustrative Demo only — no PHI.
          </p>
          <label className="block space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#17212B]/50">
              Invite emails (demo)
            </span>
            <Input
              value={emails}
              onChange={(event) => setEmails(event.target.value)}
              className="h-8 text-[12px]"
              placeholder="colleague@example.com"
            />
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              disabled={pending}
              onClick={onSend}
            >
              {pending ? "Sending…" : "Send package"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="text-[12px] text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      {packageId ? (
        <div className="space-y-1" role="status">
          <p className="text-[12px] text-[#17212B]/70">
            Package sent.{" "}
            <Link
              href={`/data-room/${packageId}`}
              className="font-medium text-[#2563EB] hover:underline"
            >
              Open in Data Room
            </Link>
          </p>
          {persistenceNote ? (
            <p className="text-[11px] leading-relaxed text-amber-900">
              {persistenceNote}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
