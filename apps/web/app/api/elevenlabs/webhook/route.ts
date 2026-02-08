import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "gpt-4o-mini";
const SIGNATURE_TOLERANCE_SECONDS = 30 * 60;

type TranscriptMessage = {
  role: "user" | "agent";
  content: string;
  timestamp?: number;
};

type ExtractedFields = {
  callerName?: string;
  phone?: string;
  address?: string;
  reason?: string;
  numberOfTrees?: string;
  sizeEstimate?: string;
  urgency?: string;
  hazards?: string;
  accessConstraints?: string;
  preferredWindow?: string;
};

type AppointmentExtraction = {
  customer_name?: string;
  phone?: string;
  address?: string;
  reason?: string;
  preferred_window?: string;
  scheduled_at_iso?: string;
  timezone?: string;
  notes?: string;
  summary?: string;
};

const leadFieldsSchema = {
  name: "lead_fields",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      callerName: { type: ["string", "null"] },
      phone: { type: ["string", "null"] },
      address: { type: ["string", "null"] },
      reason: { type: ["string", "null"] },
      numberOfTrees: { type: ["string", "null"] },
      sizeEstimate: { type: ["string", "null"] },
      urgency: { type: ["string", "null"] },
      hazards: { type: ["string", "null"] },
      accessConstraints: { type: ["string", "null"] },
      preferredWindow: { type: ["string", "null"] },
    },
    required: [
      "callerName",
      "phone",
      "address",
      "reason",
      "numberOfTrees",
      "sizeEstimate",
      "urgency",
      "hazards",
      "accessConstraints",
      "preferredWindow",
    ],
  },
  strict: true,
};

function normalizeString(value?: string | null) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseSignatureHeader(signatureHeader: string) {
  const parts = signatureHeader
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  let timestamp: string | null = null;
  let signature: string | null = null;

  for (const part of parts) {
    const [key, value] = part.split("=", 2);
    if (key === "t" && value) timestamp = value;
    if (key === "v0" && value) signature = value;
  }

  if (!timestamp || !signature) return null;
  return { timestamp, signature };
}

function verifyElevenLabsSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
) {
  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) return false;

  const timestampSeconds = Number(parsed.timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds);
  if (ageSeconds > SIGNATURE_TOLERANCE_SECONDS) return false;

  const signedPayload = `${parsed.timestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  const actual = Buffer.from(parsed.signature.toLowerCase(), "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

function toMessages(
  transcript: unknown,
  startTimeUnixSeconds?: number
): TranscriptMessage[] {
  if (!Array.isArray(transcript)) return [];

  const messages: TranscriptMessage[] = [];
  for (const turn of transcript) {
    if (!turn || typeof turn !== "object") continue;
    const row = turn as Record<string, unknown>;
    const roleValue =
      typeof row.role === "string" ? row.role.toLowerCase() : "";
    const role: "user" | "agent" =
      roleValue.includes("agent") || roleValue.includes("assistant")
        ? "agent"
        : "user";

    const contentRaw =
      (typeof row.message === "string" && row.message) ||
      (typeof row.text === "string" && row.text) ||
      (typeof row.content === "string" && row.content) ||
      "";
    const content = contentRaw.trim();
    if (!content) continue;

    let timestamp: number | undefined;
    if (typeof row.time_in_call_secs === "number" && startTimeUnixSeconds) {
      timestamp = (startTimeUnixSeconds + row.time_in_call_secs) * 1000;
    } else if (typeof row.created_at_unix_secs === "number") {
      timestamp = row.created_at_unix_secs * 1000;
    }

    messages.push({ role, content, timestamp });
  }

  return messages;
}

function toTranscript(messages: TranscriptMessage[]) {
  return messages
    .map((msg) => `${msg.role === "user" ? "Caller" : "Agent"}: ${msg.content}`)
    .join("\n");
}

function parseJsonPayload(raw: string): AppointmentExtraction | null {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeFields(fields: ExtractedFields): ExtractedFields {
  const normalized: ExtractedFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    normalized[key as keyof ExtractedFields] = trimmed;
  }
  return normalized;
}

function buildMemoryFacts(fields: ExtractedFields) {
  const facts: Array<{ key: string; value: string }> = [];
  if (fields.callerName) facts.push({ key: "Name", value: fields.callerName });
  if (fields.phone) facts.push({ key: "Phone", value: fields.phone });
  if (fields.address) facts.push({ key: "Address", value: fields.address });
  if (fields.reason) facts.push({ key: "Service", value: fields.reason });
  if (fields.numberOfTrees)
    facts.push({ key: "Job Count", value: fields.numberOfTrees });
  if (fields.sizeEstimate)
    facts.push({ key: "Size / Scope", value: fields.sizeEstimate });
  if (fields.urgency) facts.push({ key: "Urgency", value: fields.urgency });
  if (fields.hazards) facts.push({ key: "Hazards", value: fields.hazards });
  if (fields.accessConstraints)
    facts.push({ key: "Access", value: fields.accessConstraints });
  if (fields.preferredWindow)
    facts.push({ key: "Window", value: fields.preferredWindow });
  return facts;
}

async function summarizeCall(transcript: string, apiKey: string) {
  const payload = {
    model: MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "Summarize the call in 4-5 concise lines. Each line should be a short sentence. No bullet characters.",
      },
      {
        role: "user",
        content: `Transcript:\n${transcript}`,
      },
    ],
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Summary request failed (${response.status})`);
  }

  const data: {
    choices?: Array<{ message?: { content?: string } }>;
  } = await response.json();

  return normalizeString(data.choices?.[0]?.message?.content) ?? "";
}

async function extractLeadFields(transcript: string, apiKey: string) {
  const payload = {
    model: MODEL,
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: leadFieldsSchema,
    },
    messages: [
      {
        role: "system",
        content:
          "Extract structured lead details from the transcript. Return null for any field not explicitly provided or confidently inferred. Keep values concise. For numberOfTrees, return the job count or units mentioned (trees, rooms, items, trucks, loads, etc.).",
      },
      {
        role: "user",
        content: `Transcript:\n${transcript}`,
      },
    ],
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Lead extraction failed (${response.status})`);
  }

  const data: {
    choices?: Array<{ message?: { content?: string } }>;
  } = await response.json();

  const content = data.choices?.[0]?.message?.content ?? "{}";
  let fields: ExtractedFields = {};
  try {
    fields = JSON.parse(content) as ExtractedFields;
  } catch {
    fields = {};
  }

  return normalizeFields(fields);
}

async function extractAppointment(transcript: string, apiKey: string) {
  const payload = {
    model: MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "Extract appointment details from the transcript. Return STRICT JSON with these keys: customer_name, phone, address, reason, preferred_window, scheduled_at_iso, timezone, notes, summary. If a field is unknown, return an empty string. scheduled_at_iso should be ISO 8601 if a specific date/time is mentioned. summary should be 1-2 sentences.",
      },
      {
        role: "user",
        content: `Transcript:\n${transcript}`,
      },
    ],
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Appointment extraction failed (${response.status})`);
  }

  const data: {
    choices?: Array<{ message?: { content?: string } }>;
  } = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? "";

  return parseJsonPayload(raw) ?? {};
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!webhookSecret || !convexUrl) {
    return NextResponse.json(
      { error: "Missing ElevenLabs webhook configuration" },
      { status: 500 }
    );
  }

  const signatureHeader = req.headers.get("elevenlabs-signature");
  if (!signatureHeader) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  if (!verifyElevenLabsSignature(rawBody, signatureHeader, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const eventType =
    typeof payload.type === "string"
      ? payload.type
      : typeof payload.event_type === "string"
        ? payload.event_type
        : "";

  if (eventType !== "post_call_transcription") {
    return NextResponse.json({ success: true, ignored: eventType || "unknown" });
  }

  const data =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : null;
  if (!data) {
    return NextResponse.json({ success: true, ignored: "missing_data" });
  }

  const agentId = normalizeString(
    (data.agent_id as string | undefined) ?? (data.agentId as string | undefined)
  );
  const conversationId = normalizeString(
    (data.conversation_id as string | undefined) ??
      (data.conversationId as string | undefined) ??
      (data.call_id as string | undefined)
  );
  if (!agentId || !conversationId) {
    return NextResponse.json(
      { error: "Missing agent_id or conversation_id" },
      { status: 400 }
    );
  }

  const metadata =
    data.metadata && typeof data.metadata === "object"
      ? (data.metadata as Record<string, unknown>)
      : {};
  const phoneCallMeta =
    metadata.phone_call && typeof metadata.phone_call === "object"
      ? (metadata.phone_call as Record<string, unknown>)
      : {};

  const calledPhoneNumber = normalizeString(
    (phoneCallMeta.to_number as string | undefined) ??
      (metadata.to_number as string | undefined)
  );
  const callerPhone = normalizeString(
    (phoneCallMeta.from_number as string | undefined) ??
      (metadata.from_number as string | undefined) ??
      (data.caller_phone as string | undefined)
  );

  const startTimeUnixSeconds =
    typeof metadata.start_time_unix_secs === "number"
      ? metadata.start_time_unix_secs
      : undefined;
  const durationSeconds =
    typeof metadata.call_duration_secs === "number"
      ? metadata.call_duration_secs
      : undefined;
  const startedAt = startTimeUnixSeconds
    ? startTimeUnixSeconds * 1000
    : Date.now();
  const endedAt = durationSeconds
    ? startedAt + durationSeconds * 1000
    : Date.now();

  const messages = toMessages(data.transcript, startTimeUnixSeconds);
  const transcript = toTranscript(messages);

  const client = new ConvexHttpClient(convexUrl);
  const sessionId = await client.mutation(api.chatSessions.upsertSessionFromWebhook, {
    secret: webhookSecret,
    elevenlabsAgentId: agentId,
    externalCallId: conversationId,
    callerPhone,
    calledPhoneNumber,
    startedAt,
    endedAt,
  });

  if (messages.length > 0) {
    await client.mutation(api.chatMessages.replaceMessagesFromWebhook, {
      secret: webhookSecret,
      sessionId,
      messages,
    });
  }

  const analysis =
    data.analysis && typeof data.analysis === "object"
      ? (data.analysis as Record<string, unknown>)
      : {};
  let summary =
    normalizeString(
      (analysis.transcript_summary as string | undefined) ??
        (analysis.summary as string | undefined)
    ) ?? "";
  let extractedFields: ExtractedFields = {};
  let memoryFacts: Array<{ key: string; value: string }> = [];

  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (transcript && openAiApiKey) {
    if (!summary) {
      try {
        summary = await summarizeCall(transcript, openAiApiKey);
      } catch (error) {
        console.error("Webhook summary generation error:", error);
      }
    }

    try {
      extractedFields = await extractLeadFields(transcript, openAiApiKey);
      memoryFacts = buildMemoryFacts(extractedFields);
    } catch (error) {
      console.error("Webhook lead extraction error:", error);
    }

    try {
      const appointmentResult = await extractAppointment(transcript, openAiApiKey);
      const scheduledIso = normalizeString(appointmentResult.scheduled_at_iso);
      const scheduledAt = scheduledIso ? Date.parse(scheduledIso) : NaN;
      const scheduledAtValue = Number.isNaN(scheduledAt)
        ? undefined
        : scheduledAt;
      const preferredWindow = normalizeString(appointmentResult.preferred_window);
      const scheduledForText = normalizeString(scheduledIso) ?? preferredWindow;

      await client.mutation(api.appointments.upsertForSessionFromWebhook, {
        secret: webhookSecret,
        sessionId: sessionId as Id<"chatSessions">,
        contactName: normalizeString(appointmentResult.customer_name),
        phone: normalizeString(appointmentResult.phone),
        address: normalizeString(appointmentResult.address),
        reason: normalizeString(appointmentResult.reason),
        scheduledAt: scheduledAtValue,
        scheduledForText,
        notes: normalizeString(appointmentResult.notes),
        summary: normalizeString(appointmentResult.summary),
      });
    } catch (error) {
      console.error("Webhook appointment extraction error:", error);
    }
  }

  await client.mutation(api.chatSessions.finalizeSessionFromWebhook, {
    secret: webhookSecret,
    sessionId,
    endedAt,
    summary: summary || undefined,
    extractedFields: Object.keys(extractedFields).length ? extractedFields : undefined,
    memoryFacts: memoryFacts.length ? memoryFacts : undefined,
  });

  return NextResponse.json({ success: true, sessionId });
}
