import { ShieldAlert } from "lucide-react";
import { OVERSIGHT_LABEL } from "@/domain/workflow-studio/mock-report";
import { cn } from "@/lib/utils";

interface DemoOversightBannerProps {
  className?: string;
  label?: string;
}

export function DemoOversightBanner({
  className,
  label = OVERSIGHT_LABEL,
}: DemoOversightBannerProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-amber-50/80 to-white px-4 py-3 shadow-[0_1px_0_rgba(251,191,36,0.25)]",
        className,
      )}
      role="note"
    >
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-800">
        <ShieldAlert className="size-4" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-900">
          Illustrative Demo · Human oversight required
        </p>
        <p className="text-[13px] leading-relaxed text-amber-950/90">{label}</p>
      </div>
    </div>
  );
}
