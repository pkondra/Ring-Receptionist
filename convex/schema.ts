import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const qualificationGoalValidator = v.object({
  key: v.string(),
  label: v.string(),
  required: v.boolean(),
});

const emergencyTriggerValidator = v.object({
  keyword: v.string(),
  action: v.union(
    v.literal("markUrgent"),
    v.literal("suggestDispatch"),
    v.literal("transferPlaceholder")
  ),
});

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

const callHandlingValidator = v.object({
  mode: v.union(
    v.literal("businessHours"),
    v.literal("always"),
    v.literal("custom")
  ),
  businessHoursStart: v.optional(v.string()),
  businessHoursEnd: v.optional(v.string()),
  customSchedule: v.optional(v.string()),
});

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    existingPlan: v.optional(v.string()),
    welcomeEmailSentAt: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_clerk_id", ["clerkUserId"]),

  workspaces: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    plan: v.optional(v.string()),
    minutesIncluded: v.optional(v.number()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    billingInterval: v.optional(v.string()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    lastElevenlabsWebhookAt: v.optional(v.number()),
    lastElevenlabsWebhookStatus: v.optional(
      v.union(
        v.literal("received"),
        v.literal("success"),
        v.literal("error")
      )
    ),
    lastElevenlabsWebhookEventType: v.optional(v.string()),
    lastElevenlabsWebhookMessage: v.optional(v.string()),
    lastElevenlabsWebhookConversationId: v.optional(v.string()),
  }).index("by_owner", ["ownerId"]),

  agentConfigs: defineTable({
    workspaceId: v.id("workspaces"),
    agentName: v.string(),
    businessName: v.string(),
    tone: v.object({
      style: v.string(),
      description: v.string(),
    }),
    customContext: v.optional(v.string()),
    voiceId: v.optional(v.string()),
    qualificationGoals: v.array(qualificationGoalValidator),
    emergencyProtocol: v.object({
      triggers: v.array(emergencyTriggerValidator),
      instructions: v.string(),
    }),
    onboardingWebsiteUrl: v.optional(v.string()),
    callHandling: v.optional(callHandlingValidator),
    assignedPhoneNumber: v.optional(v.string()),
    elevenlabsPhoneNumberId: v.optional(v.string()),
    isDefault: v.boolean(),
    elevenlabsAgentId: v.optional(v.string()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_elevenlabs_agent_id", ["elevenlabsAgentId"])
    .index("by_assigned_phone_number", ["assignedPhoneNumber"])
    .index("by_elevenlabs_phone_number_id", ["elevenlabsPhoneNumberId"]),

  chatSessions: defineTable({
    workspaceId: v.id("workspaces"),
    agentConfigId: v.id("agentConfigs"),
    userId: v.id("users"),
    source: v.optional(v.union(v.literal("web"), v.literal("phone"))),
    externalCallId: v.optional(v.string()),
    callerPhone: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("ended")),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    extractedFields: v.optional(extractedFieldsValidator),
    memoryFacts: v.optional(v.array(memoryFactValidator)),
    summary: v.optional(v.string()),
    callNotificationEmailSentAt: v.optional(v.number()),
    leadNotificationEmailSentAt: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_agent", ["agentConfigId"])
    .index("by_external_call_id", ["externalCallId"]),

  chatMessages: defineTable({
    sessionId: v.id("chatSessions"),
    role: v.union(v.literal("user"), v.literal("agent")),
    content: v.string(),
    timestamp: v.number(),
  }).index("by_session", ["sessionId"]),

  appointments: defineTable({
    workspaceId: v.id("workspaces"),
    agentConfigId: v.id("agentConfigs"),
    sessionId: v.id("chatSessions"),
    createdAt: v.number(),
    scheduledAt: v.optional(v.number()),
    scheduledForText: v.optional(v.string()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("needs_followup")
    ),
    contactName: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    reason: v.optional(v.string()),
    notes: v.optional(v.string()),
    summary: v.optional(v.string()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_session", ["sessionId"])
    .index("by_agent", ["agentConfigId"]),

  knowledgeEntries: defineTable({
    agentConfigId: v.id("agentConfigs"),
    title: v.string(),
    content: v.string(),
    elevenlabsKbId: v.optional(v.string()),
  }).index("by_agent", ["agentConfigId"]),

  workspaceKnowledgeEntries: defineTable({
    workspaceId: v.id("workspaces"),
    title: v.string(),
    content: v.string(),
    elevenlabsKbId: v.optional(v.string()),
  }).index("by_workspace", ["workspaceId"]),
});
