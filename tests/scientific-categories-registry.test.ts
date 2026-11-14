import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CORE_THERAPEUTIC_AREA_SLUGS,
  getScientificCategoryBySlug,
  listAdditionalTherapeuticAreas,
  listCoreTherapeuticAreas,
  listScientificSpecialties,
  listTherapeuticAreas,
  SCIENTIFIC_CATEGORIES,
} from "@/domain/scientific-categories/registry";
import { THERAPEUTIC_AREAS } from "@/domain/field-medical/types";

describe("scientific categories registry", () => {
  it("exposes 10 therapeutic areas and 1 specialty with unique slugs", () => {
    expect(listTherapeuticAreas()).toHaveLength(10);
    expect(listScientificSpecialties()).toHaveLength(1);
    expect(SCIENTIFIC_CATEGORIES).toHaveLength(11);
    const slugs = new Set(SCIENTIFIC_CATEGORIES.map((c) => c.slug));
    expect(slugs.size).toBe(11);
  });

  it("keeps six core areas and four additional areas for View All", () => {
    expect(listCoreTherapeuticAreas().map((c) => c.slug)).toEqual([
      ...CORE_THERAPEUTIC_AREA_SLUGS,
    ]);
    expect(listAdditionalTherapeuticAreas()).toHaveLength(4);
  });

  it("maps active areas to existing Field Medical identifiers only", () => {
    const allowed = new Set(THERAPEUTIC_AREAS);
    for (const category of SCIENTIFIC_CATEGORIES) {
      if (category.fieldMedicalTa) {
        expect(allowed.has(category.fieldMedicalTa)).toBe(true);
        expect(category.href).toBe(
          `/field-medical?ta=${category.fieldMedicalTa}`,
        );
        expect(category.status).toBe("active");
      } else {
        expect(category.href).toBe(`/scientific-areas/${category.slug}`);
      }
      expect(category.imageSrc.startsWith("/therapeutic-areas/")).toBe(true);
      expect(category.imageSrc.endsWith(".png")).toBe(true);
      const assetPath = path.join(
        process.cwd(),
        "public",
        category.imageSrc.replace(/^\//, ""),
      );
      expect(existsSync(assetPath)).toBe(true);
    }
  });

  it("resolves known slugs and returns null for unknown", () => {
    expect(getScientificCategoryBySlug("oncology")?.title).toContain(
      "Oncology",
    );
    expect(
      getScientificCategoryBySlug("diagnostics-precision-medicine")?.kind,
    ).toBe("scientific_specialty");
    expect(getScientificCategoryBySlug("missing")).toBeNull();
  });
});
