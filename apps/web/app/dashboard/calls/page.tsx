"use client";

import { useMemo, useState } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

  if (isLoading || sessions === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-500">Loading calls...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-zinc-900 font-display">
          Calls
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Voice session history across your agents.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="surface-card border-2 border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-zinc-600 font-medium mb-1">No calls yet</p>
          <p className="text-sm text-zinc-500">
            Start a voice chat to generate call history.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <CallRow
              key={row.id}
              row={row}
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
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const messages = useQuery(
    api.chatMessages.listMessagesForSession,
    isExpanded ? { sessionId: row.id } : "skip"
  );

  return (
    <div className="surface-card p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-zinc-500">Agent</div>
          <div className="text-lg font-semibold text-zinc-900 font-display">
            {row.agentName}
          </div>
          {row.businessName && (
            <div className="text-xs text-zinc-400">{row.businessName}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              row.status === "ended"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                row.status === "ended" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {row.status === "ended" ? "Completed" : "Active"}
          </span>
          <span className="text-xs text-zinc-500">
            {formatDuration(row.startedAt, row.endedAt)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-zinc-600">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-400">
            Started
          </div>
          <div>{formatDate(row.startedAt)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-400">
            Ended
          </div>
          <div>{row.endedAt ? formatDate(row.endedAt) : "In progress"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-400">
            Summary
          </div>
          <div className="text-zinc-500 whitespace-pre-line">
            {row.summary ?? "—"}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onToggle}
          className="rounded-full px-4 py-2 text-sm font-medium btn-outline transition-colors"
        >
          {isExpanded ? "Hide Transcript" : "View Transcript"}
        </button>
        {row.summary ? (
          <span className="text-xs text-zinc-400">
            GPT-4o-mini summary
          </span>
        ) : (
          <span className="text-xs text-zinc-400">Summary pending</span>
        )}
      </div>

      {isExpanded && (
        <div className="surface-muted p-4 space-y-3 max-h-80 overflow-y-auto">
          {messages === undefined ? (
            <p className="text-sm text-zinc-400">Loading transcript...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-zinc-400">No transcript found.</p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={`${row.id}-${index}`}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-white border border-[var(--border)]"
                      : "bg-white border border-[var(--border)]"
                  }`}
                >
                  <div className="text-xs font-medium text-zinc-500 mb-1">
                    {msg.role === "user" ? "Caller" : "Agent"}
                  </div>
                  <div className="text-sm text-zinc-800">{msg.content}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
