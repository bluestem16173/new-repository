import { connection } from "next/server";
import { Suspense } from "react";
import { WorkflowStudioApp } from "@/components/workflow-studio/workflow-studio-app";
import { renderAppPage } from "@/lib/page";

async function WorkflowStudioPageContent() {
  await connection();

  return renderAppPage(
    "Workflow Studio",
    <WorkflowStudioApp />,
  );
}

export default function WorkflowStudioPage() {
  return (
    <Suspense
      fallback={
        <p className="p-6 text-sm text-slate-600">Loading Workflow Studio…</p>
      }
    >
      <WorkflowStudioPageContent />
    </Suspense>
  );
}
