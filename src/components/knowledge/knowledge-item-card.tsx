import Link from "next/link";
import {
  KNOWLEDGE_APPLICABILITY_LABELS,
  KNOWLEDGE_CURRENCY_LABELS,
  KNOWLEDGE_STATUS_LABELS,
  type KnowledgeApplicability,
  type KnowledgeItem,
  type KnowledgeMatchSuggestion,
} from "@/domain/knowledge/types";
import { cn } from "@/lib/utils";

interface KnowledgeItemCardProps {
  item: KnowledgeItem;
  suggestion?: KnowledgeMatchSuggestion;
  className?: string;
}

export function KnowledgeItemCard({
  item,
  suggestion,
  className,
}: KnowledgeItemCardProps) {
  return (
    <Link
      href={`/knowledge/items/${item.id}`}
      className={cn(
        "block rounded-xl border border-[#E5E7EB] bg-white p-4 outline-none transition-colors sm:p-5",
        "hover:border-[#2563EB]/35 hover:bg-[#FAFBFC] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35 focus-visible:ring-offset-2",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border border-[#E5E7EB] bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[#17212B]/60">
          {KNOWLEDGE_STATUS_LABELS[item.status]}
        </span>
        <span className="rounded border border-[#E5E7EB] px-2 py-0.5 text-[11px] font-medium text-[#17212B]/55">
          {KNOWLEDGE_CURRENCY_LABELS[item.currencyStatus]}
        </span>
        {suggestion ? (
          <span className="rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-900">
            Score {Math.round(suggestion.relevanceScore)}
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 text-[16px] font-semibold leading-snug tracking-tight text-[#17212B]">
        {item.title}
      </h3>
      <p className="mt-2 text-[14px] leading-[1.65] text-[#17212B]/70">
        {item.questionSummary}
      </p>
      <dl className="mt-3 grid gap-2 text-[13px] text-[#17212B]/65 sm:grid-cols-2">
        <div>
          <dt className="text-[#17212B]/45">Therapeutic area</dt>
          <dd className="font-medium text-[#17212B]/80">{item.therapeuticArea}</dd>
        </div>
        <div>
          <dt className="text-[#17212B]/45">Product / disease</dt>
          <dd className="font-medium text-[#17212B]/80">
            {item.productName ?? "—"} / {item.diseaseState ?? "—"}
          </dd>
        </div>
      </dl>
      {suggestion ? (
        <div className="mt-3 space-y-2 border-t border-[#E5E7EB] pt-3 text-[13px] leading-relaxed text-[#17212B]/70">
          <p>
            <span className="font-medium text-[#17212B]">Relevance: </span>
            {suggestion.relevanceRationale}
          </p>
          <p>
            <span className="font-medium text-[#17212B]">Applicability: </span>
            {
              KNOWLEDGE_APPLICABILITY_LABELS[
                suggestion.applicability as KnowledgeApplicability
              ]
            }
          </p>
          <p className="text-[#17212B]/55">
            Similarity is not automatic approval for external use.
          </p>
        </div>
      ) : null}
    </Link>
  );
}
