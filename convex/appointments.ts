import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const appointmentFields = {
  scheduledAt: v.optional(v.number()),
  scheduledForText: v.optional(v.string()),
  contactName: v.optional(v.string()),
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  reason: v.optional(v.string()),
  notes: v.optional(v.string()),
  summary: v.optional(v.string()),
};

function assertWebhookSecret(secret: string) {
  const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!webhookSecret || secret !== webhookSecret) {
    throw new Error("Unauthorized webhook");
  }
}

export const upsertForSession = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    ...appointmentFields,
  },
  handler: async (ctx, { sessionId, ...fields }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");

    const existing = await ctx.db
      .query("appointments")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();

    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) normalized[key] = value;
    }

    const hasScheduledAt = typeof fields.scheduledAt === "number";
    const nextStatus = hasScheduledAt ? "scheduled" : "needs_followup";

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...normalized,
        ...(hasScheduledAt ? { status: "scheduled" } : {}),
      });
      return existing._id;
    }

    return await ctx.db.insert("appointments", {
      workspaceId: session.workspaceId,
      agentConfigId: session.agentConfigId,
      sessionId,
      createdAt: Date.now(),
      status: nextStatus,
      ...normalized,
    });
  },
});

export const listAppointmentsForWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .take(200);

    const agentMap = new Map();
    for (const appointment of appointments) {
      if (!agentMap.has(appointment.agentConfigId)) {
        agentMap.set(
          appointment.agentConfigId,
          await ctx.db.get(appointment.agentConfigId)
        );
      }
    }

    return appointments.map((appointment) => {
      const agent = agentMap.get(appointment.agentConfigId);
      return {
        ...appointment,
        agentName: agent?.agentName ?? "Unknown Agent",
        businessName: agent?.businessName ?? "",
      };
    });
  },
});

export const upsertForSessionFromWebhook = mutation({
  args: {
    secret: v.string(),
    sessionId: v.id("chatSessions"),
    ...appointmentFields,
  },
  handler: async (ctx, { secret, sessionId, ...fields }) => {
    assertWebhookSecret(secret);

    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");

    const existing = await ctx.db
      .query("appointments")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();

    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) normalized[key] = value;
    }

    const hasScheduledAt = typeof fields.scheduledAt === "number";
    const nextStatus = hasScheduledAt ? "scheduled" : "needs_followup";

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...normalized,
        ...(hasScheduledAt ? { status: "scheduled" } : {}),
      });
      return existing._id;
    }

    return await ctx.db.insert("appointments", {
      workspaceId: session.workspaceId,
      agentConfigId: session.agentConfigId,
      sessionId,
      createdAt: Date.now(),
      status: nextStatus,
      ...normalized,
    });
  },
});
