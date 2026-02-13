"use client";

import { useEffect, useRef, useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

const PENDING_CHECKOUT_SESSION_KEY = "pending_checkout_session_id";

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
  const [showMessage, setShowMessage] = useState(true);
  const syncedSessionRef = useRef<string | null>(null);

  const workspace = useQuery(
    api.workspaces.getMyWorkspace,
    isAuthenticated ? {} : "skip"
  );
  const summary = useQuery(
    api.billing.getBillingSummary,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  useEffect(() => {
    if (typeof window === "undefined" || syncing) return;
    const sessionIdFromUrl = searchParams.get("session_id");
    const success = searchParams.get("success");
    const hasCheckoutSuccess =
      success === "1" && Boolean(sessionIdFromUrl);

    if (hasCheckoutSuccess && sessionIdFromUrl) {
      window.sessionStorage.setItem(
        PENDING_CHECKOUT_SESSION_KEY,
        sessionIdFromUrl
      );
    }

    const sessionId =
      (hasCheckoutSuccess ? sessionIdFromUrl : null) ??
      window.sessionStorage.getItem(PENDING_CHECKOUT_SESSION_KEY);

    if (!sessionId) return;
    if (syncedSessionRef.current === sessionId) return;
    syncedSessionRef.current = sessionId;

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
        window.sessionStorage.removeItem(PENDING_CHECKOUT_SESSION_KEY);
      })
      .catch((err) => {
        setSyncMessage(
          err instanceof Error ? err.message : "Failed to sync subscription"
        );
        syncedSessionRef.current = null;
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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500">Loading billing...</p>
        </div>
      </div>
    );
  }

  const minutesUsed = summary?.minutesUsed ?? 0;
  const minutesIncluded = summary?.minutesIncluded ?? 0;
  const minutesRemaining = summary?.minutesRemaining ?? 0;
  const usagePercent = minutesIncluded > 0 ? Math.min(100, (minutesUsed / minutesIncluded) * 100) : 0;

  return (
    <div className="space-y-8 pb-8">
      {/* Success Message */}
      {syncMessage && showMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-emerald-900">{syncMessage}</p>
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-purple-600 mb-1">Billing & Usage</p>
          <h1 className="text-3xl font-bold text-zinc-900 font-display">
            Subscription
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage your plan and track minute usage.
          </p>
        </div>
        {summary?.plan && (
          <button
            onClick={handleManageBilling}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage Subscription
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Plan Card */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">Current Plan</h3>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {summary?.plan ? (
              <>
                <div>
                  <div className="text-3xl font-bold text-zinc-900 capitalize">
                    {summary.plan}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      summary.subscriptionStatus === 'active' || summary.subscriptionStatus === 'trialing'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        summary.subscriptionStatus === 'active' || summary.subscriptionStatus === 'trialing'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`} />
                      {summary.subscriptionStatus === 'trialing' ? 'Trial' : summary.subscriptionStatus}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Next billing date</span>
                    <span className="font-medium text-zinc-900">{formatDate(summary.currentPeriodEnd)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="font-medium text-amber-900 mb-1">No active plan</p>
                  <p className="text-sm text-amber-700">
                    Subscribe to start using your AI receptionist.
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

        {/* Minutes Usage Card */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">Minutes Usage</h3>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-zinc-900">{minutesRemaining}</span>
                <span className="text-zinc-500">minutes remaining</span>
              </div>
              <p className="text-sm text-zinc-500 mt-2">
                {minutesUsed} of {minutesIncluded} minutes used this period
              </p>
            </div>

            <div>
              <div className="h-3 rounded-full bg-zinc-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    usagePercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="text-zinc-500">{Math.round(usagePercent)}% used</span>
                {minutesRemaining < 30 && minutesRemaining > 0 && (
                  <span className="text-amber-600 font-medium">Running low</span>
                )}
              </div>
            </div>

            {summary?.plan && (
              <Link
                href="/pricing"
                className="block w-full text-center py-2.5 rounded-xl text-sm font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all"
              >
                Upgrade for More Minutes
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="p-6 border-b border-zinc-100">
          <h3 className="text-lg font-semibold text-zinc-900">Need Help?</h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/pricing"
            className="flex items-center gap-3 p-4 rounded-xl hover:bg-zinc-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-zinc-900">Compare Plans</p>
              <p className="text-sm text-zinc-500">View all pricing options</p>
            </div>
          </Link>
          <Link
            href="/contact"
            className="flex items-center gap-3 p-4 rounded-xl hover:bg-zinc-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-zinc-900">Get Support</p>
              <p className="text-sm text-zinc-500">Contact our team</p>
            </div>
          </Link>
          <a
            href="#"
            onClick={handleManageBilling}
            className="flex items-center gap-3 p-4 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-zinc-900">Billing History</p>
              <p className="text-sm text-zinc-500">View past invoices</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
