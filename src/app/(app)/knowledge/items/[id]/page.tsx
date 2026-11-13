import Link from "next/link";
import { notFound } from "next/navigation";
import { KnowledgeReuseActions } from "@/components/knowledge/reuse-actions";
import { KnowledgeSubnav } from "@/components/knowledge/knowledge-subnav";
import { ScientificSection } from "@/components/scientific/scientific-section";
import { Button } from "@/components/ui/button";
import {
  canApproveKnowledgeItem,
  canRecordKnowledgeReuse,
} from "@/domain/knowledge/authorization";
import {
  KNOWLEDGE_CURRENCY_LABELS,
  KNOWLEDGE_STATUS_LABELS,
} from "@/domain/knowledge/types";
import { KnowledgeReviewActions } from "@/components/knowledge/review-actions";
import { renderAppPage } from "@/lib/page";
import { getCurrentUser } from "@/lib/session";
import { getPassageById } from "@/services/scientific/retrieval";
import {
  getCurrentVersion,
  getEvidenceLinksForItem,
  getKnowledgeItemById,
  getReviewEvents,
} from "@/services/knowledge/items";
import { listReuseEvents } from "@/services/knowledge/reuse";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function KnowledgeItemDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [item, user] = await Promise.all([
    Promise.resolve(getKnowledgeItemById(id)),
    getCurrentUser(),
  ]);
  if (!item) notFound();

  const version = getCurrentVersion(item);
  const links = getEvidenceLinksForItem(item.id, item.currentVersion);
  const reviews = getReviewEvents(item.id);
  const reuse = listReuseEvents(item.id);

  return renderAppPage(
    item.title,
    <div className="mx-auto w-full max-w-[960px] space-y-8 bg-white px-1 py-2">
      <header className="space-y-4 border-b border-[#E5E7EB] pb-6">
        <KnowledgeSubnav />
        <div className="flex flex-wrap gap-2">
          <span className="rounded border border-[#E5E7EB] bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[#17212B]/60">
            {KNOWLEDGE_STATUS_LABELS[item.status]}
          </span>
          <span className="rounded border border-[#E5E7EB] px-2 py-0.5 text-[11px] font-medium text-[#17212B]/55">
            {KNOWLEDGE_CURRENCY_LABELS[item.currencyStatus]}
          </span>
          <span className="rounded border border-[#E5E7EB] px-2 py-0.5 text-[11px] font-medium text-[#17212B]/55">
            v{item.currentVersion}
          </span>
        </div>
        <h2 className="text-[1.5rem] font-semibold tracking-tight text-[#17212B] sm:text-[1.75rem]">
          {item.title}
        </h2>
        <p className="max-w-3xl text-[15px] leading-[1.65] text-[#17212B]/70">
          {item.questionSummary}
        </p>
        <dl className="grid gap-3 text-[14px] sm:grid-cols-2">
          <div>
            <dt className="text-[#17212B]/45">Therapeutic area</dt>
            <dd className="font-medium text-[#17212B]">{item.therapeuticArea}</dd>
          </div>
          <div>
            <dt className="text-[#17212B]/45">Jurisdiction</dt>
            <dd className="font-medium text-[#17212B]">{item.jurisdiction}</dd>
          </div>
          <div>
            <dt className="text-[#17212B]/45">Product</dt>
            <dd className="font-medium text-[#17212B]">
              {item.productName ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[#17212B]/45">Indication / disease state</dt>
            <dd className="font-medium text-[#17212B]">
              {item.indication ?? "—"} / {item.diseaseState ?? "—"}
            </dd>
          </div>
        </dl>
        <p className="text-[13px] leading-relaxed text-[#17212B]/60">
          Applicability scope: {item.applicabilityScope}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-[#E5E7EB]"
            render={<Link href="/knowledge/search" />}
            role="link"
          >
            Back to search
          </Button>
          <Button
            variant="outline"
            className="border-[#E5E7EB]"
            render={<Link href="/evidence" />}
            role="link"
          >
            Evidence Library
          </Button>
        </div>
      </header>

      <ScientificSection title="Approved / draft answer">
        <p className="whitespace-pre-wrap text-[15px] leading-[1.7] text-[#17212B]/80">
          {version?.answerText ?? "No version content."}
        </p>
        {version?.uncertaintyNotes ? (
          <p className="mt-3 text-[14px] text-[#17212B]/65">
            Uncertainty: {version.uncertaintyNotes}
          </p>
        ) : null}
        {version?.limitationsNotes ? (
          <p className="mt-2 text-[14px] text-[#17212B]/65">
            Limitations: {version.limitationsNotes}
          </p>
        ) : null}
        <p className="mt-3 text-[13px] text-[#17212B]/50">
          {version?.deidentificationNotes}
        </p>
      </ScientificSection>

      <ScientificSection title="Evidence links">
        {links.length === 0 ? (
          <p className="text-[14px] text-[#17212B]/60">
            No evidence links recorded for this version.
          </p>
        ) : (
          <ul className="space-y-3">
            {links.map((link) => {
              const passage = link.siPassageId
                ? getPassageById(link.siPassageId)
                : null;
              return (
                <li
                  key={link.id}
                  className="rounded-lg border border-[#E5E7EB] px-4 py-3 text-[14px] leading-relaxed text-[#17212B]/75"
                >
                  <p className="font-medium text-[#17212B]">
                    {passage?.document.title ??
                      link.citationNote ??
                      "Evidence link"}
                  </p>
                  {passage ? (
                    <p className="mt-2 text-[#17212B]/70">
                      {passage.passage.content}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[12px] text-[#17212B]/45">
                    {passage?.document.verificationStatus ?? "unlinked"} ·{" "}
                    {link.citationNote}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </ScientificSection>

      <ScientificSection title="Review history">
        <ul className="space-y-2 text-[14px] text-[#17212B]/75">
          {reviews.map((event) => (
            <li
              key={event.id}
              className="rounded-lg border border-[#E5E7EB] px-3 py-2"
            >
              <span className="font-medium capitalize">{event.decision}</span>
              {" · "}
              {new Date(event.createdAt).toLocaleString()}
              {event.notes ? ` — ${event.notes}` : null}
            </li>
          ))}
        </ul>
        {item.status === "pending_review" &&
        canApproveKnowledgeItem(user.role) ? (
          <div className="mt-4">
            <KnowledgeReviewActions knowledgeItemId={item.id} />
          </div>
        ) : null}
      </ScientificSection>

      <ScientificSection title="Reuse activity">
        {reuse.length === 0 ? (
          <p className="text-[14px] text-[#17212B]/60">
            No reuse events recorded yet.
          </p>
        ) : (
          <ul className="space-y-2 text-[14px] text-[#17212B]/75">
            {reuse.map((event) => (
              <li
                key={event.id}
                className="rounded-lg border border-[#E5E7EB] px-3 py-2"
              >
                <span className="font-medium capitalize">{event.decision}</span>
                {" · "}
                {new Date(event.createdAt).toLocaleString()}
                {event.verificationNotes
                  ? ` — ${event.verificationNotes}`
                  : null}
              </li>
            ))}
          </ul>
        )}
        {item.status === "approved" && canRecordKnowledgeReuse(user.role) ? (
          <div className="mt-4">
            <KnowledgeReuseActions knowledgeItemId={item.id} />
          </div>
        ) : null}
      </ScientificSection>
    </div>,
  );
}
