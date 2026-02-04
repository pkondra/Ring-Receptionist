"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import WorkspaceKnowledgeBaseEditor from "@/components/WorkspaceKnowledgeBaseEditor";
import Link from "next/link";
import { motion } from "framer-motion";

export default function KnowledgeBasePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const workspace = useQuery(
    api.workspaces.getMyWorkspace,
    isAuthenticated ? {} : "skip"
  );
  const agents = useQuery(
    api.agentConfigs.listAgents,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  if (isLoading || workspace === undefined || agents === undefined) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">Workspace not found</h3>
          <p className="text-zinc-500 mb-6">
            Unable to load your workspace. Please try again or contact support.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-rose-600 mb-1">AI Training</p>
          <h1 className="text-3xl font-bold text-zinc-900 font-display">
            Knowledge Base
          </h1>
          <p className="text-zinc-500 mt-1">
            Train your AI receptionist with custom knowledge about your business.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-sm font-medium text-rose-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {agents.length} {agents.length === 1 ? 'Agent' : 'Agents'} Using
          </span>
        </div>
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl border border-rose-100 p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 mb-1">How Knowledge Base Works</h3>
            <p className="text-sm text-zinc-600">
              Add FAQs, business information, and specific instructions here. This knowledge is shared across all your agents, helping them answer questions accurately and consistently.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Editor Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-zinc-200 overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Edit Knowledge</h3>
              <p className="text-sm text-zinc-500">
                Changes are automatically saved and applied to all agents
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <WorkspaceKnowledgeBaseEditor
            workspaceId={workspace._id}
            agentIds={agents.map((agent) => agent._id)}
          />
        </div>
      </motion.div>

      {/* Tips Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-zinc-200 overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-100">
          <h3 className="text-lg font-semibold text-zinc-900">Tips for Better Results</h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-start gap-3 p-4 rounded-xl hover:bg-zinc-50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-zinc-900">Be Specific</p>
              <p className="text-sm text-zinc-500">Include exact prices, hours, and service areas</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl hover:bg-zinc-50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-zinc-900">Add FAQs</p>
              <p className="text-sm text-zinc-500">Common questions your customers ask</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl hover:bg-zinc-50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-zinc-900">Update Regularly</p>
              <p className="text-sm text-zinc-500">Keep info current for accurate responses</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
