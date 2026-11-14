"use client";

import { useMemo, useState } from "react";
import { calculateScenarioCapacity } from "@/domain/knowledge/schemas";
import type { KnowledgeValueAssumptions } from "@/domain/knowledge/types";

export function RoiScenarioControls({
  initial,
}: {
  initial: KnowledgeValueAssumptions;
}) {
  const [mslWorkforceSize, setMslWorkforceSize] = useState(
    initial.mslWorkforceSize,
  );
  const [monthlyResearchInquiriesPerMsl, setMonthly] = useState(
    initial.monthlyResearchInquiriesPerMsl,
  );
  const [eligibleReusePercentage, setReuse] = useState(
    initial.eligibleReusePercentage,
  );
  const [netMinutesSavedPerReuse, setMinutes] = useState(
    initial.netMinutesSavedPerReuse,
  );
  const [loadedHourlyLaborCost, setCost] = useState(
    initial.loadedHourlyLaborCost,
  );

  const scenario = useMemo(
    () =>
      calculateScenarioCapacity({
        mslWorkforceSize,
        monthlyResearchInquiriesPerMsl,
        eligibleReusePercentage,
        netMinutesSavedPerReuse,
        loadedHourlyLaborCost,
      }),
    [
      mslWorkforceSize,
      monthlyResearchInquiriesPerMsl,
      eligibleReusePercentage,
      netMinutesSavedPerReuse,
      loadedHourlyLaborCost,
    ],
  );

  return (
    <div className="space-y-5 rounded-xl border border-[#E5E7EB] bg-white p-4 sm:p-5">
      <div className="space-y-1">
        <h3 className="text-[16px] font-semibold text-[#17212B]">
          ROI scenario model
        </h3>
        <p className="text-[13px] leading-relaxed text-[#17212B]/65">
          Scenario Estimate only — not observed employer performance. Does not
          extrapolate this demo sample to company-wide cash savings.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-[13px] text-[#17212B]/70">
          MSL workforce size
          <input
            type="number"
            min={1}
            value={mslWorkforceSize}
            onChange={(e) => setMslWorkforceSize(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
          />
        </label>
        <label className="space-y-1 text-[13px] text-[#17212B]/70">
          Monthly research-intensive inquiries / MSL
          <input
            type="number"
            min={0}
            value={monthlyResearchInquiriesPerMsl}
            onChange={(e) => setMonthly(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
          />
        </label>
        <label className="space-y-1 text-[13px] text-[#17212B]/70">
          Eligible reuse percentage (0–1)
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={eligibleReusePercentage}
            onChange={(e) => setReuse(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
          />
        </label>
        <label className="space-y-1 text-[13px] text-[#17212B]/70">
          Net minutes saved / eligible reuse
          <input
            type="number"
            min={0}
            value={netMinutesSavedPerReuse}
            onChange={(e) => setMinutes(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
          />
        </label>
        <label className="space-y-1 text-[13px] text-[#17212B]/70 sm:col-span-2">
          Loaded hourly labor cost ($)
          <input
            type="number"
            min={0}
            value={loadedHourlyLaborCost}
            onChange={(e) => setCost(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/35"
          />
        </label>
      </div>
      <dl className="grid gap-3 rounded-lg border border-teal-100 bg-teal-50/60 p-4 text-[14px] sm:grid-cols-2">
        <div>
          <dt className="text-[#17212B]/55">Monthly net hours recovered</dt>
          <dd className="text-lg font-semibold text-[#17212B]">
            {scenario.monthlyNetHoursRecovered.toFixed(1)}
            <span className="ml-2 text-[11px] font-medium uppercase tracking-wide text-teal-800">
              Scenario Estimate
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-[#17212B]/55">
            Monthly equivalent capacity value
          </dt>
          <dd className="text-lg font-semibold text-[#17212B]">
            ${scenario.monthlyEquivalentCapacityValue.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
            <span className="ml-2 text-[11px] font-medium uppercase tracking-wide text-teal-800">
              Capacity ≠ cash
            </span>
          </dd>
        </div>
      </dl>
      <p className="text-[12px] leading-relaxed text-[#17212B]/55">
        {scenario.formula}
      </p>
    </div>
  );
}
