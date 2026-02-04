"use client";

import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import AgentStatusCard from "@/components/AgentStatusCard";
import Link from "next/link";

export default function AgentsListPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  const workspace = useQuery(
    api.workspaces.getMyWorkspace,
    isAuthenticated ? {} : "skip"
  );
  const agents = useQuery(
    api.agentConfigs.listAgents,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  if (isLoading || agents === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  const sortedAgents = [...agents].sort((a, b) => {
    if (a.isDefault === b.isDefault) {
      return a.agentName.localeCompare(b.agentName);
    }
    return a.isDefault ? -1 : 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 font-display">
            Agents
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your AI receptionist agents
          </p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="rounded-full px-4 py-2 text-sm font-medium btn-primary transition-colors"
        >
          + Create Agent
        </Link>
      </div>

      {agents.length === 0 ? (
        <div className="surface-card border-2 border-dashed border-[var(--border)] p-12 text-center">
          <div className="text-zinc-400 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-zinc-600 font-medium mb-1">No agents yet</p>
          <p className="text-sm text-zinc-500 mb-4">
            Create your first AI receptionist to get started.
          </p>
          <Link
            href="/dashboard/agents/new"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium btn-primary transition-colors"
          >
            Create Your First Agent
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAgents.map((agent) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
