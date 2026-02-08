import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function assertWebhookSecret(secret: string) {
  const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!webhookSecret || secret !== webhookSecret) {
    throw new Error("Unauthorized webhook");
  }
}

export const addMessage = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    role: v.union(v.literal("user"), v.literal("agent")),
    content: v.string(),
  },
  handler: async (ctx, { sessionId, role, content }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("chatMessages", {
      sessionId,
      role,
      content,
      timestamp: Date.now(),
    });
  },
});

export const listMessagesForSession = query({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, { sessionId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .order("asc")
      .collect();
  },
});

export const replaceMessagesFromWebhook = mutation({
  args: {
    secret: v.string(),
    sessionId: v.id("chatSessions"),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("agent")),
        content: v.string(),
        timestamp: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { secret, sessionId, messages }) => {
    assertWebhookSecret(secret);

    const existing = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();

    for (const row of existing) {
      await ctx.db.delete(row._id);
    }

    const now = Date.now();
    for (const msg of messages) {
      await ctx.db.insert("chatMessages", {
        sessionId,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp ?? now,
      });
    }

    return true;
  },
});
