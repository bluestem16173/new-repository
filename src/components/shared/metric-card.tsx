import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  icon,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "h-full rounded-[12px] border-0 bg-white py-5 shadow-none ring-1 ring-[#10243A]/8",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium tracking-wide text-[#10243A]/70">
          {title}
        </CardTitle>
        {icon ? (
          <div
            className="flex size-9 items-center justify-center rounded-lg bg-[#F3F6FA] text-[#2563EB]"
            aria-hidden
          >
            {icon}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight text-[#10243A] tabular-nums">
          {value}
        </div>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-[#10243A]/60">
            {description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
