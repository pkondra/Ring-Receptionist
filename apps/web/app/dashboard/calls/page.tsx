"use client";

import { useMemo, useState } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
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

function formatDuration(startedAt: number, endedAt?: number) {
  if (!endedAt) return "In progress";
  const totalSeconds = Math.max(0, Math.floor((endedAt - startedAt) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function CallsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const workspace = useQuery(
    api.workspaces.getMyWorkspace,
    isAuthenticated ? {} : "skip"
  );
  const sessions = useQuery(
    api.chatSessions.listSessionsForWorkspace,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  const rows = useMemo(() => {
    if (!sessions) return [];
    return sessions.map((session) => ({
      id: session._id,
      agentName: session.agentName,
      businessName: session.businessName,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      summary: session.summary,
    }));
  }, [sessions]);

  const activeCount = rows.filter(r => r.status !== "ended").length;
  const completedCount = rows.filter(r => r.status === "ended").length;
  const webhookStatus = workspace?.lastElevenlabsWebhookStatus;
  const webhookStatusStyles =
    webhookStatus === "success"
      ? {
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
          label: "Healthy",
        }
      : webhookStatus === "error"
        ? {
            badge: "bg-rose-50 text-rose-700 border-rose-200",
            dot: "bg-rose-500",
            label: "Error",
          }
        : webhookStatus === "received"
          ? {
              badge: "bg-amber-50 text-amber-700 border-amber-200",
              dot: "bg-amber-500",
              label: "Received",
            }
          : {
              badge: "bg-zinc-100 text-zinc-700 border-zinc-200",
              dot: "bg-zinc-400",
              label: "Not configured",
            };

  if (isLoading || sessions === undefined) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500">Loading calls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-cyan-600 mb-1">Call History</p>
          <h1 className="text-3xl font-bold text-zinc-900 font-display">
            Voice Sessions
          </h1>
          <p className="text-zinc-500 mt-1">
            View and review all voice conversations with your AI receptionist.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-sm font-medium text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {activeCount} Active
            </span>
          )}
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-50 border border-cyan-200 text-sm font-medium text-cyan-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {completedCount} Completed
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Webhook Health</p>
            <p className="text-sm text-zinc-500 mt-1">
              Status of ElevenLabs post-call delivery into calls, leads, and appointments.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${webhookStatusStyles.badge}`}
          >
            <span className={`h-2 w-2 rounded-full ${webhookStatusStyles.dot}`} />
            {webhookStatusStyles.label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">
              Last Webhook
            </p>
            <p className="text-sm text-zinc-900 mt-1">
              {workspace?.lastElevenlabsWebhookAt
                ? formatRelativeTime(workspace.lastElevenlabsWebhookAt)
                : "No webhook received yet"}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">
              Event
            </p>
            <p className="text-sm text-zinc-900 mt-1">
              {workspace?.lastElevenlabsWebhookEventType ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">
              Conversation ID
            </p>
            <p className="text-sm text-zinc-900 mt-1 break-all">
              {workspace?.lastElevenlabsWebhookConversationId ?? "—"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 mt-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">
            Last Message
          </p>
          <p className="text-sm text-zinc-900 mt-1">
            {workspace?.lastElevenlabsWebhookMessage ??
              "Set ElevenLabs Post-Call Webhook to /api/elevenlabs/webhook and place the same ELEVENLABS_WEBHOOK_SECRET in Vercel + Convex."}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No calls yet</h3>
          <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
            Start a voice chat with your AI receptionist to see call history here.
          </p>
          <Link
            href="/dashboard/agents"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-all"
          >
            View Your Agents
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, index) => (
            <CallRow
              key={row.id}
              row={row}
              index={index}
              isExpanded={Boolean(expanded[row.id])}
              onToggle={() =>
                setExpanded((prev) => ({
                  ...prev,
                  [row.id]: !prev[row.id],
                }))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CallRow({
  row,
  index,
  isExpanded,
  onToggle,
}: {
  row: {
    id: Id<"chatSessions">;
    agentName: string;
    businessName: string;
    status: string;
    startedAt: number;
    endedAt?: number;
    summary?: string;
  };
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const messages = useQuery(
    api.chatMessages.listMessagesForSession,
    isExpanded ? { sessionId: row.id } : "skip"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:border-zinc-300 hover:shadow-md transition-all"
    >
      <div className="p-6 space-y-5">
        {/* Header Row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold ${
              row.status === "ended"
                ? 'bg-cyan-100 text-cyan-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {row.agentName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 text-lg">{row.agentName}</h3>
              {row.businessName && (
                <p className="text-sm text-zinc-500">{row.businessName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              row.status === "ended"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                row.status === "ended" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
              }`} />
              {row.status === "ended" ? "Completed" : "Active"}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-zinc-100 text-xs font-medium text-zinc-600">
              {formatDuration(row.startedAt, row.endedAt)}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-100">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1">Started</p>
            <p className="text-sm text-zinc-700">{formatRelativeTime(row.startedAt)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1">Ended</p>
            <p className="text-sm text-zinc-700">{row.endedAt ? formatRelativeTime(row.endedAt) : "In progress"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1">Summary</p>
            <p className="text-sm text-zinc-600 line-clamp-2">{row.summary ?? "No summary yet"}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
          <button
            onClick={onToggle}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {isExpanded ? "Hide Transcript" : "View Transcript"}
          </button>
          <span className="text-xs text-zinc-400">
            {row.summary ? "AI-generated summary" : "Summary pending"}
          </span>
        </div>
      </div>

      {/* Transcript Panel */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-zinc-200 bg-zinc-50 p-6"
        >
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {messages === undefined ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">No transcript available.</p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={`${row.id}-${idx}`}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-zinc-200 text-zinc-800"
                      : "bg-white border border-zinc-200 text-zinc-800"
                  }`}>
                    <div className="text-xs font-medium text-zinc-500 mb-1">
                      {msg.role === "user" ? "Caller" : "Agent"}
                    </div>
                    <div className="text-sm">{msg.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
