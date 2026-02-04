"use client";

import { useMemo } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import Link from "next/link";
import { motion } from "framer-motion";

function formatDate(timestamp?: number) {
  if (!timestamp) return "Needs scheduling";
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelativeDate(timestamp?: number) {
  if (!timestamp) return "Pending";
  const now = Date.now();
  const diff = timestamp - now;
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (diff < 0) return "Past";
  if (hours < 1) return "Soon";
  if (hours < 24) return `In ${hours}h`;
  if (days < 7) return `In ${days}d`;
  return formatDate(timestamp);
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

  const scheduledCount = rows.filter(r => r.status === "scheduled").length;
  const pendingCount = rows.filter(r => r.status !== "scheduled").length;

  if (isLoading || appointments === undefined) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-indigo-600 mb-1">Scheduling</p>
          <h1 className="text-3xl font-bold text-zinc-900 font-display">
            Appointments
          </h1>
          <p className="text-zinc-500 mt-1">
            Track and manage appointments booked by your AI receptionist.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-sm font-medium text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {pendingCount} Pending
            </span>
          )}
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-sm font-medium text-indigo-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {scheduledCount} Scheduled
          </span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No appointments yet</h3>
          <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
            Appointments will appear here after your AI receptionist books them during calls.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid gap-5">
          {rows.map((row, index) => (
            <motion.div
              key={row.id}
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
                      row.status === "scheduled"
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {(row.contactName ?? row.agentName).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 text-lg">
                        {row.contactName ?? "Unknown Contact"}
                      </h3>
                      <p className="text-sm text-zinc-500">via {row.agentName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      row.status === "scheduled"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${
                        row.status === "scheduled" ? "bg-emerald-500" : "bg-amber-500"
                      }`} />
                      {row.status === "scheduled" ? "Scheduled" : "Needs Follow-up"}
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-zinc-100 text-xs font-medium text-zinc-600">
                      {formatRelativeDate(row.scheduledAt)}
                    </span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-100">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1">Date & Time</p>
                    <p className="text-sm text-zinc-700">{formatDate(row.scheduledAt)}</p>
                    {row.scheduledForText && !row.scheduledAt && (
                      <p className="text-xs text-amber-600 mt-1">Preferred: {row.scheduledForText}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1">Phone</p>
                    <p className="text-sm text-zinc-700">{row.phone ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1">Address</p>
                    <p className="text-sm text-zinc-700 truncate">{row.address ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1">Reason</p>
                    <p className="text-sm text-zinc-700 truncate">{row.reason ?? "—"}</p>
                  </div>
                </div>

                {/* Summary */}
                {row.summary && (
                  <div className="pt-4 border-t border-zinc-100">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-2">Summary</p>
                    <div className="p-4 rounded-xl bg-zinc-50 text-sm text-zinc-600 whitespace-pre-line">
                      {row.summary}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {row.notes && (
                  <div className="pt-4 border-t border-zinc-100">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-2">Notes</p>
                    <p className="text-sm text-zinc-600">{row.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
