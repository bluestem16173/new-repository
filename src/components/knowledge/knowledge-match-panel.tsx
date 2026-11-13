import Link from "next/link";
import { KnowledgeItemCard } from "@/components/knowledge/knowledge-item-card";
import { ScientificSection } from "@/components/scientific/scientific-section";
import { Button } from "@/components/ui/button";
import type { KnowledgeMatchSuggestion } from "@/domain/knowledge/types";

interface KnowledgeMatchPanelProps {
  query: string;
  suggestions: KnowledgeMatchSuggestion[];
  noSupportedMatch: boolean;
  inquiryId?: string;
}

export function KnowledgeMatchPanel({
  query,
  suggestions,
  noSupportedMatch,
  inquiryId,
}: KnowledgeMatchPanelProps) {
  return (
    <ScientificSection
      title="Scientific Knowledge matches"
      description="Ranked approved knowledge suggestions. Similarity ≠ approved applicability. Never auto-send to HCPs."
      action={
        <Button
          variant="outline"
          className="border-[#E5E7EB]"
          render={
            <Link
              href={`/knowledge/search?q=${encodeURIComponent(query)}`}
            />
          }
          role="link"
        >
          Open Knowledge Search
        </Button>
      }
    >
      {noSupportedMatch ? (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] leading-relaxed text-amber-950">
          <p className="font-medium">No supported approved match</p>
          <p>
            Continue with Evidence Library retrieval and the Medical Information
            draft/review workflow. Do not invent citations or approval status.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-amber-300 bg-white"
              render={<Link href="/evidence" />}
              role="link"
            >
              Evidence Library
            </Button>
            <Button
              variant="outline"
              className="border-amber-300 bg-white"
              render={<Link href="/medical-information" />}
              role="link"
            >
              Medical Information
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {suggestions.map((suggestion) => (
            <KnowledgeItemCard
              key={suggestion.knowledgeItemId}
              item={suggestion.item}
              suggestion={suggestion}
            />
          ))}
          {inquiryId ? (
            <p className="text-[13px] text-[#17212B]/55">
              After inspecting a match, open the item to record
              accepted / rejected / adapted / escalated reuse for inquiry{" "}
              <code className="rounded bg-[#F8FAFC] px-1">{inquiryId.slice(0, 8)}</code>
              .
            </p>
          ) : null}
        </div>
      )}
    </ScientificSection>
  );
}
