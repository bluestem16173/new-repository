"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideReadinessAction } from "@/app/actions/field-medical";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReadinessDecisionForm({
  mslId,
  eligible,
  alreadyApproved,
  blockingMissing,
}: {
  mslId: string;
  eligible: boolean;
  alreadyApproved: boolean;
  blockingMissing: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        setMessage(null);
        startTransition(async () => {
          const result = await decideReadinessAction({
            mslId,
            outcome: String(fd.get("outcome")),
            rationale: String(fd.get("rationale")),
            evidenceSummary: String(fd.get("evidenceSummary") || "") || null,
          });
          if (!result.ok) {
            setError(result.message);
            return;
          }
          setMessage(result.message);
          router.refresh();
        });
      }}
    >
      <p className="text-sm text-[#10243A]/70">
        Eligibility (separate from approval):{" "}
        <span className="font-medium text-[#10243A]">
          {alreadyApproved
            ? "Already approved"
            : eligible
              ? "Eligible"
              : "Not eligible"}
        </span>
      </p>
      {!eligible && !alreadyApproved ? (
        <p className="text-xs text-amber-800">
          Blocking requirements: {blockingMissing.join(", ") || "none listed"}
        </p>
      ) : null}
      <div className="space-y-1">
        <Label htmlFor="outcome">Decision</Label>
        <select
          id="outcome"
          name="outcome"
          className="h-9 w-full rounded-lg border border-[#10243A]/15 bg-white px-3 text-sm"
          defaultValue={eligible ? "approved" : "deferred"}
        >
          <option value="approved">Approve</option>
          <option value="deferred">Defer</option>
          <option value="denied">Deny</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="rationale">Rationale</Label>
        <Textarea id="rationale" name="rationale" required minLength={8} rows={3} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="evidenceSummary">Evidence summary</Label>
        <Textarea id="evidenceSummary" name="evidenceSummary" rows={2} />
      </div>
      <Button
        type="submit"
        disabled={pending || alreadyApproved}
        className="bg-[#2563EB] hover:bg-[#1D4ED8]"
      >
        {pending ? "Recording…" : "Record readiness decision"}
      </Button>
      <p className="text-xs text-[#10243A]/55">
        Requires admin, field_director, or medical_reviewer. MSL self-approval is
        blocked. Switch demo identity in Settings to test authorization.
      </p>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-800" role="status">{message}</p> : null}
    </form>
  );
}
