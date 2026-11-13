"use client";

import { useId, useState } from "react";
import { ScientificCategoryRow } from "@/components/scientific/scientific-category-row";
import type { ScientificCategory } from "@/domain/scientific-categories/registry";
import { Button } from "@/components/ui/button";

interface TherapeuticAreasExplorerProps {
  core: ScientificCategory[];
  additional: ScientificCategory[];
}

export function TherapeuticAreasExplorer({
  core,
  additional,
}: TherapeuticAreasExplorerProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  return (
    <div className="space-y-2">
      <div className="divide-y-0">
        {core.map((category) => (
          <ScientificCategoryRow key={category.slug} category={category} />
        ))}
      </div>

      <div
        id={panelId}
        hidden={!expanded}
        className={expanded ? "border-t border-[#E5E7EB]" : undefined}
      >
        {expanded
          ? additional.map((category) => (
              <ScientificCategoryRow key={category.slug} category={category} />
            ))
          : null}
      </div>

      {additional.length > 0 ? (
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            className="border-[#E5E7EB] text-[#17212B] hover:border-[#2563EB]/40 hover:bg-[#FAFBFC]"
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded
              ? "Show fewer therapeutic areas"
              : "View All Therapeutic Areas"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
