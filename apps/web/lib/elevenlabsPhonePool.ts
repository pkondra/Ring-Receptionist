import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

type ElevenLabsPhoneNumber = {
  id: string;
  phoneNumber: string | null;
  assignedAgentId: string | null;
};

type SyncWorkspacePhoneAssignmentArgs = {
  client: ConvexHttpClient;
  workspaceId: Id<"workspaces">;
  subscriptionStatus: string;
  elevenlabsApiKey: string;
  billingWebhookSecret: string;
};

type AssignAvailablePhoneToAgentArgs = {
  client: ConvexHttpClient;
  workspaceId: Id<"workspaces">;
  agentConfigId: Id<"agentConfigs">;
  elevenlabsAgentId: string;
  elevenlabsApiKey: string;
  billingWebhookSecret: string;
};

const ASSIGN_PHONE_STATUSES = new Set(["active", "trialing"]);
const RELEASE_PHONE_STATUSES = new Set([
  "canceled",
  "incomplete_expired",
  "unpaid",
  "paused",
]);

function normalizeElevenLabsPhone(row: unknown): ElevenLabsPhoneNumber | null {
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;

  const nestedAssignedAgent =
    record.assigned_agent && typeof record.assigned_agent === "object"
      ? (record.assigned_agent as Record<string, unknown>)
      : null;
  const nestedAgent =
    record.agent && typeof record.agent === "object"
      ? (record.agent as Record<string, unknown>)
      : null;
  const nestedPhoneObject =
    record.phone && typeof record.phone === "object"
      ? (record.phone as Record<string, unknown>)
      : null;

  const idCandidates = [
    record.phone_number_id,
    record.phoneNumberId,
    record.id,
    nestedPhoneObject?.id,
  ];
  const phoneCandidates = [
    record.phone_number,
    record.phoneNumber,
    record.number,
    record.e164_phone_number,
    record.e164PhoneNumber,
    record.display_phone_number,
    record.displayPhoneNumber,
    nestedPhoneObject?.phone_number,
    nestedPhoneObject?.e164_phone_number,
  ];
  const assignedAgentCandidates = [
    record.agent_id,
    record.agentId,
    nestedAssignedAgent?.agent_id,
    nestedAssignedAgent?.id,
    nestedAgent?.agent_id,
    nestedAgent?.id,
  ];

  const id = idCandidates.find(
    (value): value is string => typeof value === "string" && value.length > 0
  );
  if (!id) return null;

  const phoneNumber =
    phoneCandidates.find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0
    ) ?? null;

  const assignedAgentId =
    assignedAgentCandidates.find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0
    ) ?? null;

  return { id, phoneNumber, assignedAgentId };
}

async function listElevenLabsPhoneNumbers(apiKey: string) {
  const response = await fetch("https://api.elevenlabs.io/v1/convai/phone-numbers", {
    headers: {
      "xi-api-key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to list ElevenLabs phone numbers: ${errorText || response.status}`
    );
  }

  const payload = (await response.json()) as {
    phone_numbers?: unknown[];
    phoneNumbers?: unknown[];
    numbers?: unknown[];
  };

  const rows = payload.phone_numbers ?? payload.phoneNumbers ?? payload.numbers ?? [];
  return rows
    .map(normalizeElevenLabsPhone)
    .filter((value): value is ElevenLabsPhoneNumber => Boolean(value));
}

async function patchElevenLabsPhoneAssignment(
  apiKey: string,
  phoneNumberId: string,
  payload: Record<string, unknown>
) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/phone-numbers/${phoneNumberId}`,
    {
      method: "PATCH",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );

  if (response.ok) return;

  const errorText = await response.text();
  throw new Error(
    `Failed to update ElevenLabs phone number ${phoneNumberId}: ${
      errorText || response.status
    }`
  );
}

async function assignElevenLabsPhoneNumberToAgent(
  apiKey: string,
  phoneNumberId: string,
  elevenlabsAgentId: string
) {
  try {
    await patchElevenLabsPhoneAssignment(apiKey, phoneNumberId, {
      agent_id: elevenlabsAgentId,
    });
    return;
  } catch {
    await patchElevenLabsPhoneAssignment(apiKey, phoneNumberId, {
      agentId: elevenlabsAgentId,
    });
  }
}

async function unassignElevenLabsPhoneNumber(apiKey: string, phoneNumberId: string) {
  try {
    await patchElevenLabsPhoneAssignment(apiKey, phoneNumberId, {
      agent_id: null,
    });
    return;
  } catch {
    await patchElevenLabsPhoneAssignment(apiKey, phoneNumberId, {
      agentId: null,
    });
  }
}

export async function assignAvailablePhoneToAgent({
  client,
  workspaceId,
  agentConfigId,
  elevenlabsAgentId,
  elevenlabsApiKey,
  billingWebhookSecret,
}: AssignAvailablePhoneToAgentArgs) {
  const context = await client.mutation(
    api.billingWebhook.getPhoneAssignmentContextFromWebhook,
    {
      secret: billingWebhookSecret,
      workspaceId,
    }
  );

  const alreadyTrackedIds = new Set(context.assignedPhoneNumberIds ?? []);
  const numbers = await listElevenLabsPhoneNumbers(elevenlabsApiKey);

  // If ElevenLabs already has a number bound to this agent, re-link it in Convex.
  const existingForAgent = numbers.find(
    (number) =>
      number.assignedAgentId === elevenlabsAgentId && Boolean(number.phoneNumber)
  );
  if (existingForAgent && existingForAgent.phoneNumber) {
    await client.mutation(api.billingWebhook.setWorkspacePhoneAssignmentFromWebhook, {
      secret: billingWebhookSecret,
      workspaceId,
      agentConfigId,
      assignedPhoneNumber: existingForAgent.phoneNumber,
      elevenlabsPhoneNumberId: existingForAgent.id,
    });
    return {
      action: "assigned" as const,
      reused: true,
      phoneNumber: existingForAgent.phoneNumber,
      phoneNumberId: existingForAgent.id,
    };
  }

  const available = numbers.find(
    (number) =>
      !number.assignedAgentId &&
      !alreadyTrackedIds.has(number.id) &&
      Boolean(number.phoneNumber)
  );

  if (!available || !available.phoneNumber) {
    throw new Error("No unassigned ElevenLabs phone numbers available");
  }

  await assignElevenLabsPhoneNumberToAgent(
    elevenlabsApiKey,
    available.id,
    elevenlabsAgentId
  );

  await client.mutation(api.billingWebhook.setWorkspacePhoneAssignmentFromWebhook, {
    secret: billingWebhookSecret,
    workspaceId,
    agentConfigId,
    assignedPhoneNumber: available.phoneNumber,
    elevenlabsPhoneNumberId: available.id,
  });

  return {
    action: "assigned" as const,
    reused: false,
    phoneNumber: available.phoneNumber,
    phoneNumberId: available.id,
  };
}

export async function syncWorkspacePhoneAssignment({
  client,
  workspaceId,
  subscriptionStatus,
  elevenlabsApiKey,
  billingWebhookSecret,
}: SyncWorkspacePhoneAssignmentArgs) {
  if (
    !ASSIGN_PHONE_STATUSES.has(subscriptionStatus) &&
    !RELEASE_PHONE_STATUSES.has(subscriptionStatus)
  ) {
    return { action: "noop" as const };
  }

  const context = await client.mutation(
    api.billingWebhook.getPhoneAssignmentContextFromWebhook,
    {
      secret: billingWebhookSecret,
      workspaceId,
    }
  );

  if (ASSIGN_PHONE_STATUSES.has(subscriptionStatus)) {
    if (
      context.targetAssignedPhoneNumber &&
      context.targetElevenlabsPhoneNumberId
    ) {
      return { action: "noop" as const };
    }

    if (!context.targetAgentConfigId || !context.targetElevenlabsAgentId) {
      return { action: "noop" as const };
    }

    const alreadyTrackedIds = new Set(context.assignedPhoneNumberIds ?? []);
    const numbers = await listElevenLabsPhoneNumbers(elevenlabsApiKey);
    const available = numbers.find(
      (number) =>
        !number.assignedAgentId &&
        !alreadyTrackedIds.has(number.id) &&
        Boolean(number.phoneNumber)
    );

    if (!available || !available.phoneNumber) {
      throw new Error("No unassigned ElevenLabs phone numbers available");
    }

    await assignElevenLabsPhoneNumberToAgent(
      elevenlabsApiKey,
      available.id,
      context.targetElevenlabsAgentId
    );

    await client.mutation(api.billingWebhook.setWorkspacePhoneAssignmentFromWebhook, {
      secret: billingWebhookSecret,
      workspaceId,
      agentConfigId: context.targetAgentConfigId,
      assignedPhoneNumber: available.phoneNumber,
      elevenlabsPhoneNumberId: available.id,
    });

    return {
      action: "assigned" as const,
      phoneNumber: available.phoneNumber,
      phoneNumberId: available.id,
    };
  }

  const assignedIds = Array.from(new Set(context.assignedPhoneNumberIds ?? []));
  for (const phoneNumberId of assignedIds) {
    await unassignElevenLabsPhoneNumber(elevenlabsApiKey, phoneNumberId);
  }

  await client.mutation(api.billingWebhook.clearWorkspacePhoneAssignmentsFromWebhook, {
    secret: billingWebhookSecret,
    workspaceId,
  });

  return {
    action: "released" as const,
    releasedPhoneNumberIds: assignedIds,
  };
}
