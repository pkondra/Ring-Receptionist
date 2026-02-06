"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@convex/_generated/api";
import DashboardNav from "@/components/DashboardNav";
import Link from "next/link";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [setupComplete, setSetupComplete] = useState(false);

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
    if (isLoading) return;
    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const hasCheckoutSuccess =
      params?.get("success") === "1" && params?.get("session_id");

    if (!isAuthenticated) {
      router.replace("/pricing");
      return;
    }

    if (billingSummary === undefined) return;

    if (!billingSummary?.plan && !hasCheckoutSuccess) {
      router.replace("/pricing");
    }
  }, [isAuthenticated, isLoading, billingSummary, router]);

  if (isLoading || (isAuthenticated && billingSummary === undefined)) {
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
