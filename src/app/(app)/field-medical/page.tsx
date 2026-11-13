import { GraduationCap, Route, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { renderAppPage } from "@/lib/page";

export default async function FieldMedicalPage() {
  return renderAppPage(
    "Field Medical",
    <div className="space-y-6">
      <div className="rounded-xl border bg-[linear-gradient(135deg,oklch(0.97_0.02_210),oklch(0.99_0.01_180))] p-6 sm:p-8">
        <Badge variant="outline" className="mb-3">
          Module 2 · Planned
        </Badge>
        <h2 className="max-w-2xl text-2xl font-semibold tracking-tight">
          Capability development for Field Medical teams
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          This module will support MSL competency assessment, scientific exchange
          simulations, and coaching plans. Navigation is scaffolded in Phase 1;
          workflow execution is not yet validated.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="size-4" aria-hidden />
              Competencies
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Domain model includes Competency entities. Authoring UI and scoring
            rubrics are planned.
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="size-4" aria-hidden />
              Simulations
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Scenario-based practice for scientific exchange. Not available for
            production use in Phase 1.
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Route className="size-4" aria-hidden />
              Coaching plans
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Field director coaching workflows are modeled in types and schema
            only. Implementation comes later.
          </CardContent>
        </Card>
      </div>
    </div>,
  );
}
