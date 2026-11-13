"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateInquiryDraftAction,
  reviewClaimAction,
} from "@/app/actions/scientific";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ResponseClaim, ResponseDraft } from "@/domain/scientific/types";

interface ClaimReviewPanelProps {
  inquiryId: string;
  questionText: string;
  drafts: ResponseDraft[];
  canReview: boolean;
  canDraft: boolean;
}

const STATUS_OPTIONS = [
  "pending",
  "supported",
  "needs_revision",
  "unsupported",
] as const;

export function ClaimReviewPanel({
  inquiryId,
  questionText,
  drafts,
  canReview,
  canDraft,
}: ClaimReviewPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localDrafts, setLocalDrafts] = useState(drafts);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const latest = localDrafts[0] ?? null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] leading-relaxed text-[#17212B]/70">
          Evidence-grounded provisional drafts with claim-to-citation mappings.
          Never auto-approved or externally released.
        </p>
        {canDraft ? (
          <Button
            disabled={pending}
            className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
            onClick={() => {
              setError(null);
              setMessage(null);
              startTransition(async () => {
                const result = await generateInquiryDraftAction(
                  inquiryId,
                  questionText,
                );
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                const draft = result.payload as ResponseDraft;
                setLocalDrafts((prev) => [draft, ...prev]);
                setMessage(result.message);
                router.refresh();
              });
            }}
          >
            Generate SI draft
          </Button>
        ) : null}
      </div>

      {!latest ? (
        <p className="text-sm text-[#17212B]/60">
          No Scientific Intelligence drafts yet for this inquiry.
        </p>
      ) : (
        <div className="space-y-4">
          {latest.safetyEventFlag ? (
            <div
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
              role="status"
            >
              Safety-event language detected. Routed for human medical
              assessment — no autonomous regulatory reporting.
            </div>
          ) : null}

          <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#17212B]/50">
              Draft v{latest.draftVersion} · evidence versions{" "}
              {latest.evidenceDocumentVersions
                .map((v) => `${v.documentId.slice(0, 8)}…@${v.version}`)
                .join(", ") || "none"}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-[1.65] text-[#17212B]">
              {latest.draftText}
            </p>
            {latest.uncertaintyNotes ? (
              <p className="mt-3 text-[14px] text-[#17212B]/70">
                <span className="font-medium">Uncertainty:</span>{" "}
                {latest.uncertaintyNotes}
              </p>
            ) : null}
            {latest.limitationsNotes ? (
              <p className="mt-1 text-[14px] text-[#17212B]/70">
                <span className="font-medium">Limitations:</span>{" "}
                {latest.limitationsNotes}
              </p>
            ) : null}
            {latest.missingEvidenceNotes ? (
              <p className="mt-1 text-[14px] text-[#17212B]/70">
                <span className="font-medium">Missing evidence:</span>{" "}
                {latest.missingEvidenceNotes}
              </p>
            ) : null}
          </div>

          <ul className="space-y-4">
            {latest.claims.map((claim) => (
              <ClaimRow
                key={claim.id}
                claim={claim}
                canReview={canReview}
                pending={pending}
                onReviewed={(updated) => {
                  setLocalDrafts((prev) =>
                    prev.map((d) =>
                      d.id !== latest.id
                        ? d
                        : {
                            ...d,
                            claims: d.claims.map((c) =>
                              c.id === updated.id ? updated : c,
                            ),
                          },
                    ),
                  );
                  router.refresh();
                }}
                onError={setError}
                onMessage={setMessage}
                startTransition={startTransition}
              />
            ))}
          </ul>
        </div>
      )}

      {message ? (
        <p className="text-sm text-[#0F9D92]" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ClaimRow({
  claim,
  canReview,
  pending,
  onReviewed,
  onError,
  onMessage,
  startTransition,
}: {
  claim: ResponseClaim;
  canReview: boolean;
  pending: boolean;
  onReviewed: (claim: ResponseClaim) => void;
  onError: (msg: string) => void;
  onMessage: (msg: string) => void;
  startTransition: (fn: () => void) => void;
}) {
  const [notes, setNotes] = useState(claim.reviewerNotes ?? "");
  const [status, setStatus] = useState(claim.status);

  return (
    <li className="rounded-lg border border-[#E5E7EB] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium text-[#17212B]">{claim.claimKey}</p>
        <Badge variant="outline" className="capitalize">
          {claim.status.replaceAll("_", " ")}
        </Badge>
      </div>
      <p className="mt-2 text-[14px] leading-relaxed text-[#17212B]/80">
        {claim.claimText}
      </p>
      <p className="mt-1 text-xs text-[#17212B]/50">
        Citations: {claim.citationPassageIds.join(", ") || "none"}
      </p>
      {claim.reviewedBy ? (
        <p className="mt-1 text-xs text-[#17212B]/55">
          Reviewed by {claim.reviewedBy}
          {claim.reviewedAt
            ? ` · ${new Date(claim.reviewedAt).toLocaleString()}`
            : ""}
        </p>
      ) : null}

      {canReview ? (
        <form
          className="mt-3 space-y-2 border-t border-[#E5E7EB] pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const result = await reviewClaimAction({
                claimId: claim.id,
                status,
                reviewerNotes: notes || null,
              });
              if (!result.ok) {
                onError(result.message);
                return;
              }
              onReviewed(result.payload as ResponseClaim);
              onMessage(result.message);
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`status-${claim.id}`}>Reviewer status</Label>
              <select
                id={`status-${claim.id}`}
                className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as ResponseClaim["status"])
                }
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor={`notes-${claim.id}`}>Reviewer notes</Label>
              <Textarea
                id={`notes-${claim.id}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={2000}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={pending}
            variant="outline"
            className="border-[#E5E7EB]"
          >
            Save claim review
          </Button>
        </form>
      ) : null}
    </li>
  );
}
