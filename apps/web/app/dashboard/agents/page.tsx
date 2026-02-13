"use client";

import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import Link from "next/link";
import { motion } from "framer-motion";

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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500">Loading agents...</p>
        </div>
      </div>
    );
  }

  const sortedAgents = [...agents].sort((a, b) => {
    if (a.isDefault === b.isDefault) {
      return a.agentName.localeCompare(b.agentName);
    }
    return a.isDefault ? -1 : 1;
  });

  const activeCount = agents.filter((a: { elevenlabsAgentId?: string }) => a.elevenlabsAgentId).length;

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-blue-600 mb-1">Agent Management</p>
          <h1 className="text-3xl font-bold text-zinc-900 font-display">
            Your Agents
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage your AI receptionist agents and their configurations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {activeCount} Active
          </span>
          <Link
            href="/dashboard/agents/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Agent
          </Link>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No agents yet</h3>
          <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
            Create your first AI receptionist to start answering calls and capturing leads.
          </p>
          <Link
            href="/dashboard/agents/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Your First Agent
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedAgents.map((agent, index) => (
            <motion.div
              key={agent._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-white rounded-2xl border border-zinc-200 p-6 hover:border-zinc-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold ${
                    agent.elevenlabsAgentId
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {agent.agentName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900 text-lg">{agent.agentName}</h3>
                      {agent.isDefault && (
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500">{agent.businessName}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-5">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  agent.elevenlabsAgentId
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    agent.elevenlabsAgentId ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                  {agent.elevenlabsAgentId ? 'Online & Ready' : 'Needs Setup'}
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/dashboard/agents/${agent._id}/settings`}
                  className="flex-1 text-center py-2.5 px-4 rounded-xl text-sm font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
                >
                  Settings
                </Link>
                {agent.elevenlabsAgentId && (
                  <Link
                    href={`/chat/${agent._id}`}
                    className="flex-1 text-center py-2.5 px-4 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    Test Call
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
