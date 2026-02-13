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

const UNASSIGNED_AGENT_MARKERS = new Set([
  "no agent",
  "no agent assigned",
  "none",
  "unassigned",
  "null",
  "n/a",
  "na",
]);

function asRecord(value: unknown) {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function normalizeString(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value}`;
  }
  return null;
}

function normalizeAssignedAgentId(value: unknown) {
  const trimmed = normalizeString(value);
  if (!trimmed) return null;
  if (UNASSIGNED_AGENT_MARKERS.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

function extractPhoneRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  const prioritized = [
    record.phone_numbers,
    record.phoneNumbers,
    record.numbers,
    record.items,
    record.data,
    record.results,
  ];

  const collected: unknown[] = [];

  for (const candidate of prioritized) {
    if (Array.isArray(candidate)) {
      collected.push(...candidate);
    }
  }

  if (collected.length > 0) {
    return collected;
  }

  // Fallback for nested API wrappers and unknown response shapes.
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      collected.push(...value);
      continue;
    }
    if (value && typeof value === "object") {
      const nested = extractPhoneRows(value);
      if (nested.length > 0) collected.push(...nested);
    }
  }

  return collected;
}

function getNextCursor(payload: unknown) {
  const record = asRecord(payload);
  if (!record) return null;

  const page = asRecord(record.page);
  const meta = asRecord(record.meta);
  const pagination = asRecord(record.pagination);

  const candidates = [
    record.next_cursor,
    record.nextCursor,
    record.cursor,
    page?.next_cursor,
    page?.nextCursor,
    meta?.next_cursor,
    meta?.nextCursor,
    pagination?.next_cursor,
    pagination?.nextCursor,
  ];

  for (const candidate of candidates) {
    const value = normalizeString(candidate);
    if (value) return value;
  }
  return null;
}

function normalizeElevenLabsPhone(row: unknown): ElevenLabsPhoneNumber | null {
  const record = asRecord(row);
  if (!record) return null;

  const nestedAssignedAgent = asRecord(record.assigned_agent);
  const nestedAgent = asRecord(record.agent);
  const nestedPhoneObjects = [
    asRecord(record.phone),
    asRecord(record.phone_number),
    asRecord(record.phoneNumber),
    asRecord(record.twilio),
    asRecord(record.sip_trunk),
    asRecord(record.sipTrunk),
  ].filter((value): value is Record<string, unknown> => Boolean(value));

  const idCandidates = [
    record.phone_number_id,
    record.phoneNumberId,
    record.phone_sid,
    record.phoneSid,
    record.twilio_phone_number_sid,
    record.twilioPhoneNumberSid,
    record.id,
    ...nestedPhoneObjects.flatMap((phoneRecord) => [
      phoneRecord.id,
      phoneRecord.phone_number_id,
      phoneRecord.phoneNumberId,
      phoneRecord.phone_sid,
      phoneRecord.phoneSid,
      phoneRecord.twilio_phone_number_sid,
      phoneRecord.twilioPhoneNumberSid,
      phoneRecord.sid,
    ]),
  ];
  const phoneCandidates = [
    record.phone_number,
    record.phoneNumber,
    record.number,
    record.phone,
    record.e164_phone_number,
    record.e164PhoneNumber,
    record.display_phone_number,
    record.displayPhoneNumber,
    ...nestedPhoneObjects.flatMap((phoneRecord) => [
      phoneRecord.phone_number,
      phoneRecord.phoneNumber,
      phoneRecord.number,
      phoneRecord.phone,
      phoneRecord.e164_phone_number,
      phoneRecord.e164PhoneNumber,
      phoneRecord.display_phone_number,
      phoneRecord.displayPhoneNumber,
    ]),
  ];
  const assignedAgentCandidates = [
    record.assigned_agent_id,
    record.assignedAgentId,
    record.agent_id,
    record.agentId,
    record.agent,
    nestedAssignedAgent?.agent_id,
    nestedAssignedAgent?.agentId,
    nestedAssignedAgent?.id,
    nestedAssignedAgent?.name,
    nestedAgent?.agent_id,
    nestedAgent?.agentId,
    nestedAgent?.id,
    nestedAgent?.name,
  ];

  const id =
    idCandidates
      .map(normalizeString)
      .find((value): value is string => Boolean(value)) ?? null;
  if (!id) return null;

  const phoneNumber =
    phoneCandidates.find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0
    ) ?? null;

  const assignedAgentId =
    assignedAgentCandidates
      .map(normalizeAssignedAgentId)
      .find((value): value is string => Boolean(value)) ?? null;

  return { id, phoneNumber, assignedAgentId };
}

async function listElevenLabsPhoneNumbers(apiKey: string) {
  const parsedNumbers = new Map<string, ElevenLabsPhoneNumber>();
  const maxPages = 10;
  let cursor: string | null = null;

  for (let page = 0; page < maxPages; page += 1) {
    const url = new URL("https://api.elevenlabs.io/v1/convai/phone-numbers");
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    const response = await fetch(url.toString(), {
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
      [key: string]: unknown;
    };

    const rows = extractPhoneRows(payload);
    for (const row of rows) {
      const normalized = normalizeElevenLabsPhone(row);
      if (normalized) {
        parsedNumbers.set(normalized.id, normalized);
      }
    }

    const nextCursor = getNextCursor(payload);
    if (!nextCursor || nextCursor === cursor) break;
    cursor = nextCursor;
  }

  const numbers = Array.from(parsedNumbers.values());
  if (numbers.length === 0) {
    console.warn(
      "[elevenlabsPhonePool] Parsed zero phone numbers from ElevenLabs response."
    );
  }

  return numbers;
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
      Boolean(number.phoneNumber) &&
      !alreadyTrackedIds.has(number.id)
  );

  const reclaimable = numbers.find(
    (number) =>
      !number.assignedAgentId &&
      Boolean(number.phoneNumber) &&
      alreadyTrackedIds.has(number.id)
  );

  const target = available ?? reclaimable;

  if (!target || !target.phoneNumber) {
    throw new Error(
      `No unassigned ElevenLabs phone numbers available (found ${numbers.length} total)`
    );
  }

  await assignElevenLabsPhoneNumberToAgent(
    elevenlabsApiKey,
    target.id,
    elevenlabsAgentId
  );

  await client.mutation(api.billingWebhook.setWorkspacePhoneAssignmentFromWebhook, {
    secret: billingWebhookSecret,
    workspaceId,
    agentConfigId,
    assignedPhoneNumber: target.phoneNumber,
    elevenlabsPhoneNumberId: target.id,
  });

  return {
    action: "assigned" as const,
    reused: false,
    phoneNumber: target.phoneNumber,
    phoneNumberId: target.id,
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

  const assignedIds = Array.from(
    new Set(
      (context.assignedPhoneNumberIds ?? []).filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0
      )
    )
  );
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
