"use client";

import { useEffect, useRef, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@convex/_generated/api";
import DashboardNav from "@/components/DashboardNav";
import Link from "next/link";
import Image from "next/image";

const CHECKOUT_GRACE_SESSION_KEY = "checkout_success_at";
const CHECKOUT_GRACE_WINDOW_MS = 10 * 60 * 1000;
const ACTIVE_OR_PENDING_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "incomplete",
]);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [setupComplete, setSetupComplete] = useState(false);
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const billingRecoveryAttemptedRef = useRef(false);

  const ensureAccountSetup = useMutation(api.users.ensureAccountSetup);
  const workspace = useQuery(
    api.workspaces.getMyWorkspace,
    isAuthenticated ? {} : "skip"
  );
  const billingSummary = useQuery(
    api.billing.getBillingSummary,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  useEffect(() => {
    if (isAuthenticated && !setupComplete) {
      ensureAccountSetup({ createDefaultAgent: false })
        .then(() => setSetupComplete(true))
        .catch(console.error);
    }
  }, [isAuthenticated, setupComplete, ensureAccountSetup]);

  useEffect(() => {
    if (!isAuthenticated || !setupComplete || welcomeChecked) return;
    setWelcomeChecked(true);
    fetch("/api/notifications/welcome", { method: "POST" }).catch(() => {
      // Do not block dashboard access if email service is unavailable.
    });
  }, [isAuthenticated, setupComplete, welcomeChecked]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasCheckoutSuccess =
      searchParams.get("success") === "1" && Boolean(searchParams.get("session_id"));
    if (hasCheckoutSuccess) {
      window.sessionStorage.setItem(
        CHECKOUT_GRACE_SESSION_KEY,
        `${Date.now()}`
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/pricing");
      return;
    }

    if (workspace == null || billingSummary === undefined) return;

    const hasCheckoutSuccessParam =
      searchParams.get("success") === "1" && Boolean(searchParams.get("session_id"));

    let hasRecentCheckout = hasCheckoutSuccessParam;
    if (!hasRecentCheckout && typeof window !== "undefined") {
      const lastCheckoutAtRaw = window.sessionStorage.getItem(
        CHECKOUT_GRACE_SESSION_KEY
      );
      const lastCheckoutAt = Number(lastCheckoutAtRaw ?? 0);
      if (
        Number.isFinite(lastCheckoutAt) &&
        lastCheckoutAt > 0 &&
        Date.now() - lastCheckoutAt < CHECKOUT_GRACE_WINDOW_MS
      ) {
        hasRecentCheckout = true;
      }
    }

    const normalizedStatus = (workspace.subscriptionStatus ?? "")
      .toString()
      .toLowerCase();
    const hasActiveOrPendingSubscription =
      ACTIVE_OR_PENDING_SUBSCRIPTION_STATUSES.has(normalizedStatus) ||
      Boolean(workspace.stripeSubscriptionId);

    if (
      !billingSummary?.plan &&
      !hasRecentCheckout &&
      !hasActiveOrPendingSubscription
    ) {
      const hasBillingRelationship = Boolean(
        workspace.stripeCustomerId || workspace.stripeSubscriptionId
      );

      if (hasBillingRelationship && !billingRecoveryAttemptedRef.current) {
        billingRecoveryAttemptedRef.current = true;
        void fetch("/api/stripe/sync-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        })
          .then(async (res) => {
            if (!res.ok) {
              const payload = await res.json().catch(() => ({}));
              throw new Error(
                payload.error || "Billing recovery sync failed"
              );
            }
            router.refresh();
          })
          .catch((error) => {
            console.error("Dashboard billing recovery sync failed:", error);
            router.replace("/pricing");
          });
        return;
      }

      router.replace("/pricing");
    }
  }, [isAuthenticated, isLoading, workspace, billingSummary, router, searchParams]);

  if (
    isLoading ||
    (isAuthenticated && (workspace == null || billingSummary === undefined))
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <aside className="w-full md:w-64 p-4 md:p-6 flex flex-col gap-4 bg-[var(--surface)] md:border-r border-[var(--border)]">
        <div className="surface-card px-4 py-4 mb-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/favicon.png"
              alt="Ring Receptionist"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 font-display">
                Ring Receptionist
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                AI receptionist studio
              </p>
            </div>
          </Link>
        </div>
        <div className="surface-card p-3 flex-1">
          <DashboardNav />
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="mx-4 md:mx-6 mt-2 md:mt-5 mb-4 surface-card px-5 py-3 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              Workspace
            </span>
            <div className="text-sm font-semibold text-zinc-900">
              Dashboard
            </div>
          </div>
          <UserButton />
        </header>

        <main className="flex-1 overflow-auto px-4 md:px-6 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
