import Link from "next/link";
import { Suspense } from "react";
import { KnowledgeItemCard } from "@/components/knowledge/knowledge-item-card";
import { KnowledgeSubnav } from "@/components/knowledge/knowledge-subnav";
import { Button } from "@/components/ui/button";
import { renderAppPage } from "@/lib/page";
import { getCurrentUser } from "@/lib/session";
import { searchKnowledgeLibrary } from "@/services/knowledge/items";
import { runKnowledgeMatchingAgent } from "@/services/knowledge/matching";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function KnowledgeSearchPage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={renderAppPage(
        "Knowledge Search",
        <p className="p-6 text-sm text-[#17212B]/60">Loading search…</p>,
      )}
    >
      <KnowledgeSearchContent searchParams={searchParams} />
    </Suspense>
  );
}

async function KnowledgeSearchContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = first(params.q);
  const therapeuticArea = first(params.ta);
  const productName = first(params.product);
  const user = await getCurrentUser();

  const library = searchKnowledgeLibrary({
    query: query || undefined,
    therapeuticArea: therapeuticArea || undefined,
    productName: productName || undefined,
    status: "approved",
  });

  const agentResult = query
    ? runKnowledgeMatchingAgent({
        query,
        therapeuticArea: therapeuticArea || undefined,
        productName: productName || undefined,
        actorProfileId: user.id,
      })
    : null;

  return renderAppPage(
    "Knowledge Search",
    <div className="mx-auto w-full max-w-[1100px] space-y-8 bg-white px-1 py-2">
      <header className="space-y-3">
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#17212B]">
          Search scientific knowledge
        </h2>
        <p className="max-w-3xl text-[15px] leading-[1.65] text-[#17212B]/70">
          Full-text style keyword matching with therapeutic-area and product
          filters. Semantic pgvector matching is not enabled in this environment.
        </p>
        <KnowledgeSubnav />
      </header>

      <form
        className="grid gap-3 rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] p-4 sm:grid-cols-2 lg:grid-cols-4"
        method="get"
      >
        <label className="space-y-1 text-[13px] text-[#17212B]/70 sm:col-span-2 lg:col-span-2">
          Scientific question
          <input
            name="q"
            defaultValue={query}
            placeholder="e.g. GLP-1 primary cardiorenal endpoint"
            className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
          />
        </label>
        <label className="space-y-1 text-[13px] text-[#17212B]/70">
          Therapeutic area
          <input
            name="ta"
            defaultValue={therapeuticArea}
            placeholder="General Medicine"
            className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
          />
        </label>
        <label className="space-y-1 text-[13px] text-[#17212B]/70">
          Product
          <input
            name="product"
            defaultValue={productName}
            placeholder="Product name"
            className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
          />
        </label>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
          <Button
            type="submit"
            className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
          >
            Search approved knowledge
          </Button>
          <Button
            variant="outline"
            className="border-[#E5E7EB]"
            render={<Link href="/knowledge/search" />}
            role="link"
          >
            Clear
          </Button>
        </div>
      </form>

      {agentResult ? (
        <div
          className="rounded-xl border border-[#E5E7EB] px-4 py-3 text-[14px] leading-relaxed text-[#17212B]/75"
          role="status"
        >
          <p className="font-medium text-[#17212B]">
            Knowledge Matching Agent result
          </p>
          <p className="mt-1">{agentResult.relevance_rationale}</p>
          <p className="mt-1 text-[13px] text-[#17212B]/55">
            Next: {agentResult.recommended_next_action}
            {agentResult.no_supported_match
              ? " · Explicit no-supported-match"
              : null}
          </p>
        </div>
      ) : null}

      <section className="space-y-3" aria-label="Search results">
        {library.noSupportedMatch && query ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-950">
            No approved knowledge matched. Use{" "}
            <Link href="/evidence" className="font-medium underline">
              Evidence Library
            </Link>{" "}
            and{" "}
            <Link
              href="/medical-information"
              className="font-medium underline"
            >
              Medical Information
            </Link>
            .
          </div>
        ) : null}
        <div className="grid gap-3">
          {library.suggestions.length > 0
            ? library.suggestions.map((suggestion) => (
                <KnowledgeItemCard
                  key={suggestion.knowledgeItemId}
                  item={suggestion.item}
                  suggestion={suggestion}
                />
              ))
            : library.items.map((item) => (
                <KnowledgeItemCard key={item.id} item={item} />
              ))}
        </div>
      </section>
    </div>,
  );
}
