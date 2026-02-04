"use client";

import { useMemo } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-500">Loading leads...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-zinc-900 font-display">
          Leads
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Qualified calls with extracted details.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="surface-card border-2 border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-zinc-600 font-medium mb-1">No leads yet</p>
          <p className="text-sm text-zinc-500">
            Start a voice chat to capture lead details.
          </p>
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="hidden md:grid grid-cols-6 gap-4 px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide bg-[var(--surface-muted)] border-b border-[var(--border)]">
            <span>Caller</span>
            <span>Phone</span>
            <span>Address</span>
            <span>Reason</span>
            <span>Agent</span>
            <span>Date</span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4 px-5 py-4 text-sm text-zinc-700"
              >
                <div className="font-medium text-zinc-900">
                  <div className="md:hidden text-xs uppercase tracking-wide text-zinc-400 mb-1">
                    Caller
                  </div>
                  {row.fields.callerName ?? "—"}
                </div>
                <div>
                  <div className="md:hidden text-xs uppercase tracking-wide text-zinc-400 mb-1">
                    Phone
                  </div>
                  {row.fields.phone ?? "—"}
                </div>
                <div className="truncate">
                  <div className="md:hidden text-xs uppercase tracking-wide text-zinc-400 mb-1">
                    Address
                  </div>
                  {row.fields.address ?? "—"}
                </div>
                <div className="truncate">
                  <div className="md:hidden text-xs uppercase tracking-wide text-zinc-400 mb-1">
                    Reason
                  </div>
                  {row.fields.reason ?? "—"}
                </div>
                <div>
                  <div className="md:hidden text-xs uppercase tracking-wide text-zinc-400 mb-1">
                    Agent
                  </div>
                  <div className="text-zinc-900 font-medium">
                    {row.agentName}
                  </div>
                  {row.businessName && (
                    <div className="text-xs text-zinc-400">
                      {row.businessName}
                    </div>
                  )}
                </div>
                <div className="text-zinc-500">
                  <div className="md:hidden text-xs uppercase tracking-wide text-zinc-400 mb-1">
                    Date
                  </div>
                  {formatDate(row.startedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
