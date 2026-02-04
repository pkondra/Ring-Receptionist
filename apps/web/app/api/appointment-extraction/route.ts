import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

const MODEL = "gpt-4o-mini";

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

function normalizeString(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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

export async function POST(req: NextRequest) {
  const { getToken, userId } = await auth();
  const token = await getToken({ template: "convex" });
  if (!userId || !token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body: { transcript?: string; sessionId?: string } = await req.json();
  const transcript = body.transcript?.trim();
  const sessionId = body.sessionId?.trim();

  if (!transcript || !sessionId) {
    return NextResponse.json(
      { error: "Missing transcript or sessionId" },
      { status: 400 }
    );
  }

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
    const errorText = await response.text();
    console.error("OpenAI appointment extraction error:", errorText);
    return NextResponse.json(
      { error: "Failed to extract appointment" },
      { status: 502 }
    );
  }

  const data: {
    choices?: Array<{ message?: { content?: string } }>;
  } = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  const parsed = parseJsonPayload(raw) ?? {};

  const scheduledIso = normalizeString(parsed.scheduled_at_iso);
  const scheduledAt = scheduledIso ? Date.parse(scheduledIso) : NaN;
  const scheduledAtValue = Number.isNaN(scheduledAt)
    ? undefined
    : scheduledAt;

  const preferredWindow = normalizeString(parsed.preferred_window);
  const scheduledForText =
    normalizeString(parsed.scheduled_at_iso) ?? preferredWindow;

  try {
    await fetchMutation(
      api.appointments.upsertForSession,
      {
        sessionId: sessionId as Id<"chatSessions">,
        contactName: normalizeString(parsed.customer_name),
        phone: normalizeString(parsed.phone),
        address: normalizeString(parsed.address),
        reason: normalizeString(parsed.reason),
        scheduledAt: scheduledAtValue,
        scheduledForText: normalizeString(scheduledForText),
        notes: normalizeString(parsed.notes),
        summary: normalizeString(parsed.summary),
      },
      { token }
    );
  } catch (err) {
    console.error("Convex appointment save error:", err);
    return NextResponse.json(
      { error: "Failed to save appointment" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
