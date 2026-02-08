import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getMyWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return null;

    return await ctx.db
      .query("workspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .first();
  },
});

export const recordElevenLabsWebhookHealth = mutation({
  args: {
    secret: v.string(),
    workspaceId: v.id("workspaces"),
    status: v.union(
      v.literal("received"),
      v.literal("success"),
      v.literal("error")
    ),
    eventType: v.optional(v.string()),
    message: v.optional(v.string()),
    conversationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;
    if (!webhookSecret || args.secret !== webhookSecret) {
      throw new Error("Unauthorized webhook");
    }

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    await ctx.db.patch(args.workspaceId, {
      lastElevenlabsWebhookAt: Date.now(),
      lastElevenlabsWebhookStatus: args.status,
      ...(args.eventType !== undefined
        ? { lastElevenlabsWebhookEventType: args.eventType }
        : {}),
      ...(args.message !== undefined
        ? { lastElevenlabsWebhookMessage: args.message }
        : {}),
      ...(args.conversationId !== undefined
        ? { lastElevenlabsWebhookConversationId: args.conversationId }
        : {}),
    });

    return true;
  },
});
