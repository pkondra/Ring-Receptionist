"use client";

import { useMemo, useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

type Plan = {
  id: "starter" | "pro" | "growth";
  name: string;
  priceMonthly: number;
  priceYearly: number;
  minutes: number;
  overage: number;
  highlight: boolean;
  description: string;
  features: string[];
  badge?: string;
};

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 49,
    priceYearly: 441,
    minutes: 150,
    overage: 0.45,
    highlight: false,
    description: "Perfect for solo service operators getting started.",
    features: [
      "AI Receptionist (1 agent)",
      "1 phone number",
      "Message taking with custom business questions",
      "Smart spam detection",
      "Email + SMS notifications",
      "Up to 10 calls simultaneously",
      "Basic call analytics dashboard",
      "English support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Most Popular",
    priceMonthly: 99,
    priceYearly: 891,
    minutes: 300,
    overage: 0.4,
    highlight: true,
    description: "For growing service businesses handling higher call volume.",
    features: [
      "Up to 20 simultaneous calls",
      "Call forwarding to staff",
      "Appointment booking links",
      "Advanced call analytics",
      "Multi-language support (English, French, Spanish)",
      "Priority support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 299,
    priceYearly: 2691,
    minutes: 1500,
    overage: 0.35,
    highlight: false,
    description: "For larger teams and multi-crew operations.",
    features: [
      "Lower overage rate",
      "Priority support with dedicated onboarding",
      "Custom integrations (calendar / CRM later phase)",
      "Higher concurrency limits",
      "Early access to new features",
    ],
  },
];

export default function PricingPage() {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { isAuthenticated } = useConvexAuth();

  const workspace = useQuery(
    api.workspaces.getMyWorkspace,
    isAuthenticated ? {} : "skip"
  );
  const agents = useQuery(
    api.agentConfigs.listAgents,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const hasAgent = agents ? agents.length > 0 : false;

  const pricing = useMemo(() => {
    return plans.map((plan) => {
      const price = interval === "month" ? plan.priceMonthly : plan.priceYearly;
      return {
        ...plan,
        displayPrice: price,
        intervalLabel: interval === "month" ? "month" : "year",
      };
    });
  }, [interval]);

  const startCheckout = async (planId: string) => {
    try {
      if (!hasAgent) {
        alert("Complete onboarding before starting your trial.");
        return;
      }
      setLoadingPlan(planId);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, interval }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start checkout");
      }

      const data: { url?: string } = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-zinc-900">
      <MarketingNav />
      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                Pricing
              </p>
              <h1 className="mt-2 text-4xl md:text-5xl font-semibold font-display">
                Simple plans for service businesses
              </h1>
              <p className="mt-3 text-base text-zinc-600 max-w-2xl">
                All plans are minute-based with one business per account and one phone
                number included. Additional minutes are billed automatically.
              </p>
            </div>
            <div className="surface-card px-2 py-2 flex items-center gap-2">
              <button
                onClick={() => setInterval("month")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  interval === "month" ? "btn-primary" : "btn-outline"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setInterval("year")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  interval === "year" ? "btn-primary" : "btn-outline"
                }`}
              >
                Yearly (25% off)
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.id}
                className={`surface-card p-6 flex flex-col gap-5 ${
                  plan.highlight ? "ring-2 ring-black/80" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">{plan.name}</h2>
                      {plan.badge && (
                        <span className="rounded-full bg-black text-white text-xs font-semibold px-2 py-0.5">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">
                      {plan.description}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="text-4xl font-semibold">
                    ${plan.displayPrice}
                    <span className="text-base font-medium text-zinc-500">
                      /{plan.intervalLabel}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-2">
                    {plan.minutes} minutes included
                  </p>
                </div>

                <ul className="text-sm text-zinc-600 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-900" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-sm text-zinc-500">
                  Overage: ${plan.overage.toFixed(2)} / extra minute
                </div>

                <SignedIn>
                  {hasAgent ? (
                    <button
                      onClick={() => startCheckout(plan.id)}
                      disabled={loadingPlan === plan.id}
                      className="rounded-full px-5 py-2.5 text-sm font-medium btn-primary disabled:opacity-60"
                    >
                      {loadingPlan === plan.id
                        ? "Starting checkout..."
                        : "Start Free 7-Day Trial"}
                    </button>
                  ) : (
                    <Link
                      href="/get-started"
                      className="rounded-full px-5 py-2.5 text-sm font-medium btn-primary text-center"
                    >
                      Complete onboarding
                    </Link>
                  )}
                </SignedIn>
                <SignedOut>
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/get-started"
                      className="rounded-full px-5 py-2.5 text-sm font-medium btn-primary text-center"
                    >
                      Get Started
                    </Link>
                    <SignInButton mode="modal">
                      <button className="rounded-full px-5 py-2.5 text-sm font-medium btn-outline">
                        Sign In
                      </button>
                    </SignInButton>
                  </div>
                </SignedOut>
              </div>
            ))}
          </div>

          <div className="mt-10 surface-card p-6 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold">Annual discount</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Pay yearly and save 25% across all plans.
              </p>
            </div>
            <div className="text-sm text-zinc-600 grid gap-1">
              <div>Starter: $441 / year (save $147)</div>
              <div>Pro: $891 / year (save $297)</div>
              <div>Growth: $2691 / year (save $897)</div>
            </div>
          </div>

          <div className="mt-8 text-sm text-zinc-500">
            Usage tracked per account. Remaining minutes are shown inside the dashboard.
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Card required to start trial. $0 due today. Subscription begins after 7 days.
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]"
            >
              &larr; Back to home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
