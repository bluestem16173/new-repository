import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { renderAppPage } from "@/lib/page";
import { listEvidenceDocuments } from "@/services/evidence";

const TRUST_LABELS = {
  illustrative_unverified: "Illustrative · unverified",
  internally_validated: "Internally validated",
  planned: "Planned capability",
} as const;

export default async function EvidencePage() {
  const documents = await listEvidenceDocuments();

  return renderAppPage(
    "Evidence Library",
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Evidence catalog
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Sample public-source metadata is clearly labeled illustrative until
          verified. Retrieved scientific content is treated as untrusted. Do not
          fabricate citations.
        </p>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          title="No evidence documents"
          description="Seed illustrative metadata or connect Supabase to load the catalog."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {documents.map((doc) => (
            <Card key={doc.id} className="shadow-none">
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={
                      doc.trustLabel === "illustrative_unverified"
                        ? "border-amber-300 bg-amber-50 text-amber-950"
                        : doc.trustLabel === "planned"
                          ? "border-slate-300 bg-slate-50 text-slate-800"
                          : "border-emerald-300 bg-emerald-50 text-emerald-950"
                    }
                  >
                    {TRUST_LABELS[doc.trustLabel]}
                  </Badge>
                </div>
                <CardTitle className="text-base leading-snug">
                  {doc.title}
                </CardTitle>
                <CardDescription>
                  {doc.sourceName}
                  {doc.publicationYear ? ` · ${doc.publicationYear}` : ""}
                  {doc.authors ? ` · ${doc.authors}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  {doc.abstractSummary ?? "No summary provided."}
                </p>
                {doc.sourceUrl ? (
                  <p className="break-all text-xs text-muted-foreground">
                    Source URL (illustrative): {doc.sourceUrl}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>,
  );
}
