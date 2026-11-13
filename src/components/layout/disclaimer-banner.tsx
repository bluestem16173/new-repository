import { AlertTriangle } from "lucide-react";

export function DisclaimerBanner() {
  return (
    <div
      className="border-b border-amber-200 bg-amber-50 text-amber-950"
      role="note"
      aria-label="Independent demonstration disclaimer"
    >
      <div className="flex items-start gap-2 px-4 py-2.5 text-xs leading-relaxed sm:px-6 sm:text-sm">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-amber-700"
          aria-hidden
        />
        <p>
          <span className="font-semibold">Independent demonstration.</span>{" "}
          MedIntel is not affiliated with any pharmaceutical company. All
          inquiry, evidence, and review content is synthetic and for portfolio
          demonstration only. Do not use for clinical decision-making.
        </p>
      </div>
    </div>
  );
}
