import { mutation } from "./_generated/server";
import {
  DEFAULT_AGENT_NAME,
  DEFAULT_BUSINESS_NAME,
  DEFAULT_TONE_STYLE,
  DEFAULT_TONE_DESCRIPTION,
  DEFAULT_CUSTOM_CONTEXT,
  DEFAULT_VOICE_ID,
  DEFAULT_PLAN,
  PLAN_MINUTES,
} from "./constants";

export const ensureAccountSetup = mutation({
  args: {},
  handler: async (ctx) => {
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
      });
    } else {
      userId = await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        clerkUserId: identity.subject,
        email: identity.email,
        name: identity.name,
        imageUrl: identity.pictureUrl,
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
    } else {
      workspaceId = await ctx.db.insert("workspaces", {
        name: "My Tree Service",
        ownerId: userId,
        plan: DEFAULT_PLAN,
        minutesIncluded: PLAN_MINUTES[DEFAULT_PLAN],
      });
    }

    // 3. Find or create default agent config
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
            label: "Job Address / Neighborhood + City",
            required: true,
          },
          {
            key: "reason",
            label: "Service Needed (Removal/Trim/Stump/Emergency)",
            required: true,
          },
          {
            key: "urgency",
            label: "Urgency (Today/Week/Flexible)",
            required: true,
          },
          {
            key: "numberOfTrees",
            label: "How Many Trees (if mentioned)",
            required: false,
          },
          {
            key: "sizeEstimate",
            label: "Approx Tree Size / Height",
            required: false,
          },
          {
            key: "hazards",
            label: "Hazards (Power Lines/Leaning)",
            required: false,
          },
          {
            key: "accessConstraints",
            label: "Access (Front/Back Yard, Gate, Alley)",
            required: false,
          },
          { key: "photosAvailable", label: "Photos Available", required: false },
          {
            key: "preferredContactMethod",
            label: "Preferred Contact Method",
            required: false,
          },
        ],
        emergencyProtocol: {
          triggers: [
            { keyword: "tree on house", action: "markUrgent" },
            { keyword: "power line", action: "markUrgent" },
            { keyword: "downed power line", action: "suggestDispatch" },
            { keyword: "blocked road", action: "markUrgent" },
            { keyword: "emergency", action: "suggestDispatch" },
          ],
          instructions:
            "If caller describes hazards such as a tree on a house, downed power line, or blocked road: immediately mark as urgent, offer to note details for emergency dispatch, and inform the caller someone will follow up as soon as possible. Placeholder for transfer logic.",
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
            label: "Job Address / Neighborhood + City",
            required: true,
          },
          {
            key: "reason",
            label: "Service Needed (Removal/Trim/Stump/Emergency)",
            required: true,
          },
          {
            key: "urgency",
            label: "Urgency (Today/Week/Flexible)",
            required: true,
          },
          {
            key: "numberOfTrees",
            label: "How Many Trees (if mentioned)",
            required: false,
          },
          {
            key: "sizeEstimate",
            label: "Approx Tree Size / Height",
            required: false,
          },
          {
            key: "hazards",
            label: "Hazards (Power Lines/Leaning)",
            required: false,
          },
          {
            key: "accessConstraints",
            label: "Access (Front/Back Yard, Gate, Alley)",
            required: false,
          },
          { key: "photosAvailable", label: "Photos Available", required: false },
          {
            key: "preferredContactMethod",
            label: "Preferred Contact Method",
            required: false,
          },
        ],
      });
    }

    return { userId, workspaceId };
  },
});
