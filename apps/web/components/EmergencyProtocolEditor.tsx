"use client";

import type { EmergencyProtocol, EmergencyTrigger } from "@/lib/agentDefaults";

interface Props {
  protocol: EmergencyProtocol;
  onChange: (protocol: EmergencyProtocol) => void;
}

const ACTION_OPTIONS: { value: EmergencyTrigger["action"]; label: string }[] = [
  { value: "markUrgent", label: "Mark Urgent" },
  { value: "suggestDispatch", label: "Suggest Dispatch" },
  { value: "transferPlaceholder", label: "Transfer (Placeholder)" },
];

export default function EmergencyProtocolEditor({
  protocol,
  onChange,
}: Props) {
  const addTrigger = () => {
    onChange({
      ...protocol,
      triggers: [
        ...protocol.triggers,
        { keyword: "", action: "markUrgent" },
      ],
    });
  };

  const removeTrigger = (index: number) => {
    onChange({
      ...protocol,
      triggers: protocol.triggers.filter((_, i) => i !== index),
    });
  };

  const updateTrigger = (
    index: number,
    field: keyof EmergencyTrigger,
    value: string
  ) => {
    onChange({
      ...protocol,
      triggers: protocol.triggers.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      ),
    });
  };

  const updateInstructions = (instructions: string) => {
    onChange({ ...protocol, instructions });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Define keywords that trigger emergency handling.
        </p>
        <button
          type="button"
          onClick={addTrigger}
          className="rounded-full px-3 py-1.5 text-xs font-medium btn-primary transition-colors cursor-pointer"
        >
          + Add Trigger
        </button>
      </div>

      {protocol.triggers.length === 0 && (
        <p className="text-sm text-zinc-400 py-4 text-center surface-muted">
          No emergency triggers defined.
        </p>
      )}

      <div className="space-y-2">
        {protocol.triggers.map((trigger, index) => (
          <div
            key={index}
            className="flex items-center gap-2 surface-muted p-3"
          >
            <input
              type="text"
              value={trigger.keyword}
              onChange={(e) =>
                updateTrigger(index, "keyword", e.target.value)
              }
              placeholder="Keyword or phrase"
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-all"
            />
            <select
              value={trigger.action}
              onChange={(e) =>
                updateTrigger(index, "action", e.target.value)
              }
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-all"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeTrigger(index)}
              className="rounded-lg p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Remove trigger"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Emergency Instructions
        </label>
        <textarea
          value={protocol.instructions}
          onChange={(e) => updateInstructions(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all resize-none"
          placeholder="Instructions for how the agent should handle emergency situations..."
        />
      </div>
    </div>
  );
}
