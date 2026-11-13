export type DataClassification =
  | "public_scientific"
  | "internal_approved"
  | "restricted";

export const DATA_CLASSIFICATION_LABELS: Record<DataClassification, string> = {
  public_scientific: "PUBLIC_SCIENTIFIC",
  internal_approved: "INTERNAL_APPROVED",
  restricted: "RESTRICTED",
};

export const DATA_CLASSIFICATION_DESCRIPTIONS: Record<
  DataClassification,
  string
> = {
  public_scientific:
    "Published literature, public trial results, approved public references.",
  internal_approved:
    "Authorized reusable scientific responses, approved knowledge items, internal educational content.",
  restricted:
    "Raw MSL–KOL interactions, proprietary research, unpublished evidence, sensitive operational records, potential safety reports.",
};

/** Restricted content must never enter shared knowledge search by default. */
export function canEnterSharedKnowledgeNetwork(
  classification: DataClassification,
  approved: boolean,
): boolean {
  return approved && classification === "internal_approved";
}

export function defaultClassificationForResource(
  resource: "inquiry" | "knowledge" | "evidence" | "si_draft",
): DataClassification {
  switch (resource) {
    case "inquiry":
    case "si_draft":
      return "restricted";
    case "knowledge":
      return "internal_approved";
    case "evidence":
      return "public_scientific";
  }
}
