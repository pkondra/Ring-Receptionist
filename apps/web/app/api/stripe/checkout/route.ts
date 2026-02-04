import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const priceMap = {
  starter: {
    month: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    year: process.env.STRIPE_PRICE_STARTER_YEARLY,
  },
  pro: {
    month: process.env.STRIPE_PRICE_PRO_MONTHLY,
    year: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  growth: {
    month: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
    year: process.env.STRIPE_PRICE_GROWTH_YEARLY,
  },
} as const;

export async function POST(req: NextRequest) {
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY not configured" },
      { status: 500 }
    );
  }

  const { userId, getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (!userId || !token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body: { plan?: keyof typeof priceMap; interval?: "month" | "year" } =
    await req.json();
  const plan = body.plan ?? "starter";
  const interval = body.interval ?? "month";

  if (!(plan in priceMap)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = priceMap[plan]?.[interval];
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured for this plan" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
  });

  let workspace = await fetchQuery(
    api.workspaces.getMyWorkspace,
    {},
    { token }
  );

  if (!workspace) {
    await fetchMutation(
      api.users.ensureAccountSetup,
      { createDefaultAgent: false },
      { token }
    );
    workspace = await fetchQuery(api.workspaces.getMyWorkspace, {}, { token });
  }

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const agents = await fetchQuery(
    api.agentConfigs.listAgents,
    { workspaceId: workspace._id as Id<"workspaces"> },
    { token }
  );
  if (!agents || agents.length === 0) {
    return NextResponse.json(
      { error: "Complete onboarding before starting checkout." },
      { status: 409 }
    );
  }

  if (
    workspace.stripeSubscriptionId &&
    ["active", "trialing", "past_due", "incomplete"].includes(
      workspace.subscriptionStatus ?? ""
    )
  ) {
    return NextResponse.json(
      { error: "Subscription already active. Manage it from Billing." },
      { status: 409 }
    );
  }

  let stripeCustomerId = workspace.stripeCustomerId as string | undefined;
  if (!stripeCustomerId) {
    const user = await currentUser();
    const customer = await stripe.customers.create({
      email: user?.primaryEmailAddress?.emailAddress ?? undefined,
      name: user?.fullName ?? undefined,
      metadata: {
        workspaceId: workspace._id,
        userId,
      },
    });
    stripeCustomerId = customer.id;

    await fetchMutation(
      api.billing.setStripeCustomerId,
      {
        workspaceId: workspace._id as Id<"workspaces">,
        stripeCustomerId,
      },
      { token }
    );
  }

  const origin = req.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: false,
    payment_method_collection: "always",
    subscription_data: {
      trial_period_days: 7,
      metadata: {
        workspaceId: workspace._id,
        plan,
      },
    },
    metadata: {
      workspaceId: workspace._id,
      plan,
    },
    success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=1`,
    cancel_url: `${origin}/pricing?canceled=1`,
  });

  return NextResponse.json({ url: session.url });
}
