"use client";

interface MemoryFact {
  key: string;
  value: string;
}

interface MemoryFactsPanelProps {
  facts: MemoryFact[];
}

export default function MemoryFactsPanel({ facts }: MemoryFactsPanelProps) {
  return (
    <div className="surface-card p-5">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">
        Memory Facts
      </h3>
      {facts.length === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-4">
          No facts captured yet...
        </p>
      ) : (
        <div className="space-y-2.5">
          {facts.map((fact, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-emerald-50 rounded-xl p-2.5"
            >
              <span className="text-xs font-medium text-emerald-700 w-20 shrink-0">
                {fact.key}
              </span>
              <span className="text-sm text-emerald-900 font-medium">
                {fact.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
