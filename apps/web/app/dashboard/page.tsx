"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import AgentStatusCard from "@/components/AgentStatusCard";
import Link from "next/link";

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [setupComplete, setSetupComplete] = useState(false);

  const ensureAccountSetup = useMutation(api.users.ensureAccountSetup);
  const workspace = useQuery(
    api.workspaces.getMyWorkspace,
    isAuthenticated ? {} : "skip"
  );
  const agents = useQuery(
    api.agentConfigs.listAgents,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const leads = useQuery(
    api.chatSessions.listLeadsForWorkspace,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const sessions = useQuery(
    api.chatSessions.listSessionsForWorkspace,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const billingSummary = useQuery(
    api.billing.getBillingSummary,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  useEffect(() => {
    if (isAuthenticated && !setupComplete) {
      ensureAccountSetup()
        .then(() => setSetupComplete(true))
        .catch(console.error);
    }
  }, [isAuthenticated, setupComplete, ensureAccountSetup]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  const sortedAgents = agents
    ? [...agents].sort((a, b) => {
        if (a.isDefault === b.isDefault) {
          return a.agentName.localeCompare(b.agentName);
        }
        return a.isDefault ? -1 : 1;
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-zinc-900 font-display">
          {workspace?.name ?? "Loading workspace..."}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Welcome to your dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents === undefined ? (
          <div className="surface-card p-5 animate-pulse">
            <div className="h-3 bg-zinc-100 rounded w-20 mb-3" />
            <div className="h-5 bg-zinc-100 rounded w-40 mb-2" />
            <div className="h-3 bg-zinc-100 rounded w-28" />
          </div>
        ) : agents.length === 0 ? (
          <div className="surface-card border-2 border-dashed border-[var(--border)] p-8 col-span-full text-center">
            <div className="text-zinc-400 mb-3">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-zinc-600 font-medium mb-1">No agents yet</p>
            <p className="text-sm text-zinc-500 mb-4">Create your first AI receptionist to get started</p>
            <Link
              href="/dashboard/agents/new"
              className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium btn-primary transition-colors"
            >
              Create Your First Agent
            </Link>
          </div>
        ) : (
          sortedAgents.map((agent) => (
            <div key={agent._id} className="space-y-3">
              <AgentStatusCard
                agentName={agent.agentName}
                businessName={agent.businessName}
                status={agent.elevenlabsAgentId ? "online" : "configuring"}
                isDefault={agent.isDefault}
              />
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/agents/${agent._id}/settings`}
                  className="flex-1 text-center rounded-full px-3 py-2 text-sm font-medium btn-outline transition-colors"
                >
                  Settings
                </Link>
                {agent.elevenlabsAgentId && (
                  <Link
                    href={`/chat/${agent._id}`}
                    className="flex-1 text-center rounded-full px-3 py-2 text-sm font-medium btn-primary transition-colors"
                  >
                    Voice Lab
                  </Link>
                )}
              </div>
            </div>
          ))
        )}

        <div className="surface-card p-5">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            Recent Leads
          </h3>
          {leads === undefined ? (
            <p className="text-sm text-zinc-400">Loading leads...</p>
          ) : leads.length === 0 ? (
            <p className="text-sm text-zinc-400">No leads yet</p>
          ) : (
            <div className="space-y-2">
              {leads.slice(0, 3).map((lead) => (
                <div key={lead._id} className="text-sm">
                  <p className="text-zinc-800 font-medium">
                    {lead.extractedFields?.callerName ?? "Unknown Caller"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {lead.agentName} · {formatDate(lead.startedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="surface-card p-5">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            Minutes Remaining
          </h3>
          {billingSummary === undefined ? (
            <p className="text-sm text-zinc-400">Loading minutes...</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-semibold text-zinc-900">
                  {billingSummary?.minutesRemaining ?? 0}
                </span>
                <span className="text-sm text-zinc-500 pb-1">minutes</span>
              </div>
              <p className="text-xs text-zinc-500">
                Used {billingSummary?.minutesUsed ?? 0} of{" "}
                {billingSummary?.minutesIncluded ?? 0} ·{" "}
                {billingSummary?.plan ?? "starter"} plan
              </p>
              <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
                <div
                  className="h-full bg-black"
                  style={{
                    width: billingSummary
                      ? `${Math.min(
                          100,
                          (billingSummary.minutesUsed /
                            Math.max(1, billingSummary.minutesIncluded)) *
                            100
                        )}%`
                      : "0%",
                  }}
                />
              </div>
              <Link
                href="/dashboard/billing"
                className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]"
              >
                Manage billing
              </Link>
            </div>
          )}
        </div>

        <div className="surface-card p-5">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            Recent Calls
          </h3>
          {sessions === undefined ? (
            <p className="text-sm text-zinc-400">Loading calls...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-zinc-400">No calls yet</p>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 3).map((session) => (
                <div key={session._id} className="text-sm">
                  <p className="text-zinc-800 font-medium">
                    {session.agentName}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {session.status === "ended" ? "Completed" : "Active"} ·{" "}
                    {formatDate(session.startedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
