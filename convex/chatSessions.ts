import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const extractedFieldsValidator = v.object({
  callerName: v.optional(v.string()),
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  reason: v.optional(v.string()),
  numberOfTrees: v.optional(v.string()),
  sizeEstimate: v.optional(v.string()),
  urgency: v.optional(v.string()),
  hazards: v.optional(v.string()),
  accessConstraints: v.optional(v.string()),
  preferredWindow: v.optional(v.string()),
});

const memoryFactValidator = v.object({
  key: v.string(),
  value: v.string(),
});

function assertWebhookSecret(secret: string) {
  const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!webhookSecret || secret !== webhookSecret) {
    throw new Error("Unauthorized webhook");
  }
}

export const createSession = mutation({
  args: {
    agentConfigId: v.id("agentConfigs"),
  },
  handler: async (ctx, { agentConfigId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) throw new Error("User not found");

    const agentConfig = await ctx.db.get(agentConfigId);
    if (!agentConfig) throw new Error("Agent config not found");

    return await ctx.db.insert("chatSessions", {
      workspaceId: agentConfig.workspaceId,
      agentConfigId,
      userId: user._id,
      status: "active",
      startedAt: Date.now(),
    });
  },
});

export const upsertSessionFromWebhook = mutation({
  args: {
    secret: v.string(),
    elevenlabsAgentId: v.string(),
    externalCallId: v.string(),
    callerPhone: v.optional(v.string()),
    calledPhoneNumber: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertWebhookSecret(args.secret);

    let agentConfig = await ctx.db
      .query("agentConfigs")
      .withIndex("by_elevenlabs_agent_id", (q) =>
        q.eq("elevenlabsAgentId", args.elevenlabsAgentId)
      )
      .unique();
    if (!agentConfig && args.calledPhoneNumber) {
      agentConfig = await ctx.db
        .query("agentConfigs")
        .withIndex("by_assigned_phone_number", (q) =>
          q.eq("assignedPhoneNumber", args.calledPhoneNumber)
        )
        .first();
    }
    if (!agentConfig) {
      throw new Error("Agent config not found for webhook");
    }

    const workspace = await ctx.db.get(agentConfig.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found for webhook");
    }

    const existing = await ctx.db
      .query("chatSessions")
      .withIndex("by_external_call_id", (q) =>
        q.eq("externalCallId", args.externalCallId)
      )
      .first();

    const startedAt = args.startedAt ?? Date.now();
    const endedAt = args.endedAt;
    const status = endedAt ? "ended" : "active";

    if (existing) {
      await ctx.db.patch(existing._id, {
        source: "phone",
        callerPhone: args.callerPhone ?? existing.callerPhone,
        startedAt: existing.startedAt ?? startedAt,
        status,
        ...(endedAt ? { endedAt } : {}),
      });
      return existing._id;
    }

    return await ctx.db.insert("chatSessions", {
      workspaceId: agentConfig.workspaceId,
      agentConfigId: agentConfig._id,
      userId: workspace.ownerId,
      source: "phone",
      externalCallId: args.externalCallId,
      callerPhone: args.callerPhone,
      status,
      startedAt,
      ...(endedAt ? { endedAt } : {}),
    });
  },
});

export const endSession = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, summary }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(sessionId, {
      status: "ended",
      endedAt: Date.now(),
      ...(summary !== undefined ? { summary } : {}),
    });
  },
});

export const updateExtractedFields = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    extractedFields: extractedFieldsValidator,
  },
  handler: async (ctx, { sessionId, extractedFields }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(sessionId, { extractedFields });
  },
});

export const updateMemoryFacts = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    memoryFacts: v.array(memoryFactValidator),
  },
  handler: async (ctx, { sessionId, memoryFacts }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(sessionId, { memoryFacts });
  },
});

export const updateSummary = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    summary: v.string(),
  },
  handler: async (ctx, { sessionId, summary }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(sessionId, { summary });
  },
});

export const finalizeSessionFromWebhook = mutation({
  args: {
    secret: v.string(),
    sessionId: v.id("chatSessions"),
    endedAt: v.optional(v.number()),
    summary: v.optional(v.string()),
    extractedFields: v.optional(extractedFieldsValidator),
    memoryFacts: v.optional(v.array(memoryFactValidator)),
  },
  handler: async (ctx, args) => {
    assertWebhookSecret(args.secret);

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const patch: Record<string, unknown> = {
      status: "ended",
      endedAt: args.endedAt ?? Date.now(),
    };
    if (args.summary !== undefined) patch.summary = args.summary;
    if (args.extractedFields !== undefined) {
      patch.extractedFields = args.extractedFields;
    }
    if (args.memoryFacts !== undefined) patch.memoryFacts = args.memoryFacts;

    await ctx.db.patch(args.sessionId, patch);
    return args.sessionId;
  },
});

export const getSession = query({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, { sessionId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db.get(sessionId);
  },
});

export const listSessionsForAgent = query({
  args: { agentConfigId: v.id("agentConfigs") },
  handler: async (ctx, { agentConfigId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("chatSessions")
      .withIndex("by_agent", (q) => q.eq("agentConfigId", agentConfigId))
      .order("desc")
      .take(50);
  },
});

export const listSessionsForWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .take(100);

    const agentMap = new Map();
    for (const session of sessions) {
      if (!agentMap.has(session.agentConfigId)) {
        agentMap.set(
          session.agentConfigId,
          await ctx.db.get(session.agentConfigId)
        );
      }
    }

    return sessions.map((session) => {
      const agent = agentMap.get(session.agentConfigId);
      return {
        ...session,
        agentName: agent?.agentName ?? "Unknown Agent",
        businessName: agent?.businessName ?? "",
      };
    });
  },
});

export const listLeadsForWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .take(100);

    const leads = sessions.filter((session) =>
      session.extractedFields
        ? Object.values(session.extractedFields).some(Boolean)
        : false
    );

    const agentMap = new Map();
    for (const session of leads) {
      if (!agentMap.has(session.agentConfigId)) {
        agentMap.set(
          session.agentConfigId,
          await ctx.db.get(session.agentConfigId)
        );
      }
    }

    return leads.map((session) => {
      const agent = agentMap.get(session.agentConfigId);
      return {
        ...session,
        agentName: agent?.agentName ?? "Unknown Agent",
        businessName: agent?.businessName ?? "",
      };
    });
  },
});
