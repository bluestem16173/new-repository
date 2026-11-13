import Link from "next/link";
import { Plus } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MedicalInquiry } from "@/domain/types";
import { renderAppPage } from "@/lib/page";
import { listInquiries } from "@/services/inquiries";
import { getRuntimeMode } from "@/lib/supabase/env";
import { DEMO_MODE_NOTICE } from "@/lib/demo/seed";

export default async function MedicalInformationPage() {
  const inquiries = await listInquiries();
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
      cell: (row) => <span className="line-clamp-2 max-w-md">{row.title}</span>,
    },
    {
      id: "product",
      header: "Product",
      cell: (row) => row.productName,
    },
    {
      id: "priority",
      header: "Priority",
      cell: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.priority}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusIndicator status={row.status} />,
    },
    {
      id: "updated",
      header: "Updated",
      cell: (row) =>
        new Date(row.updatedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
  ];

  return renderAppPage(
    "Medical Information",
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Inquiry workspace
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Intake, evidence review, response drafting, and medical approval for
            Medical Information inquiries. Validated Phase 1 capability.
          </p>
        </div>
        <Button render={<Link href="/medical-information/inquiries/new" />}>
          <Plus className="size-4" />
          New inquiry
        </Button>
      </div>

      {mode === "demo" ? (
        <p className="text-sm text-amber-900" role="status">
          {DEMO_MODE_NOTICE}
        </p>
      ) : null}

      <DataTable
        columns={columns}
        rows={inquiries}
        getRowId={(row) => row.id}
        emptyTitle="No medical inquiries"
        emptyDescription="Start with a new inquiry intake form. All demo data is synthetic."
      />
    </div>,
  );
}
