import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import twilio from "twilio";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProvisionRequestBody = {
  agentConfigId?: string;
  countryCode?: string;
  areaCode?: number | string;
};

type ElevenLabsCreateResponse = {
  phone_number_id?: string;
  phoneNumberId?: string;
  phone_number?: string;
};

function parseAreaCode(raw: number | string | undefined): number | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const parsed =
    typeof raw === "number" ? raw : Number.parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}

async function createElevenLabsPhoneNumber(
  apiKey: string,
  twilioPhoneNumber: string,
  twilioAccountSid: string,
  twilioAuthToken: string,
  label: string
): Promise<ElevenLabsCreateResponse> {
  const payloadVariants: Array<{ endpoint: string; payload: Record<string, unknown> }> = [
    {
      endpoint: "https://api.elevenlabs.io/v1/convai/phone-numbers",
      payload: {
        provider: "twilio",
        label,
        phone_number: twilioPhoneNumber,
        sid: twilioAccountSid,
        token: twilioAuthToken,
      },
    },
    {
      endpoint: "https://api.elevenlabs.io/v1/convai/phone-numbers/create",
      payload: {
        provider: "twilio",
        label,
        phone_number: twilioPhoneNumber,
        sid: twilioAccountSid,
        token: twilioAuthToken,
      },
    },
    {
      endpoint: "https://api.elevenlabs.io/v1/convai/phone-numbers/create",
      payload: {
        provider: "twilio",
        label,
        phone_number: twilioPhoneNumber,
        provider_config: {
          sid: twilioAccountSid,
          token: twilioAuthToken,
        },
      },
    },
  ];

  let lastError = "Unknown ElevenLabs error";

  for (const variant of payloadVariants) {
    const response = await fetch(variant.endpoint, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(variant.payload),
    });

    if (response.ok) {
      return (await response.json()) as ElevenLabsCreateResponse;
    }

    lastError = await response.text();
  }

  throw new Error(lastError || "Failed to create ElevenLabs phone number");
}

async function assignElevenLabsPhoneNumberToAgent(
  apiKey: string,
  phoneNumberId: string,
  elevenlabsAgentId: string
) {
  const assignVariants: Array<{ endpoint: string; payload: Record<string, unknown> }> = [
    {
      endpoint: `https://api.elevenlabs.io/v1/convai/phone-numbers/${phoneNumberId}`,
      payload: { agent_id: elevenlabsAgentId },
    },
    {
      endpoint: `https://api.elevenlabs.io/v1/convai/phone-numbers/${phoneNumberId}`,
      payload: { agentId: elevenlabsAgentId },
    },
  ];

  let lastError = "Unknown ElevenLabs assignment error";

  for (const variant of assignVariants) {
    const response = await fetch(variant.endpoint, {
      method: "PATCH",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(variant.payload),
    });

    if (response.ok) return;
    lastError = await response.text();
  }

  throw new Error(lastError || "Failed to assign phone number to agent");
}

export async function POST(req: NextRequest) {
  const { userId, getToken } = await auth();
  const token = await getToken({ template: "convex" });

  if (!userId || !token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as ProvisionRequestBody | null;
  if (!body?.agentConfigId) {
    return NextResponse.json({ error: "Missing agentConfigId" }, { status: 400 });
  }

  const requestedCountry = body.countryCode?.trim().toUpperCase();
  if (requestedCountry && requestedCountry !== "CA") {
    return NextResponse.json(
      { error: "Only Canadian (CA) numbers are supported right now." },
      { status: 400 }
    );
  }

  const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioApiKeySid = process.env.TWILIO_API_KEY_SID;
  const twilioApiKeySecret = process.env.TWILIO_API_KEY_SECRET;

  const twilioAuth =
    twilioApiKeySid && twilioApiKeySecret
      ? { sid: twilioApiKeySid, token: twilioApiKeySecret }
      : twilioAccountSid && twilioAuthToken
        ? { sid: twilioAccountSid, token: twilioAuthToken }
        : null;

  if (!elevenlabsApiKey || !twilioAccountSid || !twilioAuth || !twilioAuthToken) {
    return NextResponse.json(
      {
        error:
          "Missing env vars. Required: ELEVENLABS_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and optionally TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET.",
      },
      { status: 500 }
    );
  }

  const workspace = await fetchQuery(api.workspaces.getMyWorkspace, {}, { token });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const subscriptionStatus = workspace.subscriptionStatus ?? "inactive";
  if (!["active", "trialing"].includes(subscriptionStatus)) {
    return NextResponse.json(
      { error: "Active or trial subscription is required to provision a number." },
      { status: 402 }
    );
  }

  const agentConfigId = body.agentConfigId as Id<"agentConfigs">;
  const agent = await fetchQuery(api.agentConfigs.getAgentConfig, { agentConfigId }, { token });

  if (!agent || agent.workspaceId !== workspace._id) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (!agent.elevenlabsAgentId) {
    return NextResponse.json(
      { error: "Please Save & Sync this agent to ElevenLabs first." },
      { status: 409 }
    );
  }

  if (agent.assignedPhoneNumber || agent.elevenlabsPhoneNumberId) {
    return NextResponse.json(
      { error: "Agent already has a phone number assigned." },
      { status: 409 }
    );
  }

  const countryCode = "CA";
  const areaCode = parseAreaCode(body.areaCode);
  const twilioClient = twilio(twilioAuth.sid, twilioAuth.token, {
    accountSid: twilioAccountSid,
  });

  let selectedNumber: string | undefined;
  try {
    const localCandidates = await twilioClient
      .availablePhoneNumbers(countryCode)
      .local.list({
        limit: 1,
        ...(areaCode ? { areaCode } : {}),
      });
    selectedNumber = localCandidates[0]?.phoneNumber;
  } catch {
    selectedNumber = undefined;
  }

  if (!selectedNumber) {
    return NextResponse.json(
      { error: "No available Canadian phone numbers found. Try another area code." },
      { status: 409 }
    );
  }

  let twilioIncomingSid: string | null = null;

  try {
    const purchased = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber: selectedNumber,
      friendlyName: `ringreceptionist-${workspace._id}-${agent._id}`,
    });

    twilioIncomingSid = purchased.sid;

    const created = await createElevenLabsPhoneNumber(
      elevenlabsApiKey,
      purchased.phoneNumber ?? selectedNumber,
      twilioAccountSid,
      twilioAuthToken,
      purchased.friendlyName ?? `ringreceptionist-${agent._id}`
    );

    const elevenlabsPhoneNumberId = created.phone_number_id ?? created.phoneNumberId;
    if (!elevenlabsPhoneNumberId) {
      throw new Error("Missing ElevenLabs phone number id in response");
    }

    await assignElevenLabsPhoneNumberToAgent(
      elevenlabsApiKey,
      elevenlabsPhoneNumberId,
      agent.elevenlabsAgentId
    );

    await fetchMutation(
      api.agentConfigs.updateAgentConfig,
      {
        agentConfigId: agent._id,
        assignedPhoneNumber: purchased.phoneNumber ?? selectedNumber,
        elevenlabsPhoneNumberId,
      },
      { token }
    );

    return NextResponse.json({
      success: true,
      phoneNumber: purchased.phoneNumber ?? selectedNumber,
      phoneNumberId: elevenlabsPhoneNumberId,
      twilioIncomingSid,
    });
  } catch (error) {
    if (twilioIncomingSid) {
      try {
        await twilioClient.incomingPhoneNumbers(twilioIncomingSid).remove();
      } catch (releaseError) {
        console.error("Failed to roll back Twilio number:", releaseError);
      }
    }

    const message = error instanceof Error ? error.message : "Provisioning failed";
    console.error("Phone number provisioning error:", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
