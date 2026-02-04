"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRouter } from "next/navigation";
import {
  DEFAULT_QUALIFICATION_GOALS,
  DEFAULT_EMERGENCY_TRIGGERS,
  DEFAULT_EMERGENCY_INSTRUCTIONS,
} from "@/lib/agentDefaults";
import Link from "next/link";

export default function NewAgentPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  const workspace = useQuery(
    api.workspaces.getMyWorkspace,
    isAuthenticated ? {} : "skip"
  );
  const createAgent = useMutation(api.agentConfigs.createAgent);

  const [agentName, setAgentName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [toneStyle, setToneStyle] = useState("professional");
  const [toneDescription, setToneDescription] = useState(
    "Professional, calm, and friendly. Reassuring for emergency callers."
  );
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !agentName.trim() || !businessName.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const agentConfigId = await createAgent({
        workspaceId: workspace._id,
        agentName: agentName.trim(),
        businessName: businessName.trim(),
        tone: {
          style: toneStyle.trim(),
          description: toneDescription.trim(),
        },
        customContext: "",
        qualificationGoals: DEFAULT_QUALIFICATION_GOALS.map((g) => ({
          key: g.key,
          label: g.label,
          required: g.required,
        })),
        emergencyProtocol: {
          triggers: DEFAULT_EMERGENCY_TRIGGERS.map((t) => ({
            keyword: t.keyword,
            action: t.action,
          })),
          instructions: DEFAULT_EMERGENCY_INSTRUCTIONS,
        },
      });

      router.push(`/dashboard/agents/${agentConfigId}/settings`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create agent"
      );
      setCreating(false);
    }
  };

  if (isLoading || workspace === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href="/dashboard/agents"
          className="text-sm text-[var(--accent)] hover:text-[var(--accent-strong)] font-medium"
        >
          &larr; Back to Agents
        </Link>
        <h1 className="text-3xl font-semibold text-zinc-900 font-display mt-2">
          Create New Agent
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Set up a new AI receptionist agent with default settings.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="space-y-5 surface-card p-6"
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Agent Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="e.g., TreeLine Receptionist"
            required
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g., TreeLine Tree Removal"
            required
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Tone Style
          </label>
          <input
            type="text"
            value={toneStyle}
            onChange={(e) => setToneStyle(e.target.value)}
            placeholder="e.g., professional"
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Tone Description
          </label>
          <textarea
            value={toneDescription}
            onChange={(e) => setToneDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all resize-none"
          />
        </div>

        <div className="surface-muted p-4">
          <h3 className="text-sm font-medium text-zinc-700 mb-2">
            Default Qualification Goals
          </h3>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_QUALIFICATION_GOALS.map((goal) => (
              <span
                key={goal.key}
                className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                  goal.required
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-200 text-zinc-600"
                }`}
              >
                {goal.label}
                {goal.required && " *"}
              </span>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            You can customize these after creating the agent.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={creating || !agentName.trim() || !businessName.trim()}
          className="w-full rounded-full px-5 py-2.5 text-sm font-medium btn-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {creating ? "Creating..." : "Create Agent"}
        </button>
      </form>
    </div>
  );
}
