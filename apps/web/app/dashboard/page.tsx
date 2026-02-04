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

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

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
      <div className="flex items-center justify-center h-64">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading your dashboard...</p>
        </motion.div>
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

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger}
      className="space-y-8"
    >
      {/* Success Message */}
      <AnimatePresence>
        {checkoutMessage && showMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-emerald-800 font-medium">{checkoutMessage}</p>
            </div>
            <button
              onClick={() => setShowMessage(false)}
              className="text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={fadeIn}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900 font-display">
              {workspace?.name ?? "Loading..."}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Welcome back! Here's what's happening with your AI receptionist.
            </p>
          </div>
          <Link
            href="/dashboard/agents/new"
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium btn-primary transition-all hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Agent
          </Link>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={fadeIn} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="surface-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-zinc-900">{totalCalls}</p>
              <p className="text-xs text-zinc-500">Total Calls</p>
            </div>
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-zinc-900">{totalLeads}</p>
              <p className="text-xs text-zinc-500">Leads Captured</p>
            </div>
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-zinc-900">{activeAgents}</p>
              <p className="text-xs text-zinc-500">Active Agents</p>
            </div>
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-zinc-900">
                {billingSummary?.minutesRemaining ?? 0}
              </p>
              <p className="text-xs text-zinc-500">Minutes Left</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents Section */}
        <motion.div variants={fadeIn} className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Your Agents</h2>
            <Link
              href="/dashboard/agents"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              View all →
            </Link>
          </div>

          {agents === undefined ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="surface-card p-5 animate-pulse">
                  <div className="h-4 bg-zinc-100 rounded w-24 mb-3" />
                  <div className="h-6 bg-zinc-100 rounded w-40 mb-2" />
                  <div className="h-3 bg-zinc-100 rounded w-32" />
                </div>
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="surface-card border-2 border-dashed border-[var(--border)] p-10 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">No agents yet</h3>
              <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
                Create your first AI receptionist to start answering calls and capturing leads automatically.
              </p>
              <Link
                href="/dashboard/agents/new"
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium btn-primary"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Agent
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedAgents.map((agent, index) => (
                <motion.div
                  key={agent._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-3"
                >
                  <AgentStatusCard
                    agentName={agent.agentName}
                    businessName={agent.businessName}
                    status={agent.elevenlabsAgentId ? "online" : "configuring"}
                    isDefault={agent.isDefault}
                  />
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/agents/${agent._id}/settings`}
                      className="flex-1 text-center rounded-full px-3 py-2.5 text-sm font-medium bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      Settings
                    </Link>
                    {agent.elevenlabsAgentId && (
                      <Link
                        href={`/chat/${agent._id}`}
                        className="flex-1 text-center rounded-full px-3 py-2.5 text-sm font-medium btn-primary transition-colors"
                      >
                        Test Call
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div variants={fadeIn} className="space-y-6">
          {/* Minutes Card */}
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
                Usage This Month
              </h3>
              <Link
                href="/dashboard/billing"
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Manage →
              </Link>
            </div>

            {billingSummary === undefined ? (
              <div className="animate-pulse space-y-3">
                <div className="h-8 bg-zinc-100 rounded w-24" />
                <div className="h-2 bg-zinc-100 rounded" />
                <div className="h-3 bg-zinc-100 rounded w-32" />
              </div>
            ) : billingSummary?.plan ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-zinc-900">
                      {billingSummary?.minutesRemaining ?? 0}
                    </span>
                    <span className="text-sm text-zinc-500">minutes left</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {billingSummary?.minutesUsed ?? 0} of {billingSummary?.minutesIncluded ?? 0} used
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: billingSummary
                          ? `${Math.min(
                              100,
                              (billingSummary.minutesUsed /
                                Math.max(1, billingSummary.minutesIncluded)) *
                                100
                            )}%`
                          : "0%",
                      }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-1 rounded-full bg-zinc-100 text-zinc-600 font-medium capitalize">
                      {billingSummary?.plan ?? "starter"} plan
                    </span>
                    {billingSummary?.minutesRemaining !== undefined &&
                      billingSummary.minutesRemaining < 30 && (
                        <span className="text-amber-600 font-medium">Running low</span>
                      )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-sm text-emerald-800 font-medium mb-2">
                    Start your free trial
                  </p>
                  <p className="text-xs text-emerald-700">
                    Get 150 minutes free for 7 days. No credit card required.
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="w-full inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-medium btn-primary"
                >
                  View Plans
                </Link>
              </div>
            )}
          </div>

          {/* Recent Leads */}
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
                Recent Leads
              </h3>
              <Link
                href="/dashboard/leads"
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                View all →
              </Link>
            </div>

            {leads === undefined ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-100" />
                    <div className="flex-1">
                      <div className="h-3 bg-zinc-100 rounded w-24 mb-1" />
                      <div className="h-2 bg-zinc-100 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-500">No leads captured yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.slice(0, 4).map((lead, index) => (
                  <motion.div
                    key={lead._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
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
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Calls */}
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
                Recent Calls
              </h3>
            </div>

            {sessions === undefined ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-100" />
                    <div className="flex-1">
                      <div className="h-3 bg-zinc-100 rounded w-24 mb-1" />
                      <div className="h-2 bg-zinc-100 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-500">No calls recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 4).map((session, index) => (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      session.status === "ended"
                        ? "bg-zinc-100 text-zinc-600"
                        : "bg-emerald-100 text-emerald-600"
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">
                        {session.agentName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className={`inline-flex items-center gap-1 ${
                          session.status === "ended" ? "" : "text-emerald-600"
                        }`}>
                          {session.status === "ended" ? "Completed" : "Active"}
                        </span>
                        <span>·</span>
                        <span>{formatRelativeTime(session.startedAt)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
