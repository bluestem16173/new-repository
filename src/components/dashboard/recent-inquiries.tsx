import Link from "next/link";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MedicalInquiry } from "@/domain/types";

interface RecentInquiriesProps {
  inquiries: MedicalInquiry[];
}

function formatSubmitted(iso: string | null): string {
  if (!iso) return "Not submitted";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RecentInquiries({ inquiries }: RecentInquiriesProps) {
  return (
    <Card className="rounded-[12px] border-0 bg-white shadow-none ring-1 ring-[#10243A]/8">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-[#10243A]">
            Recent medical inquiries
          </CardTitle>
          <CardDescription className="text-sm text-[#10243A]/60">
            Latest activity across the Medical Information workspace
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-[#10243A]/15 text-[#10243A] hover:bg-[#F3F6FA]"
          render={<Link href="/medical-information" />}
        >
          View all inquiries
        </Button>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {inquiries.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              title="No inquiries yet"
              description="Create a Medical Information inquiry to begin the workflow."
              className="border-[#10243A]/10 bg-[#F3F6FA] py-10"
              action={
                <Button
                  render={
                    <Link href="/medical-information/inquiries/new" />
                  }
                >
                  New medical inquiry
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-y border-[#10243A]/8 bg-[#F3F6FA]/80 text-[#10243A]/65">
                  <th className="px-6 py-3 font-medium">Inquiry ID</th>
                  <th className="px-4 py-3 font-medium">Therapeutic area</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => (
                  <tr
                    key={inquiry.id}
                    className="border-b border-[#10243A]/6 last:border-b-0"
                  >
                    <td className="px-6 py-3.5 align-middle">
                      <Link
                        href={`/medical-information/inquiries/${inquiry.id}`}
                        className="font-semibold text-[#2563EB] outline-none hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
                      >
                        {inquiry.referenceCode}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 max-w-[220px] text-xs text-[#10243A]/55">
                        {inquiry.title}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-[#10243A]">
                      {inquiry.therapeuticArea}
                    </td>
                    <td className="px-4 py-3.5 align-middle tabular-nums text-[#10243A]/75">
                      {formatSubmitted(inquiry.submittedAt)}
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <StatusIndicator status={inquiry.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right align-middle">
                      <Link
                        href={`/medical-information/inquiries/${inquiry.id}`}
                        className="inline-flex rounded-md px-2 py-1 text-sm font-medium text-[#2563EB] outline-none hover:bg-[#EFF6FF] focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
