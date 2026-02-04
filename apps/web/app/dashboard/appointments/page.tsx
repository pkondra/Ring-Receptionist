"use client";

import { useMemo } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

function formatDate(timestamp?: number) {
  if (!timestamp) return "Needs scheduling";
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AppointmentsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const workspace = useQuery(
    api.workspaces.getMyWorkspace,
    isAuthenticated ? {} : "skip"
  );
  const appointments = useQuery(
    api.appointments.listAppointmentsForWorkspace,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  const rows = useMemo(() => {
    if (!appointments) return [];
    return appointments.map((appointment) => ({
      id: appointment._id,
      agentName: appointment.agentName,
      businessName: appointment.businessName,
      status: appointment.status,
      scheduledAt: appointment.scheduledAt,
      scheduledForText: appointment.scheduledForText,
      contactName: appointment.contactName,
      phone: appointment.phone,
      address: appointment.address,
      reason: appointment.reason,
      notes: appointment.notes,
      summary: appointment.summary,
      createdAt: appointment.createdAt,
    }));
  }, [appointments]);

  if (isLoading || appointments === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-500">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-zinc-900 font-display">
          Appointments
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Schedule and track upcoming appointments.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="surface-card border-2 border-dashed border-[var(--border)] p-10 text-center">
          <p className="text-zinc-600 font-medium mb-1">No appointments yet</p>
          <p className="text-sm text-zinc-500">
            Appointments will appear after calls end.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="surface-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-zinc-500">Agent</div>
                  <div className="text-lg font-semibold text-zinc-900 font-display">
                    {row.agentName}
                  </div>
                  {row.businessName && (
                    <div className="text-xs text-zinc-400">
                      {row.businessName}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      row.status === "scheduled"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        row.status === "scheduled"
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    />
                    {row.status === "scheduled"
                      ? "Scheduled"
                      : "Needs Follow-up"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatDate(row.scheduledAt)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-zinc-600">
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-400">
                    Contact
                  </div>
                  <div>{row.contactName ?? "—"}</div>
                  <div className="text-xs text-zinc-400">
                    {row.phone ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-400">
                    Address
                  </div>
                  <div>{row.address ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-400">
                    Reason
                  </div>
                  <div>{row.reason ?? "—"}</div>
                </div>
              </div>

              {row.scheduledForText && !row.scheduledAt && (
                <div className="text-xs text-zinc-500">
                  Preferred window: {row.scheduledForText}
                </div>
              )}

              {row.summary && (
                <div className="surface-muted p-3 text-sm text-zinc-600 whitespace-pre-line">
                  {row.summary}
                </div>
              )}

              {row.notes && (
                <div className="text-xs text-zinc-500">{row.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
