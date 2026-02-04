import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-zinc-900">
      <MarketingNav />
      <main className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Tree Service AI
            </p>
            <h1 className="text-5xl md:text-6xl font-semibold text-zinc-900 font-display">
              Your calm, capable phone receptionist for every tree lead.
            </h1>
            <p className="text-base md:text-lg text-zinc-600 max-w-xl">
              Vozexo captures every lead detail, filters spam, and keeps your
              crew focused on the job — not the phone.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="rounded-full px-6 py-2.5 text-sm font-medium btn-primary">
                    Start Free 7-Day Trial
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="rounded-full px-6 py-2.5 text-sm font-medium btn-outline">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="rounded-full px-6 py-2.5 text-sm font-medium btn-primary text-center"
                >
                  Go to Dashboard
                </Link>
              </SignedIn>
              <Link
                href="/pricing"
                className="rounded-full px-6 py-2.5 text-sm font-medium btn-outline text-center"
              >
                View Pricing
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-zinc-600 max-w-md">
              <div className="surface-card p-4">
                <div className="text-xs uppercase tracking-wide text-zinc-400">
                  Minutes Based
                </div>
                <div className="text-lg font-semibold text-zinc-900">150+</div>
                <div>Included per month</div>
              </div>
              <div className="surface-card p-4">
                <div className="text-xs uppercase tracking-wide text-zinc-400">
                  Coverage
                </div>
                <div className="text-lg font-semibold text-zinc-900">24/7</div>
                <div>Never miss a lead</div>
              </div>
            </div>
          </div>

          <div className="surface-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                Starter Plan
              </span>
              <span className="rounded-full bg-black text-white text-xs font-semibold px-2 py-0.5">
                7-day trial
              </span>
            </div>
            <div className="text-4xl font-semibold text-zinc-900">
              $49<span className="text-base text-zinc-500">/month</span>
            </div>
            <ul className="text-sm text-zinc-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-900" />
                150 minutes included
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-900" />
                AI receptionist + smart spam detection
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-900" />
                Email + SMS notifications
              </li>
            </ul>
            <Link
              href="/pricing"
              className="inline-flex rounded-full px-5 py-2.5 text-sm font-medium btn-primary"
            >
              Compare all plans
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
