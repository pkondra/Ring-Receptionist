"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";

export default function MarketingNav() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black text-white text-sm font-semibold">
            V
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-zinc-900">Vozexo</div>
            <div className="text-xs text-zinc-500">Tree Service AI</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 md:flex">
          <Link href="/pricing" className="hover:text-zinc-900">
            Pricing
          </Link>
          <Link href="/dashboard" className="hover:text-zinc-900">
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-full px-4 py-2 text-sm font-medium btn-outline">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-full px-4 py-2 text-sm font-medium btn-primary">
                Start Free Trial
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="rounded-full px-4 py-2 text-sm font-medium btn-primary"
            >
              Go to Dashboard
            </Link>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
