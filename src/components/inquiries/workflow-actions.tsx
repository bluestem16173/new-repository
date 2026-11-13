"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { InquiryStatus, UserRole } from "@/domain/types";
import { canAdvanceWorkflow } from "@/domain/authorization";
import {
  getAllowedTransitions,
  WORKFLOW_STATUS_LABELS,
} from "@/domain/workflow";
import { transitionInquiryAction } from "@/app/actions/inquiries";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface WorkflowActionsProps {
  inquiryId: string;
  currentStatus: InquiryStatus;
  existingResponseDraft: string | null;
  role: UserRole;
}

export function WorkflowActions({
  inquiryId,
  currentStatus,
  existingResponseDraft,
  role,
}: WorkflowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [comments, setComments] = useState("");
  const [responseDraft, setResponseDraft] = useState(
    existingResponseDraft ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allowed = getAllowedTransitions(currentStatus).filter((to) =>
    canAdvanceWorkflow(role, currentStatus, to),
  );

  if (allowed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No further transitions are available for your role from{" "}
        {WORKFLOW_STATUS_LABELS[currentStatus]}.
      </p>
    );
  }

  const runTransition = (toStatus: InquiryStatus) => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await transitionInquiryAction({
        inquiryId,
        toStatus,
        comments: comments || undefined,
        responseDraft: responseDraft || undefined,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage(result.message);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="responseDraft">Response draft</Label>
        <Textarea
          id="responseDraft"
          rows={5}
          value={responseDraft}
          onChange={(e) => setResponseDraft(e.target.value)}
          placeholder="Draft Medical Information response (not auto-released; requires medical review approval)."
        />
        <p className="text-xs text-muted-foreground">
          AI-generated medical responses are not implemented for auto-release in
          Phase 1. Human review is required before approval.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comments">Transition comments</Label>
        <Textarea
          id="comments"
          rows={2}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Optional notes for audit trail / revision request"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {allowed.map((to) => (
          <Button
            key={to}
            type="button"
            variant={
              to === "approved"
                ? "default"
                : to === "rejected"
                  ? "destructive"
                  : "outline"
            }
            disabled={pending}
            onClick={() => runTransition(to)}
          >
            Move to {WORKFLOW_STATUS_LABELS[to]}
          </Button>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-emerald-800" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
