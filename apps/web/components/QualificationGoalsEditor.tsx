"use client";

import type { QualificationGoal } from "@/lib/agentDefaults";

interface Props {
  goals: QualificationGoal[];
  onChange: (goals: QualificationGoal[]) => void;
}

export default function QualificationGoalsEditor({ goals, onChange }: Props) {
  const addGoal = () => {
    onChange([
      ...goals,
      { key: `goal_${Date.now()}`, label: "", required: false },
    ]);
  };

  const removeGoal = (index: number) => {
    onChange(goals.filter((_, i) => i !== index));
  };

  const updateGoal = (
    index: number,
    field: keyof QualificationGoal,
    value: string | boolean
  ) => {
    const updated = goals.map((g, i) =>
      i === index ? { ...g, [field]: value } : g
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Define what information the agent should collect from callers.
        </p>
        <button
          type="button"
          onClick={addGoal}
          className="rounded-full px-3 py-1.5 text-xs font-medium btn-soft transition-colors cursor-pointer"
        >
          + Add Goal
        </button>
      </div>

      {goals.length === 0 && (
        <p className="text-sm text-zinc-400 py-4 text-center surface-muted">
          No qualification goals defined.
        </p>
      )}

      <div className="space-y-2">
        {goals.map((goal, index) => (
          <div
            key={index}
            className="flex items-center gap-2 surface-muted p-3"
          >
            <input
              type="text"
              value={goal.key}
              onChange={(e) => updateGoal(index, "key", e.target.value)}
              placeholder="key"
              className="w-24 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-all"
            />
            <input
              type="text"
              value={goal.label}
              onChange={(e) => updateGoal(index, "label", e.target.value)}
              placeholder="Label"
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-all"
            />
            <label className="flex items-center gap-1.5 text-xs text-zinc-600 whitespace-nowrap bg-white px-2 py-1.5 rounded-lg border border-zinc-200">
              <input
                type="checkbox"
                checked={goal.required}
                onChange={(e) =>
                  updateGoal(index, "required", e.target.checked)
                }
                className="rounded border-zinc-300 text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              Required
            </label>
            <button
              type="button"
              onClick={() => removeGoal(index)}
              className="rounded-lg p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Remove goal"
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
    </div>
  );
}
