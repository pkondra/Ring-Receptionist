import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { PLAN_MINUTES, DEFAULT_PLAN } from "./constants";

const planValidator = v.union(
  v.literal("starter"),
  v.literal("pro"),
  v.literal("growth")
);

export const setStripeCustomerId = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, { workspaceId, stripeCustomerId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) throw new Error("User not found");

    const workspace = await ctx.db.get(workspaceId);
    if (!workspace || workspace.ownerId !== user._id) {
      throw new Error("Workspace not found");
    }

    await ctx.db.patch(workspaceId, { stripeCustomerId });
    return workspaceId;
  },
});

export const updateSubscription = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    plan: planValidator,
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    subscriptionStatus: v.string(),
    billingInterval: v.union(v.literal("month"), v.literal("year")),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) throw new Error("User not found");

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace || workspace.ownerId !== user._id) {
      throw new Error("Workspace not found");
    }

    await ctx.db.patch(args.workspaceId, {
      plan: args.plan,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      subscriptionStatus: args.subscriptionStatus,
      billingInterval: args.billingInterval,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      minutesIncluded: PLAN_MINUTES[args.plan],
    });

    await ctx.db.patch(user._id, { existingPlan: args.plan });

    return args.workspaceId;
  },
});

export const getBillingSummary = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) return null;

    const workspace = await ctx.db.get(workspaceId);
    if (!workspace || workspace.ownerId !== user._id) return null;

    const plan = workspace.plan as keyof typeof PLAN_MINUTES | undefined;
    const minutesIncluded = plan
      ? workspace.minutesIncluded ?? PLAN_MINUTES[plan]
      : 0;

    const periodEnd = workspace.currentPeriodEnd ?? Date.now();
    const periodStart =
      workspace.currentPeriodStart ?? periodEnd - 30 * 24 * 60 * 60 * 1000;

    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .take(500);

    let minutesUsed = 0;
    for (const session of sessions) {
      if (session.startedAt < periodStart) break;
      const endedAt = session.endedAt ?? Date.now();
      if (endedAt < periodStart || session.startedAt > periodEnd) continue;
      const durationMs = Math.max(0, endedAt - session.startedAt);
      const minutes = Math.ceil(durationMs / 60000);
      minutesUsed += minutes;
    }

    const minutesRemaining = Math.max(0, minutesIncluded - minutesUsed);

    return {
      plan: plan ?? null,
      minutesIncluded,
      minutesUsed,
      minutesRemaining,
      subscriptionStatus: workspace.subscriptionStatus ?? "inactive",
      billingInterval: workspace.billingInterval ?? "month",
      currentPeriodEnd: workspace.currentPeriodEnd,
    };
  },
});
