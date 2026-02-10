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

function assertWebhookSecret(argsSecret: string) {
  const webhookSecret = process.env.BILLING_WEBHOOK_SECRET;
  if (!webhookSecret || argsSecret !== webhookSecret) {
    throw new Error("Unauthorized webhook");
  }
}

function stripPhoneAssignment<T extends { _id: unknown; _creationTime: unknown }>(
  doc: T & {
    assignedPhoneNumber?: string;
    elevenlabsPhoneNumberId?: string;
  }
) {
  const {
    _id: _ignoredId,
    _creationTime: _ignoredCreationTime,
    assignedPhoneNumber: _ignoredAssignedPhoneNumber,
    elevenlabsPhoneNumberId: _ignoredElevenlabsPhoneNumberId,
    ...rest
  } = doc;
  return rest;
}

export const getPhoneAssignmentContextFromWebhook = mutation({
  args: {
    secret: v.string(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    assertWebhookSecret(args.secret);

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const agents = await ctx.db
      .query("agentConfigs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const targetAgent =
      agents.find((agent) => agent.isDefault && Boolean(agent.elevenlabsAgentId)) ??
      agents.find((agent) => Boolean(agent.elevenlabsAgentId)) ??
      null;

    const assignedPhoneNumberIds = Array.from(
      new Set(
        agents
          .map((agent) => agent.elevenlabsPhoneNumberId)
          .filter((value): value is string => Boolean(value))
      )
    );

    return {
      targetAgentConfigId: targetAgent?._id ?? null,
      targetElevenlabsAgentId: targetAgent?.elevenlabsAgentId ?? null,
      targetAssignedPhoneNumber: targetAgent?.assignedPhoneNumber ?? null,
      targetElevenlabsPhoneNumberId: targetAgent?.elevenlabsPhoneNumberId ?? null,
      assignedPhoneNumberIds,
    };
  },
});

export const setWorkspacePhoneAssignmentFromWebhook = mutation({
  args: {
    secret: v.string(),
    workspaceId: v.id("workspaces"),
    agentConfigId: v.id("agentConfigs"),
    assignedPhoneNumber: v.string(),
    elevenlabsPhoneNumberId: v.string(),
  },
  handler: async (ctx, args) => {
    assertWebhookSecret(args.secret);

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const targetAgent = await ctx.db.get(args.agentConfigId);
    if (!targetAgent || targetAgent.workspaceId !== args.workspaceId) {
      throw new Error("Agent config not found");
    }

    const agents = await ctx.db
      .query("agentConfigs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    for (const agent of agents) {
      if (agent._id === args.agentConfigId) {
        await ctx.db.patch(agent._id, {
          assignedPhoneNumber: args.assignedPhoneNumber,
          elevenlabsPhoneNumberId: args.elevenlabsPhoneNumberId,
        });
        continue;
      }

      if (agent.assignedPhoneNumber || agent.elevenlabsPhoneNumberId) {
        await ctx.db.replace(agent._id, stripPhoneAssignment(agent));
      }
    }

    return true;
  },
});

export const clearWorkspacePhoneAssignmentsFromWebhook = mutation({
  args: {
    secret: v.string(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    assertWebhookSecret(args.secret);

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const agents = await ctx.db
      .query("agentConfigs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const phoneNumberIds = Array.from(
      new Set(
        agents
          .map((agent) => agent.elevenlabsPhoneNumberId)
          .filter((value): value is string => Boolean(value))
      )
    );

    for (const agent of agents) {
      if (agent.assignedPhoneNumber || agent.elevenlabsPhoneNumberId) {
        await ctx.db.replace(agent._id, stripPhoneAssignment(agent));
      }
    }

    return { phoneNumberIds };
  },
});
