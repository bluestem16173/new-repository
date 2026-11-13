import type { TherapeuticArea } from "@/domain/field-medical/types";

export type ScientificCategoryKind = "therapeutic_area" | "scientific_specialty";

export type ScientificCategoryStatus = "active" | "partial" | "planned";

export interface ScientificCategory {
  slug: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  kind: ScientificCategoryKind;
  /** Existing Field Medical filter value when supported. */
  fieldMedicalTa: TherapeuticArea | null;
  status: ScientificCategoryStatus;
  availableCapabilities: string[];
  plannedCapabilities: string[];
  href: string;
}

/**
 * Homepage taxonomy for therapeutic areas and scientific specialties.
 * Display slugs are stable. Field Medical keeps existing DB identifiers via fieldMedicalTa.
 */
export const SCIENTIFIC_CATEGORIES: ScientificCategory[] = [
  {
    slug: "general-medicine",
    title: "General Medicine & Metabolic Disease",
    description:
      "Obesity, diabetes, metabolic disease, and broad clinical evidence interpretation.",
    imageSrc: "/therapeutic-areas/general-medicine.png",
    imageAlt: "Dimensional blue and teal therapeutic antibody illustration",
    kind: "therapeutic_area",
    fieldMedicalTa: "general_medicine",
    status: "active",
    availableCapabilities: [
      "Field Medical filtered roster, competencies, coaching, and KPIs",
      "MSL scientific exchange simulations for general medicine",
    ],
    plannedCapabilities: [
      "Dedicated metabolic evidence watchlists",
    ],
    href: "/field-medical?ta=general_medicine",
  },
  {
    slug: "oncology",
    title: "Oncology & Hematology",
    description:
      "Solid tumors, hematologic malignancies, targeted therapies, and complex clinical trial evidence.",
    imageSrc: "/therapeutic-areas/oncology.png",
    imageAlt: "Dimensional purple and blue cancer cell illustration",
    kind: "therapeutic_area",
    fieldMedicalTa: "oncology",
    status: "active",
    availableCapabilities: [
      "Field Medical oncology workforce and competency views",
      "Oncology KOL / conflicting-evidence simulations",
    ],
    plannedCapabilities: [
      "Companion-diagnostics cross-tagging with precision medicine",
    ],
    href: "/field-medical?ta=oncology",
  },
  {
    slug: "immunology",
    title: "Immunology & Inflammation",
    description:
      "Autoimmune disorders, biologics, comparative efficacy, and long-term disease management.",
    imageSrc: "/therapeutic-areas/immunology.png",
    imageAlt: "Dimensional immune cell with cytokine signaling illustration",
    kind: "therapeutic_area",
    fieldMedicalTa: "inflammation",
    status: "active",
    availableCapabilities: [
      "Field Medical inflammation filter (existing stored identifier)",
      "Safety and escalation teaching scenarios",
    ],
    plannedCapabilities: [
      "Separate immunology vs inflammation drill-downs",
    ],
    href: "/field-medical?ta=inflammation",
  },
  {
    slug: "rare-disease",
    title: "Rare & Genetic Diseases",
    description:
      "Orphan therapies, genetic disorders, specialized populations, and diagnostic challenges.",
    imageSrc: "/therapeutic-areas/rare-disease.png",
    imageAlt: "Dimensional violet and blue DNA double helix illustration",
    kind: "therapeutic_area",
    fieldMedicalTa: "rare_disease",
    status: "active",
    availableCapabilities: [
      "Field Medical rare disease workforce and coaching views",
      "Off-label inquiry boundary simulation",
    ],
    plannedCapabilities: [
      "Genetic evidence pathway maps",
    ],
    href: "/field-medical?ta=rare_disease",
  },
  {
    slug: "neuroscience",
    title: "Neuroscience & CNS",
    description:
      "Epilepsy, neurodegenerative disorders, movement disorders, and neurological evidence.",
    imageSrc: "/therapeutic-areas/neuroscience.png",
    imageAlt: "Dimensional blue and purple brain with neural pathways",
    kind: "therapeutic_area",
    fieldMedicalTa: null,
    status: "planned",
    availableCapabilities: [],
    plannedCapabilities: [
      "Field Medical neuroscience cohort filters",
      "CNS scientific exchange simulations",
    ],
    href: "/scientific-areas/neuroscience",
  },
  {
    slug: "cardiovascular-renal",
    title: "Cardiovascular & Renal",
    description:
      "Heart failure, vascular disease, kidney disorders, and cardiorenal therapeutics.",
    imageSrc: "/therapeutic-areas/cardiovascular-renal.png",
    imageAlt: "Dimensional anatomical heart with vessels",
    kind: "therapeutic_area",
    fieldMedicalTa: null,
    status: "planned",
    availableCapabilities: [],
    plannedCapabilities: [
      "Cardiorenal Field Medical filter and simulations",
    ],
    href: "/scientific-areas/cardiovascular-renal",
  },
  {
    slug: "infectious-disease",
    title: "Infectious Diseases & Vaccines",
    description:
      "Antimicrobials, emerging infections, vaccines, and resistance.",
    imageSrc: "/therapeutic-areas/infectious-disease.png",
    imageAlt: "Dimensional virus particle illustration",
    kind: "therapeutic_area",
    fieldMedicalTa: null,
    status: "planned",
    availableCapabilities: [],
    plannedCapabilities: [
      "Vaccine and ID evidence workspaces",
    ],
    href: "/scientific-areas/infectious-disease",
  },
  {
    slug: "respiratory",
    title: "Respiratory & Pulmonary",
    description:
      "Asthma, COPD, pulmonary hypertension, and respiratory therapeutics.",
    imageSrc: "/therapeutic-areas/respiratory.png",
    imageAlt: "Dimensional blue and teal anatomical lungs",
    kind: "therapeutic_area",
    fieldMedicalTa: null,
    status: "planned",
    availableCapabilities: [],
    plannedCapabilities: [
      "Respiratory Field Medical filters and scenarios",
    ],
    href: "/scientific-areas/respiratory",
  },
  {
    slug: "ophthalmology",
    title: "Ophthalmology",
    description:
      "Retinal disease, glaucoma, inflammatory eye disorders, and ophthalmic therapeutics.",
    imageSrc: "/therapeutic-areas/ophthalmology.png",
    imageAlt: "Dimensional eye and retina anatomy illustration",
    kind: "therapeutic_area",
    fieldMedicalTa: null,
    status: "planned",
    availableCapabilities: [],
    plannedCapabilities: [
      "Ophthalmology scientific exchange modules",
    ],
    href: "/scientific-areas/ophthalmology",
  },
  {
    slug: "dermatology",
    title: "Dermatology & Aesthetics",
    description:
      "Inflammatory skin disease, dermatologic therapeutics, and aesthetic medicine.",
    imageSrc: "/therapeutic-areas/dermatology.png",
    imageAlt: "Dimensional cross-section of human skin",
    kind: "therapeutic_area",
    fieldMedicalTa: null,
    status: "planned",
    availableCapabilities: [],
    plannedCapabilities: [
      "Dermatology Field Medical content and simulations",
    ],
    href: "/scientific-areas/dermatology",
  },
  {
    slug: "diagnostics-precision-medicine",
    title: "Diagnostics & Precision Medicine",
    description:
      "Molecular diagnostics, companion diagnostics, biomarkers, genetic testing, laboratory medicine, and precision therapeutics.",
    imageSrc: "/therapeutic-areas/diagnostics-precision-medicine.png",
    imageAlt:
      "Dimensional molecular diagnostic chip with DNA helix and laboratory elements",
    kind: "scientific_specialty",
    fieldMedicalTa: null,
    status: "planned",
    availableCapabilities: [
      "Evidence Library browse (illustrative metadata)",
    ],
    plannedCapabilities: [
      "Companion-diagnostics cross-tagging with Oncology",
      "Biomarker evidence retrieval workflows",
    ],
    href: "/scientific-areas/diagnostics-precision-medicine",
  },
];

export const CORE_THERAPEUTIC_AREA_SLUGS = [
  "general-medicine",
  "oncology",
  "immunology",
  "rare-disease",
  "neuroscience",
  "cardiovascular-renal",
] as const;

export function listTherapeuticAreas(): ScientificCategory[] {
  return SCIENTIFIC_CATEGORIES.filter((c) => c.kind === "therapeutic_area");
}

export function listScientificSpecialties(): ScientificCategory[] {
  return SCIENTIFIC_CATEGORIES.filter((c) => c.kind === "scientific_specialty");
}

export function listCoreTherapeuticAreas(): ScientificCategory[] {
  const order = new Map(
    CORE_THERAPEUTIC_AREA_SLUGS.map((slug, index) => [slug, index]),
  );
  return listTherapeuticAreas()
    .filter((c) => order.has(c.slug as (typeof CORE_THERAPEUTIC_AREA_SLUGS)[number]))
    .sort(
      (a, b) =>
        (order.get(a.slug as (typeof CORE_THERAPEUTIC_AREA_SLUGS)[number]) ?? 0) -
        (order.get(b.slug as (typeof CORE_THERAPEUTIC_AREA_SLUGS)[number]) ?? 0),
    );
}

export function listAdditionalTherapeuticAreas(): ScientificCategory[] {
  const core = new Set<string>(CORE_THERAPEUTIC_AREA_SLUGS);
  return listTherapeuticAreas().filter((c) => !core.has(c.slug));
}

export function getScientificCategoryBySlug(
  slug: string,
): ScientificCategory | null {
  return SCIENTIFIC_CATEGORIES.find((c) => c.slug === slug) ?? null;
}
