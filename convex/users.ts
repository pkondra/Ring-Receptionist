import { mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  DEFAULT_AGENT_NAME,
  DEFAULT_BUSINESS_NAME,
  DEFAULT_TONE_STYLE,
  DEFAULT_TONE_DESCRIPTION,
  DEFAULT_CUSTOM_CONTEXT,
  DEFAULT_VOICE_ID,
} from "./constants";

export const ensureAccountSetup = mutation({
  args: {
    createDefaultAgent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { createDefaultAgent } = args;
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // 1. Find or create user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    let userId;
    if (existingUser) {
      userId = existingUser._id;
      await ctx.db.patch(userId, {
        name: identity.name ?? existingUser.name,
        email: identity.email ?? existingUser.email,
        imageUrl: identity.pictureUrl ?? existingUser.imageUrl,
        ...(existingUser.existingPlan ? {} : {}),
      });
    } else {
      userId = await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        clerkUserId: identity.subject,
        email: identity.email,
        name: identity.name,
        imageUrl: identity.pictureUrl,
        existingPlan: undefined,
      });
    }

    // 2. Find or create workspace
    const existingWorkspace = await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .first();

    let workspaceId;
    if (existingWorkspace) {
      workspaceId = existingWorkspace._id;
      if (!existingUser?.existingPlan && existingWorkspace.plan) {
        await ctx.db.patch(userId, { existingPlan: existingWorkspace.plan });
      }
    } else {
      workspaceId = await ctx.db.insert("workspaces", {
        name: "My Service Business",
        ownerId: userId,
      });
    }

    // 3. Find or create default agent config
    if (createDefaultAgent) {
      const existingAgent = await ctx.db
        .query("agentConfigs")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
        .first();

      if (!existingAgent) {
        await ctx.db.insert("agentConfigs", {
          workspaceId,
          agentName: DEFAULT_AGENT_NAME,
          businessName: DEFAULT_BUSINESS_NAME,
          isDefault: true,
          tone: {
            style: DEFAULT_TONE_STYLE,
            description: DEFAULT_TONE_DESCRIPTION,
          },
          customContext: DEFAULT_CUSTOM_CONTEXT,
          voiceId: DEFAULT_VOICE_ID,
          qualificationGoals: [
            { key: "callerName", label: "Full Name", required: true },
            { key: "phone", label: "Best Callback Phone", required: true },
            {
              key: "address",
              label: "Service Address / Area",
              required: true,
            },
            {
              key: "reason",
              label: "Service Needed (Plumbing/HVAC/Electrical/etc.)",
              required: true,
            },
            {
              key: "urgency",
              label: "Urgency (Today/Week/Flexible)",
              required: true,
            },
            {
              key: "numberOfTrees",
              label: "Job Count / Units (if mentioned)",
              required: false,
            },
            {
              key: "sizeEstimate",
              label: "Job Size / Scope",
              required: false,
            },
            {
              key: "hazards",
              label: "Hazards or Constraints",
              required: false,
            },
            {
              key: "accessConstraints",
              label: "Access (Front/Back Yard, Gate, Alley)",
              required: false,
            },
            {
              key: "photosAvailable",
              label: "Photos Available",
              required: false,
            },
            {
              key: "preferredContactMethod",
              label: "Preferred Contact Method",
              required: false,
            },
          ],
          emergencyProtocol: {
            triggers: [
              { keyword: "emergency", action: "suggestDispatch" },
              { keyword: "gas leak", action: "markUrgent" },
              { keyword: "power outage", action: "markUrgent" },
              { keyword: "flooding", action: "suggestDispatch" },
              { keyword: "no heat", action: "suggestDispatch" },
            ],
            instructions:
              "If the caller describes a safety risk or urgent situation: immediately mark as urgent, offer to note details for emergency dispatch, and inform the caller someone will follow up as soon as possible. Placeholder for transfer logic.",
          },
        });
      } else if (
        existingAgent.agentName === "TreeLine Receptionist" &&
        existingAgent.businessName === "TreeLine Tree Removal" &&
        existingAgent.customContext === "" &&
        existingAgent.tone?.style === "professional"
      ) {
        await ctx.db.patch(existingAgent._id, {
          agentName: DEFAULT_AGENT_NAME,
          businessName: DEFAULT_BUSINESS_NAME,
          tone: {
            style: DEFAULT_TONE_STYLE,
            description: DEFAULT_TONE_DESCRIPTION,
          },
          customContext: DEFAULT_CUSTOM_CONTEXT,
          voiceId: DEFAULT_VOICE_ID,
          qualificationGoals: [
            { key: "callerName", label: "Full Name", required: true },
            { key: "phone", label: "Best Callback Phone", required: true },
            {
              key: "address",
              label: "Service Address / Area",
              required: true,
            },
            {
              key: "reason",
              label: "Service Needed (Plumbing/HVAC/Electrical/etc.)",
              required: true,
            },
            {
              key: "urgency",
              label: "Urgency (Today/Week/Flexible)",
              required: true,
            },
            {
              key: "numberOfTrees",
              label: "Job Count / Units (if mentioned)",
              required: false,
            },
            {
              key: "sizeEstimate",
              label: "Job Size / Scope",
              required: false,
            },
            {
              key: "hazards",
              label: "Hazards or Constraints",
              required: false,
            },
            {
              key: "accessConstraints",
              label: "Access (Front/Back Yard, Gate, Alley)",
              required: false,
            },
            {
              key: "photosAvailable",
              label: "Photos Available",
              required: false,
            },
            {
              key: "preferredContactMethod",
              label: "Preferred Contact Method",
              required: false,
            },
          ],
          emergencyProtocol: {
            triggers: [
              { keyword: "emergency", action: "suggestDispatch" },
              { keyword: "gas leak", action: "markUrgent" },
              { keyword: "power outage", action: "markUrgent" },
              { keyword: "flooding", action: "suggestDispatch" },
              { keyword: "no heat", action: "suggestDispatch" },
            ],
            instructions:
              "If the caller describes a safety risk or urgent situation: immediately mark as urgent, offer to note details for emergency dispatch, and inform the caller someone will follow up as soon as possible. Placeholder for transfer logic.",
          },
        });
      }
    }

    return { userId, workspaceId };
  },
});

export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!existingUser) {
      await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        clerkUserId: identity.subject,
        email: args.email ?? identity.email,
        name: args.name ?? identity.name,
        phone: args.phone,
        imageUrl: identity.pictureUrl,
        existingPlan: undefined,
      });
      return;
    }

    const patch: Record<string, string> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.email !== undefined) patch.email = args.email;
    if (args.phone !== undefined) patch.phone = args.phone;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(existingUser._id, patch);
    }
  },
});
