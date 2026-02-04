"use client";

import { UserButton } from "@clerk/nextjs";
import DashboardNav from "@/components/DashboardNav";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col md:flex-row">
      <aside className="w-full md:w-64 p-4 md:p-6 flex flex-col gap-4 bg-[var(--surface)] md:border-r border-[var(--border)]">
        <div className="surface-card px-4 py-4 mb-5">
          <Link href="/dashboard" className="block">
            <h2 className="text-xl font-semibold text-zinc-900 font-display">
              Vozexo
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              AI receptionist studio
            </p>
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
