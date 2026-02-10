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

type ElevenLabsPhoneNumber = {
  id: string;
  phoneNumber: string | null;
  assignedAgentId: string | null;
};

function normalizeElevenLabsPhone(row: unknown): ElevenLabsPhoneNumber | null {
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  const nestedAssignedAgent =
    record.assigned_agent && typeof record.assigned_agent === "object"
      ? (record.assigned_agent as Record<string, unknown>)
      : null;
  const nestedAgent =
    record.agent && typeof record.agent === "object"
      ? (record.agent as Record<string, unknown>)
      : null;

  const idCandidates = [
    record.phone_number_id,
    record.phoneNumberId,
    record.id,
  ];
  const phoneCandidates = [
    record.phone_number,
    record.phoneNumber,
    record.number,
  ];
  const assignedAgentCandidates = [
    record.agent_id,
    record.agentId,
    nestedAssignedAgent?.agent_id,
    nestedAssignedAgent?.id,
    nestedAgent?.agent_id,
    nestedAgent?.id,
  ];

  const id = idCandidates.find(
    (value): value is string => typeof value === "string" && value.length > 0
  );
  if (!id) return null;

  const phoneNumber =
    phoneCandidates.find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0
    ) ?? null;

  const assignedAgentId =
    assignedAgentCandidates.find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0
    ) ?? null;

  return { id, phoneNumber, assignedAgentId };
}

async function listElevenLabsPhoneNumbers(apiKey: string) {
  const response = await fetch("https://api.elevenlabs.io/v1/convai/phone-numbers", {
    headers: {
      "xi-api-key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to list ElevenLabs phone numbers: ${errorText || response.status}`
    );
  }

  const payload = (await response.json()) as {
    phone_numbers?: unknown[];
    phoneNumbers?: unknown[];
    numbers?: unknown[];
  };

  const rows = payload.phone_numbers ?? payload.phoneNumbers ?? payload.numbers ?? [];
  return rows
    .map(normalizeElevenLabsPhone)
    .filter((value): value is ElevenLabsPhoneNumber => Boolean(value));
}

async function patchElevenLabsPhoneAssignment(
  apiKey: string,
  phoneNumberId: string,
  payload: Record<string, unknown>
) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/phone-numbers/${phoneNumberId}`,
    {
      method: "PATCH",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );

  if (response.ok) return;
  const errorText = await response.text();
  throw new Error(
    `Failed to update ElevenLabs phone number ${phoneNumberId}: ${errorText || response.status}`
  );
}

async function assignElevenLabsPhoneNumberToAgent(
  apiKey: string,
  phoneNumberId: string,
  elevenlabsAgentId: string
) {
  try {
    await patchElevenLabsPhoneAssignment(apiKey, phoneNumberId, {
      agent_id: elevenlabsAgentId,
    });
    return;
  } catch {
    await patchElevenLabsPhoneAssignment(apiKey, phoneNumberId, {
      agentId: elevenlabsAgentId,
    });
  }
}

async function unassignElevenLabsPhoneNumber(apiKey: string, phoneNumberId: string) {
  try {
    await patchElevenLabsPhoneAssignment(apiKey, phoneNumberId, {
      agent_id: null,
    });
    return;
  } catch {
    await patchElevenLabsPhoneAssignment(apiKey, phoneNumberId, {
      agentId: null,
    });
  }
}

const ASSIGN_PHONE_STATUSES = new Set(["active", "trialing"]);
const RELEASE_PHONE_STATUSES = new Set([
  "canceled",
  "incomplete_expired",
  "unpaid",
  "paused",
]);

async function syncWorkspacePhoneForSubscription(
  client: ConvexHttpClient,
  workspaceId: Id<"workspaces">,
  subscriptionStatus: string
) {
  if (!ASSIGN_PHONE_STATUSES.has(subscriptionStatus) && !RELEASE_PHONE_STATUSES.has(subscriptionStatus)) {
    return;
  }

  if (!elevenlabsApiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  const context = await client.mutation(
    api.billingWebhook.getPhoneAssignmentContextFromWebhook,
    {
      secret: billingWebhookSecret as string,
      workspaceId,
    }
  );

  if (ASSIGN_PHONE_STATUSES.has(subscriptionStatus)) {
    if (
      context.targetAssignedPhoneNumber &&
      context.targetElevenlabsPhoneNumberId
    ) {
      return;
    }

    if (!context.targetAgentConfigId || !context.targetElevenlabsAgentId) {
      return;
    }

    const alreadyTrackedIds = new Set(context.assignedPhoneNumberIds ?? []);
    const numbers = await listElevenLabsPhoneNumbers(elevenlabsApiKey);
    const available = numbers.find(
      (number) =>
        !number.assignedAgentId &&
        !alreadyTrackedIds.has(number.id) &&
        Boolean(number.phoneNumber)
    );

    if (!available || !available.phoneNumber) {
      throw new Error("No unassigned ElevenLabs phone numbers available");
    }

    await assignElevenLabsPhoneNumberToAgent(
      elevenlabsApiKey,
      available.id,
      context.targetElevenlabsAgentId
    );

    await client.mutation(api.billingWebhook.setWorkspacePhoneAssignmentFromWebhook, {
      secret: billingWebhookSecret as string,
      workspaceId,
      agentConfigId: context.targetAgentConfigId,
      assignedPhoneNumber: available.phoneNumber,
      elevenlabsPhoneNumberId: available.id,
    });
    return;
  }

  const assignedIds = Array.from(new Set(context.assignedPhoneNumberIds ?? []));
  for (const phoneNumberId of assignedIds) {
    await unassignElevenLabsPhoneNumber(elevenlabsApiKey, phoneNumberId);
  }

  await client.mutation(api.billingWebhook.clearWorkspacePhoneAssignmentsFromWebhook, {
    secret: billingWebhookSecret as string,
    workspaceId,
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
