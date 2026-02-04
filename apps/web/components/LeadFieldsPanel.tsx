"use client";

import type { ExtractedFields } from "@/lib/extractLeadFields";

interface LeadFieldsPanelProps {
  fields: ExtractedFields;
}

const FIELD_LABELS: Record<keyof ExtractedFields, string> = {
  callerName: "Name",
  phone: "Phone",
  address: "Address",
  reason: "Reason",
  numberOfTrees: "# Trees",
  sizeEstimate: "Size",
  urgency: "Urgency",
  hazards: "Hazards",
  accessConstraints: "Access",
  preferredWindow: "Preferred Time",
};

export default function LeadFieldsPanel({ fields }: LeadFieldsPanelProps) {
  const entries = Object.entries(FIELD_LABELS) as Array<
    [keyof ExtractedFields, string]
  >;

  const filledCount = entries.filter(([key]) => fields[key]).length;

  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          Lead Fields
        </h3>
        <span className="text-xs font-medium text-[var(--accent-strong)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full">
          {filledCount}/{entries.length}
        </span>
      </div>
      <div className="space-y-2.5">
        {entries.map(([key, label]) => (
          <div key={key} className="flex items-start gap-3">
            <span className="text-xs font-medium text-zinc-500 w-20 shrink-0 pt-0.5">
              {label}
            </span>
            <span
              className={`text-sm flex-1 ${
                fields[key]
                  ? "text-zinc-900 font-medium"
                  : "text-zinc-300"
              }`}
            >
              {fields[key] ?? "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
