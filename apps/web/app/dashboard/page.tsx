"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import AgentStatusCard from "@/components/AgentStatusCard";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelativeTime(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [syncingCheckout, setSyncingCheckout] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState(true);
  const searchParams = useSearchParams();

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
    const sessionId = searchParams.get("session_id");
    const success = searchParams.get("success");
    if (!sessionId || !success || syncingCheckout) return;

    setSyncingCheckout(true);
    fetch("/api/stripe/sync-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to sync subscription");
        }
        setCheckoutMessage("Trial activated! Your minutes are ready to use.");
      })
      .catch((err) => {
        setCheckoutMessage(
          err instanceof Error ? err.message : "Failed to sync subscription"
        );
      })
      .finally(() => setSyncingCheckout(false));
  }, [searchParams, syncingCheckout]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500">Loading your dashboard...</p>
        </div>
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

  const totalCalls = sessions?.length ?? 0;
  const totalLeads = leads?.length ?? 0;
  const activeAgents = agents?.filter((a) => a.elevenlabsAgentId)?.length ?? 0;
  const minutesRemaining = billingSummary?.minutesRemaining ?? 0;
  const minutesUsed = billingSummary?.minutesUsed ?? 0;
  const minutesIncluded = billingSummary?.minutesIncluded ?? 0;
  const usagePercent = minutesIncluded > 0 ? Math.min(100, (minutesUsed / minutesIncluded) * 100) : 0;

  return (
    <div className="space-y-8 pb-8">
      {/* Success Message */}
      <AnimatePresence>
        {checkoutMessage && showMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-emerald-900">{checkoutMessage}</p>
                <p className="text-sm text-emerald-700">Your AI receptionist is ready to take calls.</p>
              </div>
            </div>
            <button
              onClick={() => setShowMessage(false)}
              className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-emerald-600 mb-1">Dashboard</p>
          <h1 className="text-3xl font-bold text-zinc-900 font-display">
            Welcome back{workspace?.name ? `, ${workspace.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-zinc-500 mt-1">
            Here's what's happening with your AI receptionist today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/leads"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            View Leads
          </Link>
          <Link
            href="/dashboard/agents/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Agent
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Calls */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-md hover:border-zinc-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              All time
            </span>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{totalCalls}</p>
          <p className="text-sm text-zinc-500 mt-1">Total Calls</p>
        </div>

        {/* Leads Captured */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-md hover:border-zinc-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <Link href="/dashboard/leads" className="text-xs font-medium text-zinc-500 hover:text-zinc-700">
              View all →
            </Link>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{totalLeads}</p>
          <p className="text-sm text-zinc-500 mt-1">Leads Captured</p>
        </div>

        {/* Active Agents */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-md hover:border-zinc-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <Link href="/dashboard/agents" className="text-xs font-medium text-zinc-500 hover:text-zinc-700">
              Manage →
            </Link>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{activeAgents}</p>
          <p className="text-sm text-zinc-500 mt-1">Active Agents</p>
        </div>

        {/* Minutes Remaining */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-md hover:border-zinc-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <Link href="/dashboard/billing" className="text-xs font-medium text-zinc-500 hover:text-zinc-700">
              Add more →
            </Link>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{minutesRemaining}</p>
          <p className="text-sm text-zinc-500 mt-1">Minutes Left</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Agents */}
        <div className="xl:col-span-2 space-y-6">
          {/* Agents Section */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Your Agents</h2>
                <p className="text-sm text-zinc-500">Manage your AI receptionists</p>
              </div>
              <Link
                href="/dashboard/agents"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                View all →
              </Link>
            </div>

            <div className="p-5">
              {agents === undefined ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-xl border border-zinc-200 p-5 animate-pulse">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-100" />
                        <div className="flex-1">
                          <div className="h-4 bg-zinc-100 rounded w-24 mb-2" />
                          <div className="h-3 bg-zinc-100 rounded w-32" />
                        </div>
                      </div>
                      <div className="h-10 bg-zinc-100 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : agents.length === 0 ? (
                <div className="text-center py-12">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sortedAgents.slice(0, 4).map((agent, index) => (
                    <motion.div
                      key={agent._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group rounded-xl border border-zinc-200 p-5 hover:border-zinc-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                            agent.elevenlabsAgentId
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}>
                            {agent.agentName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-zinc-900">{agent.agentName}</h3>
                              {agent.isDefault && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-zinc-500">{agent.businessName}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                          agent.elevenlabsAgentId
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            agent.elevenlabsAgentId ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} />
                          {agent.elevenlabsAgentId ? 'Online' : 'Setup'}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/agents/${agent._id}/settings`}
                          className="flex-1 text-center py-2.5 px-3 rounded-lg text-sm font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
                        >
                          Settings
                        </Link>
                        {agent.elevenlabsAgentId && (
                          <Link
                            href={`/chat/${agent._id}`}
                            className="flex-1 text-center py-2.5 px-3 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
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
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Recent Activity</h2>
                <p className="text-sm text-zinc-500">Latest calls and interactions</p>
              </div>
            </div>

            <div className="divide-y divide-zinc-100">
              {sessions === undefined ? (
                <div className="p-5 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-zinc-100" />
                      <div className="flex-1">
                        <div className="h-4 bg-zinc-100 rounded w-32 mb-2" />
                        <div className="h-3 bg-zinc-100 rounded w-24" />
                      </div>
                      <div className="h-3 bg-zinc-100 rounded w-16" />
                    </div>
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-zinc-900 mb-1">No calls yet</h3>
                  <p className="text-sm text-zinc-500">When your agent takes calls, they'll appear here.</p>
                </div>
              ) : (
                sessions.slice(0, 5).map((session, index) => (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-5 hover:bg-zinc-50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      session.status === "ended"
                        ? "bg-zinc-100 text-zinc-500"
                        : "bg-emerald-100 text-emerald-600"
                    }`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900">{session.agentName}</p>
                      <p className="text-sm text-zinc-500">
                        {session.status === "ended" ? "Call completed" : "Call in progress"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === "ended"
                          ? "bg-zinc-100 text-zinc-600"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          session.status === "ended" ? "bg-zinc-400" : "bg-emerald-500 animate-pulse"
                        }`} />
                        {session.status === "ended" ? "Ended" : "Active"}
                      </span>
                      <p className="text-xs text-zinc-500 mt-1">{formatRelativeTime(session.startedAt)}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Usage Card */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="p-5 border-b border-zinc-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900">Usage</h3>
                <Link
                  href="/dashboard/billing"
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Manage →
                </Link>
              </div>
            </div>

            <div className="p-5">
              {billingSummary === undefined ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-zinc-100 rounded w-20" />
                  <div className="h-3 bg-zinc-100 rounded" />
                  <div className="h-4 bg-zinc-100 rounded w-24" />
                </div>
              ) : billingSummary?.plan ? (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-zinc-900">{minutesRemaining}</span>
                      <span className="text-zinc-500">min</span>
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">
                      {minutesUsed} of {minutesIncluded} minutes used
                    </p>
                  </div>

                  <div>
                    <div className="h-2.5 rounded-full bg-zinc-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${usagePercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          usagePercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-zinc-100 text-xs font-medium text-zinc-700 capitalize">
                        {billingSummary?.plan} Plan
                      </span>
                      {minutesRemaining < 30 && (
                        <span className="text-xs font-medium text-amber-600">Running low</span>
                      )}
                    </div>
                  </div>

                  <Link
                    href="/pricing"
                    className="block w-full text-center py-2.5 rounded-lg text-sm font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all"
                  >
                    Upgrade Plan
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-emerald-900">Start Free Trial</p>
                    </div>
                    <p className="text-sm text-emerald-700">
                      Get 150 minutes free for 7 days. No credit card required.
                    </p>
                  </div>
                  <Link
                    href="/pricing"
                    className="block w-full text-center py-3 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                  >
                    View Plans
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Leads */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="p-5 border-b border-zinc-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900">Recent Leads</h3>
                <Link
                  href="/dashboard/leads"
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  View all →
                </Link>
              </div>
            </div>

            <div className="p-5">
              {leads === undefined ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-9 h-9 rounded-full bg-zinc-100" />
                      <div className="flex-1">
                        <div className="h-3 bg-zinc-100 rounded w-24 mb-1.5" />
                        <div className="h-2.5 bg-zinc-100 rounded w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
                    <svg className="w-7 h-7 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-zinc-900">No leads yet</p>
                  <p className="text-xs text-zinc-500 mt-1">Captured leads will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leads.slice(0, 5).map((lead, index) => (
                    <motion.div
                      key={lead._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold">
                        {(lead.extractedFields?.callerName ?? "U")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                          {lead.extractedFields?.callerName ?? "Unknown Caller"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatRelativeTime(lead.startedAt)}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="p-5 border-b border-zinc-100">
              <h3 className="font-semibold text-zinc-900">Quick Actions</h3>
            </div>
            <div className="p-3">
              <Link
                href="/dashboard/agents/new"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">Create New Agent</p>
                  <p className="text-xs text-zinc-500">Add another AI receptionist</p>
                </div>
              </Link>
              <Link
                href="/dashboard/billing"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">Manage Billing</p>
                  <p className="text-xs text-zinc-500">View plans and usage</p>
                </div>
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">Get Help</p>
                  <p className="text-xs text-zinc-500">Contact our support team</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
