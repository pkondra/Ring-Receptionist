"use client";

interface AgentStatusCardProps {
  agentName: string;
  businessName: string;
  status: "online" | "offline" | "configuring";
  isDefault?: boolean;
}

const statusConfig = {
  online: {
    label: "Online",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  offline: {
    label: "Offline",
    dot: "bg-zinc-400",
    bg: "bg-zinc-100",
    text: "text-zinc-600",
  },
  configuring: {
    label: "Setup",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
};

export default function AgentStatusCard({
  agentName,
  businessName,
  status,
  isDefault = false,
}: AgentStatusCardProps) {
  const { label, dot, bg, text } = statusConfig[status];

  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          Agent
        </span>
        <div className="flex items-center gap-2">
          {isDefault && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Default
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {label}
          </span>
        </div>
      </div>
      <p className="text-lg font-semibold text-zinc-900 font-display">
        {agentName}
      </p>
      <p className="text-sm text-zinc-500">{businessName}</p>
    </div>
  );
}
