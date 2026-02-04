import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByAgent = query({
  args: { agentConfigId: v.id("agentConfigs") },
  handler: async (ctx, { agentConfigId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("knowledgeEntries")
      .withIndex("by_agent", (q) => q.eq("agentConfigId", agentConfigId))
      .collect();
  },
});

export const addEntry = mutation({
  args: {
    agentConfigId: v.id("agentConfigs"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("knowledgeEntries", {
      agentConfigId: args.agentConfigId,
      title: args.title,
      content: args.content,
    });
  },
});

export const updateEntry = mutation({
  args: {
    entryId: v.id("knowledgeEntries"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    elevenlabsKbId: v.optional(v.string()),
  },
  handler: async (ctx, { entryId, ...fields }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const entry = await ctx.db.get(entryId);
    if (!entry) throw new Error("Knowledge entry not found");

    const patch: Record<string, unknown> = {};
    if (fields.title !== undefined) patch.title = fields.title;
    if (fields.content !== undefined) patch.content = fields.content;
    if (fields.elevenlabsKbId !== undefined)
      patch.elevenlabsKbId = fields.elevenlabsKbId;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(entryId, patch);
    }

    return entryId;
  },
});

export const deleteEntry = mutation({
  args: { entryId: v.id("knowledgeEntries") },
  handler: async (ctx, { entryId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const entry = await ctx.db.get(entryId);
    if (!entry) throw new Error("Knowledge entry not found");

    await ctx.db.delete(entryId);
    return { deleted: true };
  },
});
