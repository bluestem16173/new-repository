import type { EvidenceDocument } from "@/domain/types";
import { getDemoStore } from "@/lib/demo/seed";
import { getRuntimeMode } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function mapEvidenceRow(row: Record<string, unknown>): EvidenceDocument {
  return {
    id: row.id as string,
    title: row.title as string,
    sourceName: row.source_name as string,
    sourceUrl: (row.source_url as string | null) ?? null,
    publicationYear: (row.publication_year as number | null) ?? null,
    authors: (row.authors as string | null) ?? null,
    abstractSummary: (row.abstract_summary as string | null) ?? null,
    trustLabel: row.trust_label as EvidenceDocument["trustLabel"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listEvidenceDocuments(): Promise<EvidenceDocument[]> {
  if (getRuntimeMode() === "demo") {
    return [...getDemoStore().evidenceDocuments];
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [...getDemoStore().evidenceDocuments];
  }

  const { data, error } = await supabase
    .from("evidence_documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list evidence: ${error.message}`);
  }

  return (data ?? []).map((row) => mapEvidenceRow(row as Record<string, unknown>));
}
