import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { syncWorkspacePhoneAssignment } from "@/lib/elevenlabsPhonePool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const billingWebhookSecret = process.env.BILLING_WEBHOOK_SECRET;
const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;

type Plan = "starter" | "pro" | "growth";

const priceToPlan = new Map<string, Plan>();
const priceEntries: Array<[string | undefined, Plan]> = [
  [process.env.STRIPE_PRICE_STARTER_MONTHLY, "starter"],
  [process.env.STRIPE_PRICE_STARTER_YEARLY, "starter"],
  [process.env.STRIPE_PRICE_PRO_MONTHLY, "pro"],
  [process.env.STRIPE_PRICE_PRO_YEARLY, "pro"],
  [process.env.STRIPE_PRICE_GROWTH_MONTHLY, "growth"],
  [process.env.STRIPE_PRICE_GROWTH_YEARLY, "growth"],
];
for (const [priceId, plan] of priceEntries) {
  if (priceId) priceToPlan.set(priceId, plan);
}

function getPlanFromPrice(priceId?: string) {
  if (!priceId) return null;
  return priceToPlan.get(priceId) ?? null;
}

function getPlanFromMetadata(value?: string | null): Plan | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "starter") return "starter";
  if (normalized === "pro") return "pro";
  if (normalized === "growth") return "growth";
  return null;
}

function getWorkspaceIdFromSubscription(subscription: Stripe.Subscription) {
  return (
    subscription.metadata?.workspaceId ??
    subscription.items.data[0]?.metadata?.workspaceId ??
    null
  );
}

function getPlanFromSubscription(subscription: Stripe.Subscription): Plan | null {
  const priceId = subscription.items.data[0]?.price?.id;
  return (
    getPlanFromPrice(priceId) ??
    getPlanFromMetadata(subscription.metadata?.plan) ??
    getPlanFromMetadata(subscription.items.data[0]?.metadata?.plan)
  );
}

async function syncWorkspacePhoneForSubscription(
  client: ConvexHttpClient,
  workspaceId: Id<"workspaces">,
  subscriptionStatus: string
) {
  if (!elevenlabsApiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  await syncWorkspacePhoneAssignment({
    client,
    workspaceId,
    subscriptionStatus,
    elevenlabsApiKey,
    billingWebhookSecret: billingWebhookSecret as string,
  });
}

export async function POST(req: NextRequest) {
  if (!stripeSecretKey || !stripeWebhookSecret || !convexUrl || !billingWebhookSecret) {
    return NextResponse.json(
      { error: "Missing Stripe/Convex webhook configuration" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
  });

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid signature" },
      { status: 400 }
    );
  }

  const client = new ConvexHttpClient(convexUrl);

  const handleSubscription = async (subscription: Stripe.Subscription) => {
    const workspaceId = getWorkspaceIdFromSubscription(subscription);
    if (!workspaceId) return;

    const plan = getPlanFromSubscription(subscription);
    const priceId = subscription.items.data[0]?.price?.id;

    const recurringInterval =
      subscription.items.data[0]?.price?.recurring?.interval;
    const billingInterval = recurringInterval === "year" ? "year" : "month";

    if (plan && priceId) {
      await client.mutation(api.billingWebhook.updateSubscriptionFromWebhook, {
        secret: billingWebhookSecret,
        workspaceId: workspaceId as Id<"workspaces">,
        plan,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        subscriptionStatus: subscription.status,
        billingInterval,
        currentPeriodStart: subscription.current_period_start * 1000,
        currentPeriodEnd: subscription.current_period_end * 1000,
        stripeCustomerId:
          typeof subscription.customer === "string"
            ? subscription.customer
            : undefined,
      });
    } else {
      console.warn(
        "Skipping plan sync for subscription due to missing plan/price mapping:",
        {
          subscriptionId: subscription.id,
          workspaceId,
          status: subscription.status,
          priceId,
          metadataPlan: subscription.metadata?.plan ?? null,
        }
      );
    }

    await syncWorkspacePhoneForSubscription(
      client,
      workspaceId as Id<"workspaces">,
      subscription.status
    );
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string | null;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await handleSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscription(subscription);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string | null;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await handleSubscription(subscription);
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handling error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
