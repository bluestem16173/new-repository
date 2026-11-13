import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FieldMedicalSubnav } from "@/components/field-medical/fm-subnav";
import { ScientificSection } from "@/components/scientific/scientific-section";
import { SimulationSessionPanel } from "@/components/scientific/simulation-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { canValidateFmCompetency } from "@/domain/field-medical/authorization";
import { THERAPEUTIC_AREA_LABELS } from "@/domain/field-medical/types";
import { SIMULATION_CATEGORY_LABELS } from "@/domain/scientific/types";
import { SI_EVIDENCE_NOTICE } from "@/lib/demo/scientific-evidence-seed";
import { renderAppPage } from "@/lib/page";
import { getCurrentUser } from "@/lib/session";
import { listScientificDocuments } from "@/services/scientific/retrieval";
import { getSimulationScenario } from "@/services/scientific/simulations";
import { THERAPEUTIC_AREA_ROWS } from "@/components/scientific/therapeutic-area-row";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SimulationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [scenario, user] = await Promise.all([
    getSimulationScenario(id),
    getCurrentUser(),
  ]);
  if (!scenario) notFound();

  const documents = listScientificDocuments().filter((d) =>
    scenario.allowedEvidenceDocumentIds.includes(d.id),
  );
  const taMeta = THERAPEUTIC_AREA_ROWS.find(
    (row) => row.id === scenario.therapeuticArea,
  );
  const canValidate = canValidateFmCompetency(user.role);

  return renderAppPage(
    scenario.code,
    <div className="mx-auto w-full max-w-[1100px] space-y-10 bg-white px-1 py-2">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {SIMULATION_CATEGORY_LABELS[scenario.category]}
              </Badge>
              <Badge variant="outline">
                {THERAPEUTIC_AREA_LABELS[scenario.therapeuticArea]}
              </Badge>
              <Badge variant="outline">Rubric {scenario.rubricVersion}</Badge>
            </div>
            <h2 className="max-w-3xl text-[1.75rem] font-semibold tracking-tight text-[#17212B]">
              {scenario.title}
            </h2>
            <p className="max-w-3xl text-[16px] leading-[1.65] text-[#17212B]/70">
              {scenario.clinicalContext}
            </p>
          </div>
          <Button
            variant="outline"
            className="border-[#E5E7EB]"
            render={<Link href="/field-medical/simulations" />}
          >
            All simulations
          </Button>
        </div>
        <FieldMedicalSubnav />
      </header>

      <p
        className="border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3 text-[14px] leading-relaxed text-[#17212B]/80"
        role="status"
      >
        {SI_EVIDENCE_NOTICE}
      </p>

      {taMeta ? (
        <div className="relative aspect-[21/7] w-full overflow-hidden rounded-md border border-[#E5E7EB] bg-[#F8FAFC]">
          <Image
            src={taMeta.imageSrc}
            alt={taMeta.imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 1100px) 100vw, 1100px"
            priority
          />
        </div>
      ) : null}

      <ScientificSection
        title="HCP / KOL scenario"
        description="Fictional persona for teaching only. Not a real clinician."
      >
        <p className="text-[15px] leading-[1.65] text-[#17212B]">
          {scenario.hcpPersona}
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-[#17212B]/75">
          {scenario.learningObjectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
      </ScientificSection>

      <ScientificSection
        title="Allowlisted evidence"
        description="Only these teaching documents may ground claims in this scenario. Passages are untrusted until medically reviewed in production workflows."
      >
        <ul className="divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
          {documents.map((doc) => (
            <li key={doc.id} className="space-y-1 py-4">
              <p className="font-medium text-[#17212B]">{doc.title}</p>
              <p className="text-[14px] text-[#17212B]/65">
                {doc.sourceName} · version {doc.version} ·{" "}
                {doc.verificationStatus.replaceAll("_", " ")}
              </p>
              {doc.licenseNote ? (
                <p className="text-[13px] text-[#17212B]/55">{doc.licenseNote}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </ScientificSection>

      <ScientificSection
        title="Conversation"
        description="Turn-based exchange. Transcripts, timestamps, scenario version, and evidence references are persisted in the demo store."
      >
        <SimulationSessionPanel
          scenarioId={scenario.id}
          canValidate={canValidate}
        />
      </ScientificSection>
    </div>,
  );
}
