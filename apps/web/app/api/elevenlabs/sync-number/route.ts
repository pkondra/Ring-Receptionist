import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { assignAvailablePhoneToAgent } from "@/lib/elevenlabsPhonePool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const billingWebhookSecret = process.env.BILLING_WEBHOOK_SECRET;
const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export async function POST(req: NextRequest) {
  if (!convexUrl || !billingWebhookSecret || !elevenlabsApiKey) {
    return NextResponse.json(
      { error: "Missing phone sync configuration" },
      { status: 500 }
    );
  }

  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    agentConfigId?: string;
  };
  const agentConfigId = body.agentConfigId?.trim();
  if (!agentConfigId) {
    return NextResponse.json(
      { error: "Missing agentConfigId" },
      { status: 400 }
    );
  }

  const workspace = await fetchQuery(api.workspaces.getMyWorkspace, {}, { token });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const subscriptionStatus = (workspace.subscriptionStatus ?? "")
    .toString()
    .toLowerCase();
  if (!ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus)) {
    return NextResponse.json(
      {
        error:
          "Phone sync requires an active or trialing subscription. Activate a plan first.",
      },
      { status: 403 }
    );
  }

  const agent = await fetchQuery(
    api.agentConfigs.getAgentConfig,
    { agentConfigId: agentConfigId as Id<"agentConfigs"> },
    { token }
  );

  if (!agent || agent.workspaceId !== workspace._id) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (!agent.elevenlabsAgentId) {
    return NextResponse.json(
      { error: "Agent must be synced to ElevenLabs before assigning a number" },
      { status: 400 }
    );
  }

  if (agent.assignedPhoneNumber && agent.elevenlabsPhoneNumberId) {
    return NextResponse.json({
      success: true,
      assignedPhoneNumber: agent.assignedPhoneNumber,
      elevenlabsPhoneNumberId: agent.elevenlabsPhoneNumberId,
      message: "Phone number already assigned",
    });
  }

  try {
    const client = new ConvexHttpClient(convexUrl);
    const assignment = await assignAvailablePhoneToAgent({
      client,
      workspaceId: workspace._id,
      agentConfigId: agent._id,
      elevenlabsAgentId: agent.elevenlabsAgentId,
      elevenlabsApiKey,
      billingWebhookSecret,
    });

    return NextResponse.json({
      success: true,
      assignedPhoneNumber: assignment.phoneNumber,
      elevenlabsPhoneNumberId: assignment.phoneNumberId,
      message: assignment.reused
        ? "Existing ElevenLabs number linked"
        : "Phone number assigned successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync phone number",
      },
      { status: 502 }
    );
  }
}
