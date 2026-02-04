"use client";

import { useEffect, useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSearchParams } from "next/navigation";

function formatDate(timestamp?: number) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BillingPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const searchParams = useSearchParams();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const workspace = useQuery(
    api.workspaces.getMyWorkspace,
    isAuthenticated ? {} : "skip"
  );
  const summary = useQuery(
    api.billing.getBillingSummary,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const success = searchParams.get("success");
    if (!sessionId || !success) return;
    if (syncing) return;

    setSyncing(true);
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
        setSyncMessage("Subscription activated. Minutes updated.");
      })
      .catch((err) => {
        setSyncMessage(
          err instanceof Error ? err.message : "Failed to sync subscription"
        );
      })
      .finally(() => setSyncing(false));
  }, [searchParams, syncing]);

  const handleManageBilling = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    if (!res.ok) return;
    const data: { url?: string } = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (isLoading || summary === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-500">Loading billing...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-zinc-900 font-display">
          Billing
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage your subscription and minutes.
        </p>
      </div>

      {syncMessage && (
        <div className="surface-card p-4 text-sm text-zinc-600">
          {syncMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="surface-card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            Current Plan
          </h2>
          <div className="text-2xl font-semibold text-zinc-900">
            {summary?.plan ?? "Starter"}
          </div>
          <div className="text-sm text-zinc-500">
            Status: {summary?.subscriptionStatus ?? "inactive"}
          </div>
          <div className="text-sm text-zinc-500">
            Renews: {formatDate(summary?.currentPeriodEnd)}
          </div>
          <button
            onClick={handleManageBilling}
            className="rounded-full px-4 py-2 text-sm font-medium btn-primary"
          >
            Manage Subscription
          </button>
        </div>

        <div className="surface-card p-6 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            Minutes
          </h2>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-semibold text-zinc-900">
              {summary?.minutesRemaining ?? 0}
            </div>
            <div className="text-sm text-zinc-500 pb-1">
              remaining
            </div>
          </div>
          <div className="text-sm text-zinc-500">
            Used {summary?.minutesUsed ?? 0} of {summary?.minutesIncluded ?? 0}
          </div>
          <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
            <div
              className="h-full bg-black"
              style={{
                width: summary
                  ? `${Math.min(
                      100,
                      (summary.minutesUsed /
                        Math.max(1, summary.minutesIncluded)) *
                        100
                    )}%`
                  : "0%",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
