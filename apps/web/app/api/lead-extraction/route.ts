import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { ExtractedFields } from "@/lib/extractLeadFields";

const MODEL = "gpt-4o-mini";

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

type LeadMessage = {
  role: "user" | "agent";
  content: string;
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body: { messages?: LeadMessage[] } = await req.json();
  const messages = Array.isArray(body.messages) ? body.messages : [];

  if (messages.length === 0) {
    return NextResponse.json({ fields: {} });
  }

  const transcript = messages
    .slice(-40)
    .map(
      (message) =>
        `${message.role === "user" ? "Caller" : "Agent"}: ${message.content}`
    )
    .join("\n");

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

  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI extraction error:", errorText);
    return NextResponse.json(
      { error: "Failed to extract lead fields" },
      { status: 502 }
    );
  }

  const data: {
    choices?: Array<{ message?: { content?: string } }>;
  } = await response.json();

  const content = data.choices?.[0]?.message?.content ?? "{}";
  let fields: ExtractedFields = {};
  try {
    fields = JSON.parse(content) as ExtractedFields;
  } catch (err) {
    console.error("Failed to parse extraction JSON:", err);
  }

  return NextResponse.json({ fields });
}
