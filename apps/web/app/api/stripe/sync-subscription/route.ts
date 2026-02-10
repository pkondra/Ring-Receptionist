import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import Stripe from "stripe";
import { syncWorkspacePhoneAssignment } from "@/lib/elevenlabsPhonePool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const billingWebhookSecret = process.env.BILLING_WEBHOOK_SECRET;
const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;

const planByPriceEnv = new Map<string, "starter" | "pro" | "growth">();
const priceEntries: Array<[string | undefined, "starter" | "pro" | "growth"]> = [
  [process.env.STRIPE_PRICE_STARTER_MONTHLY, "starter"],
  [process.env.STRIPE_PRICE_STARTER_YEARLY, "starter"],
  [process.env.STRIPE_PRICE_PRO_MONTHLY, "pro"],
  [process.env.STRIPE_PRICE_PRO_YEARLY, "pro"],
  [process.env.STRIPE_PRICE_GROWTH_MONTHLY, "growth"],
  [process.env.STRIPE_PRICE_GROWTH_YEARLY, "growth"],
];
for (const [priceId, plan] of priceEntries) {
  if (priceId) planByPriceEnv.set(priceId, plan);
}

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

  const body: { sessionId?: string } = await req.json();
  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing sessionId" },
      { status: 400 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
  });

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (session.status !== "complete") {
    return NextResponse.json(
      { error: "Checkout session not complete" },
      { status: 400 }
    );
  }

  if (!session.subscription || typeof session.subscription === "string") {
    return NextResponse.json(
      { error: "Subscription not found on session" },
      { status: 400 }
    );
  }

  const subscription = session.subscription as Stripe.Subscription;
  const price = subscription.items.data[0]?.price?.id;
  const plan = price ? planByPriceEnv.get(price) : undefined;

  if (!plan) {
    return NextResponse.json(
      { error: "Unknown plan for subscription" },
      { status: 400 }
    );
  }

  const workspace = await fetchQuery(
    api.workspaces.getMyWorkspace,
    {},
    { token }
  );

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const sessionWorkspaceId =
    session.metadata?.workspaceId ??
    subscription.metadata?.workspaceId ??
    workspace._id;

  if (sessionWorkspaceId !== workspace._id) {
    return NextResponse.json(
      { error: "Session workspace mismatch" },
      { status: 403 }
    );
  }

  const recurringInterval =
    subscription.items.data[0]?.price?.recurring?.interval;
  const billingInterval = recurringInterval === "year" ? "year" : "month";

  await fetchMutation(
    api.billing.updateSubscription,
    {
      workspaceId: workspace._id as Id<"workspaces">,
      plan,
      stripeSubscriptionId: subscription.id,
      stripePriceId: price,
      subscriptionStatus: subscription.status ?? "active",
      billingInterval,
      currentPeriodStart: subscription.current_period_start * 1000,
      currentPeriodEnd: subscription.current_period_end * 1000,
    },
    { token }
  );

  let phoneAssignment:
    | {
        action: "assigned" | "released" | "noop";
      }
    | undefined;

  if (convexUrl && billingWebhookSecret && elevenlabsApiKey) {
    const client = new ConvexHttpClient(convexUrl);
    phoneAssignment = await syncWorkspacePhoneAssignment({
      client,
      workspaceId: workspace._id as Id<"workspaces">,
      subscriptionStatus: subscription.status ?? "active",
      elevenlabsApiKey,
      billingWebhookSecret,
    });
  }

  return NextResponse.json({ success: true, phoneAssignment });
}
