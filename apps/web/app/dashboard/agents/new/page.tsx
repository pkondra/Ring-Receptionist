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
import { motion } from "framer-motion";

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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/agents"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Agents
        </Link>
        <p className="text-sm font-medium text-blue-600 mb-1">New Agent</p>
        <h1 className="text-3xl font-bold text-zinc-900 font-display">
          Create AI Receptionist
        </h1>
        <p className="text-zinc-500 mt-1">
          Set up a new agent with default settings. You can customize everything later.
        </p>
      </div>

      {/* Form Card */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleCreate}
        className="bg-white rounded-2xl border border-zinc-200 overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Agent Details</h3>
              <p className="text-sm text-zinc-500">Basic information about your AI receptionist</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Agent Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Agent Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="e.g., theringreceiptionsit.com"
              required
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
            <p className="text-xs text-zinc-400 mt-1.5">This is how your agent will identify itself to callers</p>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., Acme Plumbing Co."
              required
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
            <p className="text-xs text-zinc-400 mt-1.5">Your business name that the agent represents</p>
          </div>

          {/* Tone Style */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Tone Style
            </label>
            <input
              type="text"
              value={toneStyle}
              onChange={(e) => setToneStyle(e.target.value)}
              placeholder="e.g., professional, friendly, casual"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
          </div>

          {/* Tone Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Tone Description
            </label>
            <textarea
              value={toneDescription}
              onChange={(e) => setToneDescription(e.target.value)}
              rows={3}
              placeholder="Describe how your agent should communicate..."
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
            />
          </div>

          {/* Default Goals Preview */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-sm font-medium text-zinc-700">Default Qualification Goals</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_QUALIFICATION_GOALS.map((goal) => (
                <span
                  key={goal.key}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    goal.required
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-zinc-200 text-zinc-600"
                  }`}
                >
                  {goal.label}
                  {goal.required && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              These are the default goals your agent will try to collect from callers. You can customize them after creation.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
          <Link
            href="/dashboard/agents"
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={creating || !agentName.trim() || !businessName.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Agent
              </>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
