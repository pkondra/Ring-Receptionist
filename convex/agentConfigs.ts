import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { DEFAULT_VOICE_ID } from "./constants";

export const getDefaultAgent = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("agentConfigs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .filter((q) => q.eq(q.field("isDefault"), true))
      .first();
  },
});

export const listAgents = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("agentConfigs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .collect();
  },
});

export const getAgentConfig = query({
  args: { agentConfigId: v.id("agentConfigs") },
  handler: async (ctx, { agentConfigId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db.get(agentConfigId);
  },
});

export const createAgent = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    agentName: v.string(),
    businessName: v.string(),
    tone: v.object({
      style: v.string(),
      description: v.string(),
    }),
    customContext: v.optional(v.string()),
    voiceId: v.optional(v.string()),
    qualificationGoals: v.array(
      v.object({
        key: v.string(),
        label: v.string(),
        required: v.boolean(),
      })
    ),
    emergencyProtocol: v.object({
      triggers: v.array(
        v.object({
          keyword: v.string(),
          action: v.union(
            v.literal("markUrgent"),
            v.literal("suggestDispatch"),
            v.literal("transferPlaceholder")
          ),
        })
      ),
      instructions: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const agentConfigId = await ctx.db.insert("agentConfigs", {
      workspaceId: args.workspaceId,
      agentName: args.agentName,
      businessName: args.businessName,
      tone: args.tone,
      customContext: args.customContext ?? "",
      voiceId: args.voiceId ?? DEFAULT_VOICE_ID,
      qualificationGoals: args.qualificationGoals,
      emergencyProtocol: args.emergencyProtocol,
      isDefault: false,
    });

    return agentConfigId;
  },
});

export const deleteAgent = mutation({
  args: { agentConfigId: v.id("agentConfigs") },
  handler: async (ctx, { agentConfigId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const config = await ctx.db.get(agentConfigId);
    if (!config) throw new Error("Agent config not found");
    const wasDefault = config.isDefault;

    // Cascade delete: knowledge entries
    const knowledgeEntries = await ctx.db
      .query("knowledgeEntries")
      .withIndex("by_agent", (q) => q.eq("agentConfigId", agentConfigId))
      .collect();
    for (const entry of knowledgeEntries) {
      await ctx.db.delete(entry._id);
    }

    // Cascade delete: chat sessions + messages
    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_agent", (q) => q.eq("agentConfigId", agentConfigId))
      .collect();
    for (const session of sessions) {
      const messages = await ctx.db
        .query("chatMessages")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }
      await ctx.db.delete(session._id);
    }

    // Delete the agent config itself
    await ctx.db.delete(agentConfigId);

    if (wasDefault) {
      const nextAgent = await ctx.db
        .query("agentConfigs")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", config.workspaceId))
        .first();
      if (nextAgent) {
        await ctx.db.patch(nextAgent._id, { isDefault: true });
      }
    }

    return { deleted: true };
  },
});

export const updateAgentConfig = mutation({
  args: {
    agentConfigId: v.id("agentConfigs"),
    agentName: v.optional(v.string()),
    businessName: v.optional(v.string()),
    tone: v.optional(
      v.object({
        style: v.string(),
        description: v.string(),
      })
    ),
    customContext: v.optional(v.string()),
    voiceId: v.optional(v.string()),
    qualificationGoals: v.optional(
      v.array(
        v.object({
          key: v.string(),
          label: v.string(),
          required: v.boolean(),
        })
      )
    ),
    emergencyProtocol: v.optional(
      v.object({
        triggers: v.array(
          v.object({
            keyword: v.string(),
            action: v.union(
              v.literal("markUrgent"),
              v.literal("suggestDispatch"),
              v.literal("transferPlaceholder")
            ),
          })
        ),
        instructions: v.string(),
      })
    ),
  },
  handler: async (ctx, { agentConfigId, ...fields }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const config = await ctx.db.get(agentConfigId);
    if (!config) throw new Error("Agent config not found");

    const patch: Record<string, unknown> = {};
    if (fields.agentName !== undefined) patch.agentName = fields.agentName;
    if (fields.businessName !== undefined)
      patch.businessName = fields.businessName;
    if (fields.tone !== undefined) patch.tone = fields.tone;
    if (fields.customContext !== undefined)
      patch.customContext = fields.customContext;
    if (fields.voiceId !== undefined) patch.voiceId = fields.voiceId;
    if (fields.qualificationGoals !== undefined)
      patch.qualificationGoals = fields.qualificationGoals;
    if (fields.emergencyProtocol !== undefined)
      patch.emergencyProtocol = fields.emergencyProtocol;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(agentConfigId, patch);
    }

    return agentConfigId;
  },
});

export const setElevenLabsAgentId = mutation({
  args: {
    agentConfigId: v.id("agentConfigs"),
    elevenlabsAgentId: v.string(),
  },
  handler: async (ctx, { agentConfigId, elevenlabsAgentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const config = await ctx.db.get(agentConfigId);
    if (!config) throw new Error("Agent config not found");

    await ctx.db.patch(agentConfigId, { elevenlabsAgentId });
    return agentConfigId;
  },
});

export const setDefaultAgent = mutation({
  args: {
    agentConfigId: v.id("agentConfigs"),
  },
  handler: async (ctx, { agentConfigId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const agent = await ctx.db.get(agentConfigId);
    if (!agent) throw new Error("Agent config not found");

    const workspaceAgents = await ctx.db
      .query("agentConfigs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", agent.workspaceId))
      .collect();

    for (const config of workspaceAgents) {
      await ctx.db.patch(config._id, {
        isDefault: config._id === agentConfigId,
      });
    }

    return agentConfigId;
  },
});
