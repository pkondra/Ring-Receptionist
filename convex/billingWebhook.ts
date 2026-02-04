import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { PLAN_MINUTES, DEFAULT_PLAN } from "./constants";

const planValidator = v.union(
  v.literal("starter"),
  v.literal("pro"),
  v.literal("growth")
);

export const updateSubscriptionFromWebhook = mutation({
  args: {
    secret: v.string(),
    workspaceId: v.id("workspaces"),
    plan: planValidator,
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    subscriptionStatus: v.string(),
    billingInterval: v.union(v.literal("month"), v.literal("year")),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    stripeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const webhookSecret = process.env.BILLING_WEBHOOK_SECRET;
    if (!webhookSecret || args.secret !== webhookSecret) {
      throw new Error("Unauthorized webhook");
    }

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const plan = args.plan ?? DEFAULT_PLAN;

    await ctx.db.patch(args.workspaceId, {
      plan,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      subscriptionStatus: args.subscriptionStatus,
      billingInterval: args.billingInterval,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      minutesIncluded: PLAN_MINUTES[plan],
      ...(args.stripeCustomerId
        ? { stripeCustomerId: args.stripeCustomerId }
        : {}),
    });

    await ctx.db.patch(workspace.ownerId, { existingPlan: plan });

    return args.workspaceId;
  },
});
