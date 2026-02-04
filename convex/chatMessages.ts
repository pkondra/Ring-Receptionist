import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
