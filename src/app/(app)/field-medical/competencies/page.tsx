import Link from "next/link";
import { Suspense } from "react";
import { FieldMedicalSubnav } from "@/components/field-medical/fm-subnav";
import { FieldMedicalFilters } from "@/components/field-medical/fm-filters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FM_DEMO_NOTICE } from "@/lib/demo/field-medical-seed";
import { renderAppPage } from "@/lib/page";
import {
  getCompetencyMatrix,
  parseFmFilters,
} from "@/services/field-medical/analytics";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const STATUS_STYLES = {
  attained: "bg-emerald-100 text-emerald-900",
  pending: "bg-amber-100 text-amber-900",
  failed: "bg-rose-100 text-rose-900",
  missing: "bg-slate-100 text-slate-700",
  not_applicable: "bg-transparent text-[#10243A]/30",
} as const;

export default async function CompetenciesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseFmFilters(params);
  const matrix = await getCompetencyMatrix(filters.therapeuticArea);

  return renderAppPage(
    "Competencies",
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <header className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold text-[#10243A]">
            Competency matrix
          </h2>
          <p className="mt-1 text-sm text-[#10243A]/65">
            Accessible status by MSL and competency. Rubrics are not averaged
            across incompatible versions.
          </p>
        </div>
        <FieldMedicalSubnav />
      </header>

      <p className="text-sm text-amber-900">{FM_DEMO_NOTICE}</p>
      <Suspense fallback={null}>
        <FieldMedicalFilters />
      </Suspense>

      <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
        <CardHeader>
          <CardTitle className="text-base">Aggregate attainment</CardTitle>
          <CardDescription>
            {matrix.aggregate.rate === null
              ? "N/A"
              : `${matrix.aggregate.rate}%`}{" "}
            · numerator {matrix.aggregate.numerator} / denominator{" "}
            {matrix.aggregate.denominator} (sample size{" "}
            {matrix.aggregate.sampleSize})
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b bg-[#F3F6FA]">
                <th className="sticky left-0 bg-[#F3F6FA] px-3 py-2 text-sm font-medium">
                  MSL
                </th>
                {matrix.competencies.map((c) => (
                  <th key={c.id} className="px-2 py-2 font-medium">
                    <span title={c.name}>{c.code}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((row) => (
                <tr key={row.msl.id} className="border-b last:border-0">
                  <td className="sticky left-0 bg-white px-3 py-2 text-sm">
                    <Link
                      href={`/field-medical/msls/${row.msl.id}`}
                      className="font-medium text-[#2563EB] hover:underline"
                    >
                      {row.msl.fullName}
                    </Link>
                  </td>
                  {row.cells.map((cell) => (
                    <td key={cell.competencyId} className="px-2 py-2">
                      <span
                        className={`inline-flex min-w-16 items-center justify-center rounded px-1.5 py-1 font-medium ${STATUS_STYLES[cell.status]}`}
                      >
                        {cell.status === "not_applicable"
                          ? "n/a"
                          : cell.status}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="mt-4 flex flex-wrap gap-3 text-xs text-[#10243A]/65">
            <li>attained = validated current pass</li>
            <li>pending = awaiting reviewer validation</li>
            <li>failed = validated non-pass</li>
            <li>missing = no qualifying assessment</li>
          </ul>
        </CardContent>
      </Card>
    </div>,
  );
}
