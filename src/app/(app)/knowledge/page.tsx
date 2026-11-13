import Link from "next/link";
import { KnowledgeItemCard } from "@/components/knowledge/knowledge-item-card";
import { KnowledgeSubnav } from "@/components/knowledge/knowledge-subnav";
import { ScientificSection } from "@/components/scientific/scientific-section";
import { Button } from "@/components/ui/button";
import { KNOWLEDGE_NETWORK_NOTICE } from "@/lib/demo/knowledge-seed";
import { renderAppPage } from "@/lib/page";
import { getRuntimeMode } from "@/lib/supabase/env";
import { listKnowledgeItems } from "@/services/knowledge/items";

export default async function KnowledgeNetworkPage() {
  const mode = getRuntimeMode();
  const approved = listKnowledgeItems({ status: "approved" });
  const pending = listKnowledgeItems({
    status: "pending_review",
    includeNonApproved: true,
  });

  return renderAppPage(
    "Scientific Knowledge Network",
    <div className="mx-auto w-full max-w-[1100px] space-y-8 bg-white px-1 py-2">
      <header className="space-y-3">
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#17212B] sm:text-[2rem]">
          Scientific Knowledge Network
        </h2>
        <p className="max-w-3xl text-[16px] leading-[1.65] text-[#17212B]/70">
          Find, verify, and appropriately reuse previously reviewed scientific
          knowledge. Restricted field inquiries stay separate from approved,
          de-identified reusable content.
        </p>
        <KnowledgeSubnav />
      </header>

      <div
        className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-[14px] leading-relaxed text-amber-950"
        role="status"
      >
        {KNOWLEDGE_NETWORK_NOTICE}
        {mode === "demo" ? " Demo store is in-memory only." : null}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            href: "/knowledge/search",
            title: "Search knowledge",
            body: "Keyword + metadata matching over approved items.",
          },
          {
            href: "/knowledge/review",
            title: "Review queue",
            body: `${pending.length} pending item${pending.length === 1 ? "" : "s"} awaiting authorized approval.`,
          },
          {
            href: "/knowledge/analytics",
            title: "Leadership analytics",
            body: "Reuse KPIs, bottlenecks, and scenario ROI model.",
          },
          {
            href: "/medical-information",
            title: "Medical Information",
            body: "Capture new research when no approved match exists.",
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-[#E5E7EB] p-4 outline-none transition-colors hover:border-[#2563EB]/35 hover:bg-[#FAFBFC] focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
          >
            <h3 className="text-[15px] font-semibold text-[#17212B]">
              {card.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#17212B]/65">
              {card.body}
            </p>
          </Link>
        ))}
      </section>

      <ScientificSection
        title="Showcase path"
        description="Synthetic demonstration of organizational knowledge retention."
      >
        <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-[1.65] text-[#17212B]/75">
          <li>MSL A raises a new cardiorenal / GLP-1 scientific question.</li>
          <li>
            Medical Information researches allowlisted evidence and submits a
            reusable knowledge draft.
          </li>
          <li>An authorized reviewer approves de-identified scoped content.</li>
          <li>
            MSL B asks a similar question; matching surfaces the approved item.
          </li>
          <li>
            MSL B verifies applicability and records reuse — never auto-sent to
            HCPs.
          </li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
            render={<Link href="/knowledge/search?q=GLP-1+cardiorenal+endpoint" />}
            role="link"
          >
            Try MSL B search
          </Button>
          <Button
            variant="outline"
            className="border-[#E5E7EB]"
            render={<Link href="/knowledge/analytics" />}
            role="link"
          >
            View analytics
          </Button>
        </div>
      </ScientificSection>

      <ScientificSection
        title="Approved reusable knowledge"
        description={`${approved.length} published item${approved.length === 1 ? "" : "s"} available for scoped verification.`}
      >
        <div className="grid gap-3">
          {approved.map((item) => (
            <KnowledgeItemCard key={item.id} item={item} />
          ))}
        </div>
      </ScientificSection>
    </div>,
  );
}
