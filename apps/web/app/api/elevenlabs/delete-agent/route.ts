import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export async function POST(req: NextRequest) {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body: { agentConfigId: string } = await req.json();
  if (!body.agentConfigId) {
    return NextResponse.json(
      { error: "Missing agentConfigId" },
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

  // Fetch the agent config to get the ElevenLabs agent ID
  const agentConfig = await fetchQuery(
    api.agentConfigs.getAgentConfig,
    { agentConfigId: body.agentConfigId as Id<"agentConfigs"> },
    { token }
  );

  if (!agentConfig) {
    return NextResponse.json(
      { error: "Agent config not found" },
      { status: 404 }
    );
  }

  // Delete the ElevenLabs agent if it exists
  if (agentConfig.elevenlabsAgentId) {
    const deleteRes = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${agentConfig.elevenlabsAgentId}`,
      {
        method: "DELETE",
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!deleteRes.ok) {
      const errorText = await deleteRes.text();
      console.error("ElevenLabs delete agent error:", errorText);
      // Continue with Convex cleanup even if ElevenLabs delete fails
    }
  }

  // Delete knowledge base entries from ElevenLabs
  const kbEntries = await fetchQuery(
    api.knowledgeEntries.listByAgent,
    { agentConfigId: body.agentConfigId as Id<"agentConfigs"> },
    { token }
  );

  for (const entry of kbEntries) {
    if (entry.elevenlabsKbId) {
      await fetch(
        `https://api.elevenlabs.io/v1/convai/knowledge-base/${encodeURIComponent(
          entry.elevenlabsKbId
        )}?force=true`,
        {
          method: "DELETE",
          headers: { "xi-api-key": apiKey },
        }
      ).catch((err) => console.error("Failed to delete KB entry:", err));
    }
  }

  // Cascade delete in Convex (agent config + knowledge entries + sessions + messages)
  await fetchMutation(
    api.agentConfigs.deleteAgent,
    { agentConfigId: body.agentConfigId as Id<"agentConfigs"> },
    { token }
  );

  return NextResponse.json({ success: true });
}
