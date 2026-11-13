import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScientificSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ScientificSection({
  title,
  description,
  action,
  children,
  className,
}: ScientificSectionProps) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="flex flex-col gap-3 border-b border-[#E5E7EB] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-[1.375rem] font-semibold tracking-tight text-[#17212B]">
            {title}
          </h2>
          {description ? (
            <p className="max-w-3xl text-[15px] leading-[1.65] text-[#17212B]/70">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
