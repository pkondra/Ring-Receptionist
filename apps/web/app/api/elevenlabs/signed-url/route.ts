import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export async function GET(req: NextRequest) {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const agentConfigId = req.nextUrl.searchParams.get("agentId");
  if (!agentConfigId) {
    return NextResponse.json(
      { error: "Missing agentId parameter" },
      { status: 400 }
    );
  }

  const agentConfig = await fetchQuery(
    api.agentConfigs.getAgentConfig,
    { agentConfigId: agentConfigId as Id<"agentConfigs"> },
    { token }
  );

  if (!agentConfig) {
    return NextResponse.json(
      { error: "Agent config not found" },
      { status: 404 }
    );
  }

  if (!agentConfig.elevenlabsAgentId) {
    return NextResponse.json(
      { error: "Agent not connected to ElevenLabs. Save agent settings first." },
      { status: 400 }
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY not configured" },
      { status: 500 }
    );
  }

  const elResponse = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentConfig.elevenlabsAgentId}`,
    {
      method: "GET",
      headers: { "xi-api-key": apiKey },
    }
  );

  if (!elResponse.ok) {
    const errorText = await elResponse.text();
    console.error("ElevenLabs signed URL error:", errorText);
    return NextResponse.json(
      { error: "Failed to get signed URL from ElevenLabs" },
      { status: 502 }
    );
  }

  const data: { signed_url: string } = await elResponse.json();
  return NextResponse.json({ signedUrl: data.signed_url });
}
