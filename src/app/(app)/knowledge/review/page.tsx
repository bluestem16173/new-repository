import { KnowledgeItemCard } from "@/components/knowledge/knowledge-item-card";
import { KnowledgeReviewActions } from "@/components/knowledge/review-actions";
import { KnowledgeSubnav } from "@/components/knowledge/knowledge-subnav";
import { canApproveKnowledgeItem } from "@/domain/knowledge/authorization";
import { renderAppPage } from "@/lib/page";
import { getCurrentUser } from "@/lib/session";
import { listKnowledgeItems } from "@/services/knowledge/items";

export default async function KnowledgeReviewPage() {
  const user = await getCurrentUser();
  const pending = listKnowledgeItems({
    status: "pending_review",
    includeNonApproved: true,
  });
  const canReview = canApproveKnowledgeItem(user.role);

  return renderAppPage(
    "Knowledge Review",
    <div className="mx-auto w-full max-w-[1100px] space-y-8 bg-white px-1 py-2">
      <header className="space-y-3">
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#17212B]">
          Knowledge approval queue
        </h2>
        <p className="max-w-3xl text-[15px] leading-[1.65] text-[#17212B]/70">
          Authorized medical reviewers approve de-identified reusable content
          within a defined scope. No automatic HCP transmission.
        </p>
        <KnowledgeSubnav />
      </header>

      {!canReview ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-950"
          role="status"
        >
          Your role ({user.role}) can view the queue but cannot approve. Switch
          to a medical reviewer or admin in Settings (demo) to complete
          approvals.
        </div>
      ) : null}

      {pending.length === 0 ? (
        <p className="text-[15px] text-[#17212B]/65">
          No knowledge items are pending review.
        </p>
      ) : (
        <div className="grid gap-4">
          {pending.map((item) => (
            <div key={item.id} className="space-y-3">
              <KnowledgeItemCard item={item} />
              {canReview ? (
                <KnowledgeReviewActions knowledgeItemId={item.id} />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>,
  );
}
