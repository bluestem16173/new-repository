"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { recordKnowledgeReuseAction } from "@/app/actions/knowledge";
import { Button } from "@/components/ui/button";
import type { KnowledgeMatchDecision } from "@/domain/knowledge/types";

const DECISIONS: Array<{ value: KnowledgeMatchDecision; label: string }> = [
  { value: "accepted", label: "Accept reuse" },
  { value: "adapted", label: "Adapt" },
  { value: "rejected", label: "Reject match" },
  { value: "escalated", label: "Escalate" },
];

export function KnowledgeReuseActions({
  knowledgeItemId,
  inquiryId,
  matchId,
}: {
  knowledgeItemId: string;
  inquiryId?: string | null;
  matchId?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function record(decision: KnowledgeMatchDecision) {
    setMessage(null);
    startTransition(async () => {
      const result = await recordKnowledgeReuseAction({
        knowledgeItemId,
        inquiryId: inquiryId ?? null,
        matchId: matchId ?? null,
        decision,
        verificationNotes: notes || null,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(`Recorded ${decision}. Not sent to any HCP.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] p-4">
      <p className="text-[14px] leading-relaxed text-[#17212B]/75">
        Context verification required. Recording a decision does not transmit
        content externally.
      </p>
      <label className="block space-y-1 text-[13px] text-[#17212B]/70">
        Verification notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] text-[#17212B] outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {DECISIONS.map((decision) => (
          <Button
            key={decision.value}
            type="button"
            variant={decision.value === "accepted" ? "default" : "outline"}
            className={
              decision.value === "accepted"
                ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                : "border-[#E5E7EB]"
            }
            disabled={pending}
            onClick={() => record(decision.value)}
          >
            {decision.label}
          </Button>
        ))}
      </div>
      {message ? (
        <p className="text-sm text-[#17212B]/70" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
