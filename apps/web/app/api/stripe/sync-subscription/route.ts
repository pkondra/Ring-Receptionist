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

function getWorkspaceIdFromSubscription(subscription: Stripe.Subscription) {
  return (
    subscription.metadata?.workspaceId ??
    subscription.items.data[0]?.metadata?.workspaceId ??
    null
  );
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

  const body = (await req.json().catch(() => ({}))) as { sessionId?: string };
  const requestedSessionId = body.sessionId?.trim();

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
  });

  const workspace = await fetchQuery(
    api.workspaces.getMyWorkspace,
    {},
    { token }
  );

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  let subscription: Stripe.Subscription | null = null;
  let syncSource: "session" | "workspaceSubscription" | "customerLookup" = "session";

  if (requestedSessionId) {
    const session = await stripe.checkout.sessions.retrieve(requestedSessionId, {
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

    const sessionWorkspaceId =
      session.metadata?.workspaceId ??
      getWorkspaceIdFromSubscription(session.subscription as Stripe.Subscription) ??
      workspace._id;

    if (sessionWorkspaceId !== workspace._id) {
      return NextResponse.json(
        { error: "Session workspace mismatch" },
        { status: 403 }
      );
    }

    subscription = session.subscription as Stripe.Subscription;
  } else if (workspace.stripeSubscriptionId) {
    subscription = await stripe.subscriptions.retrieve(
      workspace.stripeSubscriptionId
    );
    syncSource = "workspaceSubscription";
  } else if (workspace.stripeCustomerId) {
    const subscriptions = await stripe.subscriptions.list({
      customer: workspace.stripeCustomerId,
      status: "all",
      limit: 10,
    });

    subscription =
      subscriptions.data.find(
        (candidate) =>
          getWorkspaceIdFromSubscription(candidate) === workspace._id
      ) ?? subscriptions.data[0] ?? null;
    syncSource = "customerLookup";
  }

  if (!subscription) {
    return NextResponse.json(
      {
        error:
          "Unable to find a Stripe subscription to sync. Retry checkout success flow or provide a sessionId.",
      },
      { status: 404 }
    );
  }

  const linkedWorkspaceId = getWorkspaceIdFromSubscription(subscription);
  if (linkedWorkspaceId && linkedWorkspaceId !== workspace._id) {
    return NextResponse.json(
      { error: "Subscription workspace mismatch" },
      { status: 403 }
    );
  }

  const price = subscription.items.data[0]?.price?.id;
  const plan = price ? planByPriceEnv.get(price) : undefined;
  if (!plan) {
    return NextResponse.json(
      { error: "Unknown plan for subscription" },
      { status: 400 }
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
  let phoneAssignmentError: string | undefined;

  if (convexUrl && billingWebhookSecret && elevenlabsApiKey) {
    try {
      const client = new ConvexHttpClient(convexUrl);
      phoneAssignment = await syncWorkspacePhoneAssignment({
        client,
        workspaceId: workspace._id as Id<"workspaces">,
        subscriptionStatus: subscription.status ?? "active",
        elevenlabsApiKey,
        billingWebhookSecret,
      });
    } catch (error) {
      phoneAssignmentError =
        error instanceof Error ? error.message : "Failed to sync phone assignment";
      console.error("Phone assignment sync failed after subscription update:", error);
    }
  }

  return NextResponse.json({
    success: true,
    syncSource,
    phoneAssignment,
    phoneAssignmentError,
  });
}
