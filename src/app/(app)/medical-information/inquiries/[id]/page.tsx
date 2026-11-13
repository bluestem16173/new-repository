import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkflowActions } from "@/components/inquiries/workflow-actions";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WORKFLOW_STATUS_LABELS } from "@/domain/workflow";
import { renderAppPage } from "@/lib/page";
import { getCurrentUser } from "@/lib/session";
import { getInquiryById } from "@/services/inquiries";
import { getRuntimeMode } from "@/lib/supabase/env";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InquiryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [inquiry, user] = await Promise.all([
    getInquiryById(id),
    getCurrentUser(),
  ]);

  if (!inquiry) {
    notFound();
  }

  const mode = getRuntimeMode();

  return renderAppPage(
    inquiry.referenceCode,
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusIndicator status={inquiry.status} />
            <Badge variant="outline" className="capitalize">
              {inquiry.priority} priority
            </Badge>
            {mode === "demo" ? (
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-900"
              >
                Demo · not persisted
              </Badge>
            ) : null}
          </div>
          <h2 className="max-w-3xl text-xl font-semibold tracking-tight">
            {inquiry.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            Lifecycle: {WORKFLOW_STATUS_LABELS[inquiry.status]}
          </p>
        </div>
        <Button
          variant="outline"
          render={<Link href="/medical-information" />}
        >
          Back to list
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Question</CardTitle>
              <CardDescription>
                Synthetic Medical Information content only
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {inquiry.questionText}
              </p>
              <Separator />
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Product</dt>
                  <dd className="font-medium">{inquiry.productName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Therapeutic area</dt>
                  <dd className="font-medium">{inquiry.therapeuticArea}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Requester</dt>
                  <dd className="font-medium">
                    {inquiry.requesterName} ({inquiry.requesterType})
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Organization</dt>
                  <dd className="font-medium">
                    {inquiry.requesterOrganization ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Channel</dt>
                  <dd className="font-medium capitalize">
                    {inquiry.channel.replace("_", " ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Submitted</dt>
                  <dd className="font-medium">
                    {inquiry.submittedAt
                      ? new Date(inquiry.submittedAt).toLocaleString()
                      : "Not submitted"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Evidence references</CardTitle>
              <CardDescription>
                Retrieved scientific content is untrusted until validated. Sample
                links are illustrative.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inquiry.citations.length === 0 ? (
                <EmptyState
                  title="No evidence linked"
                  description="Attach illustrative or validated sources during evidence review."
                  className="py-8"
                />
              ) : (
                <ul className="space-y-3">
                  {inquiry.citations.map((citation) => (
                    <li
                      key={citation.id}
                      className="rounded-lg border px-3 py-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{citation.document.title}</p>
                        <Badge variant="outline">
                          {citation.document.trustLabel.replaceAll("_", " ")}
                        </Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {citation.document.sourceName}
                        {citation.document.publicationYear
                          ? ` · ${citation.document.publicationYear}`
                          : ""}
                      </p>
                      {citation.relevanceNote ? (
                        <p className="mt-2">{citation.relevanceNote}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Review status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inquiry.responseDraft ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Current response draft
                  </p>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm">
                    {inquiry.responseDraft}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No response draft yet.
                </p>
              )}
              {inquiry.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No formal review decisions recorded.
                </p>
              ) : (
                <ul className="space-y-2">
                  {inquiry.reviews.map((review) => (
                    <li
                      key={review.id}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      <span className="font-medium capitalize">
                        {review.outcome.replace("_", " ")}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {new Date(review.decidedAt).toLocaleString()}
                      </span>
                      {review.comments ? (
                        <p className="mt-1 text-muted-foreground">
                          {review.comments}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {inquiry.rejectionReason ? (
                <p className="text-sm text-rose-800">
                  Rejection reason: {inquiry.rejectionReason}
                </p>
              ) : null}
              {inquiry.revisionNotes ? (
                <p className="text-sm text-orange-900">
                  Revision notes: {inquiry.revisionNotes}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Workflow actions</CardTitle>
              <CardDescription>
                Only medical_reviewer or admin may approve. Every transition is
                audited.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowActions
                inquiryId={inquiry.id}
                currentStatus={inquiry.status}
                existingResponseDraft={inquiry.responseDraft}
                role={user.role}
              />
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Audit timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {inquiry.auditEvents.length === 0 ? (
                <EmptyState
                  title="No audit events"
                  description="Consequential transitions will appear here."
                  className="py-8"
                />
              ) : (
                <ol className="space-y-3">
                  {inquiry.auditEvents.map((event) => (
                    <li key={event.id} className="border-l-2 border-border pl-3">
                      <p className="text-sm font-medium">{event.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.fromStatus ?? "—"} → {event.toStatus ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString()}
                        {event.actorRole ? ` · ${event.actorRole}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>,
  );
}
