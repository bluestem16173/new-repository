import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { InquiryForm } from "@/components/inquiries/inquiry-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { renderAppPage } from "@/lib/page";
import { getRuntimeMode } from "@/lib/supabase/env";

async function NewInquiryPageContent() {
  await connection();
  const mode = getRuntimeMode();

  return renderAppPage(
    "New Medical Inquiry",
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Inquiry intake</h2>
          <p className="text-sm text-muted-foreground">
            Capture a Medical Information request. No real PHI.
          </p>
        </div>
        <Button
          variant="outline"
          render={<Link href="/medical-information" />}
        >
          Back
        </Button>
      </div>

      {mode === "demo" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Demo mode: submitted inquiries are held in memory only and will not
          persist across server restarts.
        </p>
      ) : null}

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Request details</CardTitle>
        </CardHeader>
        <CardContent>
          <InquiryForm />
        </CardContent>
      </Card>
    </div>,
  );
}

export default function NewInquiryPage() {
  return <Suspense fallback={<p className="p-6 text-sm text-slate-600">Loading workspace…</p>}><NewInquiryPageContent /></Suspense>;
}
