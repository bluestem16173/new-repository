import Link from "next/link";
import {
  ClipboardList,
  FileCheck2,
  FolderOpen,
  RefreshCcw,
} from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { renderAppPage } from "@/lib/page";
import { getDashboardMetrics, listInquiries } from "@/services/inquiries";
import type { MedicalInquiry } from "@/domain/types";
import { DEMO_MODE_NOTICE } from "@/lib/demo/seed";
import { getRuntimeMode } from "@/lib/supabase/env";

export default async function DashboardPage() {
  const [metrics, inquiries] = await Promise.all([
    getDashboardMetrics(),
    listInquiries(),
  ]);
  const recent = inquiries.slice(0, 5);
  const mode = getRuntimeMode();

  const columns: DataTableColumn<MedicalInquiry>[] = [
    {
      id: "ref",
      header: "Reference",
      cell: (row) => (
        <Link
          href={`/medical-information/inquiries/${row.id}`}
          className="font-medium text-[oklch(0.4_0.08_210)] hover:underline"
        >
          {row.referenceCode}
        </Link>
      ),
    },
    {
      id: "title",
      header: "Title",
      cell: (row) => (
        <span className="line-clamp-1 max-w-xs">{row.title}</span>
      ),
    },
    {
      id: "product",
      header: "Product",
      cell: (row) => row.productName,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusIndicator status={row.status} />,
    },
  ];

  return renderAppPage(
    "Dashboard",
    <div className="space-y-8">
      {mode === "demo" ? (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          {DEMO_MODE_NOTICE}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Open inquiries"
          value={metrics.openInquiries}
          description="Active Medical Information workflow"
          icon={<FolderOpen className="size-4" />}
        />
        <MetricCard
          title="In medical review"
          value={metrics.inMedicalReview}
          description="Awaiting reviewer decision"
          icon={<ClipboardList className="size-4" />}
        />
        <MetricCard
          title="Approved"
          value={metrics.approved}
          description="Ready to close after release process"
          icon={<FileCheck2 className="size-4" />}
        />
        <MetricCard
          title="Needs revision"
          value={metrics.needsRevision}
          description="Returned for specialist updates"
          icon={<RefreshCcw className="size-4" />}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Recent inquiries
            </h2>
            <p className="text-sm text-muted-foreground">
              Module 1 Medical Information Intelligence overview
            </p>
          </div>
          <Button
            render={
              <Link href="/medical-information/inquiries/new" />
            }
          >
            New inquiry
          </Button>
        </div>
        <DataTable
          columns={columns}
          rows={recent}
          getRowId={(row) => row.id}
          emptyTitle="No inquiries yet"
          emptyDescription="Create a Medical Information inquiry to begin the workflow."
        />
      </section>
    </div>,
  );
}
