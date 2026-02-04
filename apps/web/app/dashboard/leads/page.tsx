"use client";

import { useMemo } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import Link from "next/link";
import { motion } from "framer-motion";

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

export default function LeadsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const workspace = useQuery(
    api.workspaces.getMyWorkspace,
    isAuthenticated ? {} : "skip"
  );
  const leads = useQuery(
    api.chatSessions.listLeadsForWorkspace,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  const rows = useMemo(() => {
    if (!leads) return [];
    return leads.map((lead) => ({
      id: lead._id,
      agentName: lead.agentName,
      businessName: lead.businessName,
      startedAt: lead.startedAt,
      fields: lead.extractedFields ?? {},
    }));
  }, [leads]);

  if (isLoading || leads === undefined) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-amber-600 mb-1">Lead Management</p>
          <h1 className="text-3xl font-bold text-zinc-900 font-display">
            Captured Leads
          </h1>
          <p className="text-zinc-500 mt-1">
            Qualified calls with extracted contact details.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-sm font-medium text-amber-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {rows.length} {rows.length === 1 ? 'Lead' : 'Leads'}
          </span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No leads captured yet</h3>
          <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
            When your AI receptionist captures lead information from calls, they'll appear here.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-6 gap-4 px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wide bg-zinc-50 border-b border-zinc-200">
            <span>Caller</span>
            <span>Phone</span>
            <span>Address</span>
            <span>Reason</span>
            <span>Agent</span>
            <span>Date</span>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-zinc-100">
            {rows.map((row, index) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4 px-6 py-5 text-sm hover:bg-zinc-50 transition-colors"
              >
                {/* Caller */}
                <div>
                  <div className="md:hidden text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1">
                    Caller
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-semibold">
                      {(row.fields.callerName ?? "U")[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-zinc-900">
                      {row.fields.callerName ?? "Unknown"}
                    </span>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center">
                  <div className="md:hidden text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1 w-full">
                    Phone
                  </div>
                  <span className="text-zinc-600">{row.fields.phone ?? "—"}</span>
                </div>

                {/* Address */}
                <div className="flex items-center">
                  <div className="md:hidden text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1 w-full">
                    Address
                  </div>
                  <span className="text-zinc-600 truncate">{row.fields.address ?? "—"}</span>
                </div>

                {/* Reason */}
                <div className="flex items-center">
                  <div className="md:hidden text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1 w-full">
                    Reason
                  </div>
                  <span className="text-zinc-600 truncate">{row.fields.reason ?? "—"}</span>
                </div>

                {/* Agent */}
                <div className="flex items-center">
                  <div className="md:hidden text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1 w-full">
                    Agent
                  </div>
                  <div>
                    <span className="font-medium text-zinc-900">{row.agentName}</span>
                    {row.businessName && (
                      <span className="block text-xs text-zinc-400">{row.businessName}</span>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center">
                  <div className="md:hidden text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1 w-full">
                    Date
                  </div>
                  <span className="text-zinc-500">{formatRelativeTime(row.startedAt)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
