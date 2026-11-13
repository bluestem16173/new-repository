"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { THERAPEUTIC_AREA_LABELS } from "@/domain/field-medical/types";

export function FieldMedicalFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const ta = params.get("ta") ?? "all";

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => e.preventDefault()}
    >
      <label className="space-y-1 text-sm">
        <span className="block font-medium text-[#10243A]/70">
          Therapeutic area
        </span>
        <select
          className="h-9 rounded-lg border border-[#10243A]/15 bg-white px-3 text-sm text-[#10243A] outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
          value={ta}
          onChange={(e) => {
            const next = new URLSearchParams(params.toString());
            if (e.target.value === "all") next.delete("ta");
            else next.set("ta", e.target.value);
            const qs = next.toString();
            router.push(qs ? `${pathname}?${qs}` : pathname);
          }}
        >
          <option value="all">All areas</option>
          {Object.entries(THERAPEUTIC_AREA_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <p className="pb-2 text-xs text-[#10243A]/55">
        Reporting as-of fixed demo reference date (America/New_York boundaries).
      </p>
    </form>
  );
}
