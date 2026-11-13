import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { FieldMedicalSubnav } from "@/components/field-medical/fm-subnav";
import { FieldMedicalFilters } from "@/components/field-medical/fm-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { THERAPEUTIC_AREA_LABELS } from "@/domain/field-medical/types";
import { FM_DEMO_NOTICE } from "@/lib/demo/field-medical-seed";
import { renderAppPage } from "@/lib/page";
import { listMslRoster, parseFmFilters } from "@/services/field-medical/analytics";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function MslRosterPageContent({ searchParams }: PageProps) {
  await connection();
  const params = await searchParams;
  const filters = parseFmFilters(params);
  const query = typeof params.q === "string" ? params.q : "";
  const readiness = typeof params.readiness === "string" ? params.readiness : "all";
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;
  const attentionOnly = params.attention === "1";

  const { rows, total } = await listMslRoster({
    therapeuticArea: filters.therapeuticArea,
    query,
    readiness,
    attentionOnly,
    page,
    pageSize: 12,
    sort: "name",
  });

  const pageCount = Math.max(1, Math.ceil(total / 12));

  return renderAppPage(
    "MSL Roster",
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <header className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold text-[#10243A]">MSL roster</h2>
          <p className="mt-1 text-sm text-[#10243A]/65">
            Searchable synthetic Field Medical workforce directory.
          </p>
        </div>
        <FieldMedicalSubnav />
      </header>

      <p className="text-sm text-amber-900" role="status">
        {FM_DEMO_NOTICE}
      </p>

      <Suspense fallback={null}>
        <FieldMedicalFilters />
      </Suspense>

      <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3">
          <CardTitle className="text-base text-[#10243A]">
            {attentionOnly ? "MSLs requiring attention" : "All MSLs"} · {total}
          </CardTitle>
          <form className="flex flex-wrap gap-2">
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search name or code"
              className="w-56"
            />
            <select
              name="readiness"
              defaultValue={readiness}
              className="h-9 rounded-lg border border-[#10243A]/15 bg-white px-3 text-sm"
            >
              <option value="all">All readiness</option>
              <option value="approved">Approved</option>
              <option value="eligible">Eligible</option>
              <option value="in_progress">In progress</option>
              <option value="deferred">Deferred</option>
              <option value="denied">Denied</option>
            </select>
            {filters.therapeuticArea !== "all" ? (
              <input type="hidden" name="ta" value={filters.therapeuticArea} />
            ) : null}
            {attentionOnly ? <input type="hidden" name="attention" value="1" /> : null}
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </form>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-y border-[#10243A]/8 bg-[#F3F6FA] text-[#10243A]/65">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Therapeutic area</th>
                  <th className="px-3 py-3 font-medium">Field Director</th>
                  <th className="px-3 py-3 font-medium">Onboarding start</th>
                  <th className="px-3 py-3 font-medium">Readiness</th>
                  <th className="px-3 py-3 font-medium">Competencies</th>
                  <th className="px-3 py-3 font-medium">Open coaching</th>
                  <th className="px-6 py-3 font-medium">Last assessment</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.msl.id}
                    className="border-b border-[#10243A]/6 last:border-0"
                  >
                    <td className="px-6 py-3">
                      <Link
                        href={`/field-medical/msls/${row.msl.id}`}
                        className="font-semibold text-[#2563EB] hover:underline"
                      >
                        {row.msl.fullName}
                      </Link>
                      <p className="text-xs text-[#10243A]/55">
                        {row.msl.employeeCode}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      {THERAPEUTIC_AREA_LABELS[row.msl.therapeuticArea]}
                    </td>
                    <td className="px-3 py-3">{row.directorName}</td>
                    <td className="px-3 py-3 tabular-nums">
                      {row.msl.onboardingStartDate}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="outline" className="capitalize">
                        {row.readinessStatus.replaceAll("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      {row.competenciesAttained}/{row.competenciesRequired}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      {row.openCoachingActions}
                    </td>
                    <td className="px-6 py-3 tabular-nums text-[#10243A]/75">
                      {row.lastAssessmentAt
                        ? new Date(row.lastAssessmentAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4 text-sm">
            <p className="text-[#10243A]/60">
              Page {page} of {pageCount}
            </p>
            <div className="flex gap-2">
              {page > 1 ? (
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link
                      href={`/field-medical/msls?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}${readiness !== "all" ? `&readiness=${readiness}` : ""}${filters.therapeuticArea !== "all" ? `&ta=${filters.therapeuticArea}` : ""}${attentionOnly ? "&attention=1" : ""}`}
                    />
                  }
                >
                  Previous
                </Button>
              ) : null}
              {page < pageCount ? (
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link
                      href={`/field-medical/msls?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}${readiness !== "all" ? `&readiness=${readiness}` : ""}${filters.therapeuticArea !== "all" ? `&ta=${filters.therapeuticArea}` : ""}${attentionOnly ? "&attention=1" : ""}`}
                    />
                  }
                >
                  Next
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>,
  );
}

export default function MslRosterPage(props: PageProps) {
  return <Suspense fallback={<p className="p-6 text-sm text-slate-600">Loading workspace…</p>}><MslRosterPageContent {...props} /></Suspense>;
}
