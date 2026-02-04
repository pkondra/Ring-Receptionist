import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const billingWebhookSecret = process.env.BILLING_WEBHOOK_SECRET;

const priceToPlan = new Map<string, "starter" | "pro" | "growth">();
const priceEntries: Array<[string | undefined, "starter" | "pro" | "growth"]> = [
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
    const priceId = subscription.items.data[0]?.price?.id;
    const plan = getPlanFromPrice(priceId);
    const workspaceId =
      subscription.metadata?.workspaceId ??
      subscription.items.data[0]?.metadata?.workspaceId;

    if (!plan || !workspaceId) return;

    await client.mutation(api.billingWebhook.updateSubscriptionFromWebhook, {
      secret: billingWebhookSecret,
      workspaceId: workspaceId as Id<"workspaces">,
      plan,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      subscriptionStatus: subscription.status,
      billingInterval: subscription.items.data[0]?.price?.recurring?.interval ?? "month",
      currentPeriodStart: subscription.current_period_start * 1000,
      currentPeriodEnd: subscription.current_period_end * 1000,
      stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : undefined,
    });
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
