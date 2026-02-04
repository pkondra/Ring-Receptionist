import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

const MODEL = "gpt-4o-mini";

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

  if (!transcript) {
    return NextResponse.json({ summary: "" });
  }

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
    const errorText = await response.text();
    console.error("OpenAI summary error:", errorText);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 502 }
    );
  }

  const data: {
    choices?: Array<{ message?: { content?: string } }>;
  } = await response.json();
  const summary = data.choices?.[0]?.message?.content?.trim() ?? "";

  if (summary && body.sessionId) {
    try {
      await fetchMutation(
        api.chatSessions.updateSummary,
        {
          sessionId: body.sessionId as Id<"chatSessions">,
          summary,
        },
        { token }
      );
    } catch (err) {
      console.error("Convex summary save error:", err);
    }
  }

  return NextResponse.json({ summary });
}
