import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { DEFAULT_VOICE_ID } from "@/lib/agentDefaults";

interface AgentConfig {
  _id: Id<"agentConfigs">;
  workspaceId: Id<"workspaces">;
  agentName: string;
  businessName: string;
  tone: { style: string; description: string };
  customContext?: string;
  voiceId?: string;
  qualificationGoals: Array<{
    key: string;
    label: string;
    required: boolean;
  }>;
  emergencyProtocol: {
    triggers: Array<{ keyword: string; action: string }>;
    instructions: string;
  };
  elevenlabsAgentId?: string;
}

function buildSystemPrompt(config: AgentConfig, kbContext: string): string {
  const goals = config.qualificationGoals
    .map(
      (g) => `- ${g.label}${g.required ? " (required)" : " (if mentioned)"}`
    )
    .join("\n");

  const triggers = config.emergencyProtocol.triggers
    .map((t) => `- "${t.keyword}" → ${t.action}`)
    .join("\n");

  const customContext = config.customContext?.trim()
    ? `\nCUSTOM CONTEXT:\n${config.customContext.trim()}\n`
    : "";

  const knowledgeContext = kbContext
    ? `\nKNOWLEDGE BASE NOTES (use these facts when relevant):\n${kbContext}\n`
    : "\nKNOWLEDGE BASE: Use the attached knowledge base for business details and FAQs.\n";

  return `You are ${config.agentName}, an AI phone receptionist for ${config.businessName}.

TONE: ${config.tone.style} — ${config.tone.description}

YOUR GOAL: Qualify the caller by naturally gathering the following information through conversation:
${goals}

${customContext}
${knowledgeContext}

CONVERSATION RULES:
- Greet the caller warmly and ask how you can help.
- Ask questions one at a time. Do not overwhelm the caller.
- If the caller volunteers information, acknowledge it and move on.
- Always confirm the caller's phone number and address.
- Do not end the call unless the caller clearly asks to end or says goodbye. If there is silence, ask once if they are still there and wait.
- Summarize what you've gathered before ending the call.

EMERGENCY PROTOCOL:
${triggers}

${config.emergencyProtocol.instructions}

If you detect an emergency situation, express concern, gather critical details quickly, and let the caller know someone will be in touch immediately.`;
}

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

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY not configured" },
      { status: 500 }
    );
  }

  // Fetch knowledge entries for this agent
  const kbEntries = await fetchQuery(
    api.knowledgeEntries.listByAgent,
    { agentConfigId: body.agentConfigId as Id<"agentConfigs"> },
    { token }
  );

  // Fetch shared knowledge entries for the workspace
  const workspaceKbEntries = await fetchQuery(
    api.workspaceKnowledgeEntries.listByWorkspace,
    { workspaceId: (agentConfig as AgentConfig).workspaceId },
    { token }
  );

  const allKbEntries = [...kbEntries, ...workspaceKbEntries].filter(
    (entry) => entry.title && entry.content
  );
  const kbContextRaw = allKbEntries
    .map((entry) => `- ${entry.title}: ${entry.content}`)
    .join("\n");
  const kbContext =
    kbContextRaw.length > 3000
      ? `${kbContextRaw.slice(0, 3000)}\n- (Additional knowledge entries omitted for brevity.)`
      : kbContextRaw;

  const systemPrompt = buildSystemPrompt(agentConfig as AgentConfig, kbContext);
  const firstMessage = `Hello! Thank you for calling ${agentConfig.businessName}. My name is ${agentConfig.agentName}. How can I help you today?`;

  // Build knowledge_base array from entries that have been synced to ElevenLabs
  const knowledgeBaseMap = new Map<string, { type: string; name: string; id: string; usage_mode: string }>();

  for (const entry of kbEntries) {
    if (entry.elevenlabsKbId) {
      knowledgeBaseMap.set(entry.elevenlabsKbId, {
        type: "text",
        name: entry.title,
        id: entry.elevenlabsKbId,
        usage_mode: "auto",
      });
    }
  }

  for (const entry of workspaceKbEntries) {
    if (entry.elevenlabsKbId) {
      knowledgeBaseMap.set(entry.elevenlabsKbId, {
        type: "text",
        name: entry.title,
        id: entry.elevenlabsKbId,
        usage_mode: "auto",
      });
    }
  }

  const knowledgeBase = Array.from(knowledgeBaseMap.values());

  const agentPayload: Record<string, unknown> = {
    conversation_config: {
      agent: {
        prompt: {
          prompt: systemPrompt,
        },
        first_message: firstMessage,
        language: "en",
      },
      tts: {
        voice_id: agentConfig.voiceId || DEFAULT_VOICE_ID,
      },
    },
    name: `${agentConfig.agentName} - ${agentConfig.businessName}`,
  };

  if (knowledgeBase.length > 0) {
    agentPayload.knowledge_base = knowledgeBase;
  }

  let elevenlabsAgentId: string;

  if (agentConfig.elevenlabsAgentId) {
    // Update existing agent
    const updateRes = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${agentConfig.elevenlabsAgentId}`,
      {
        method: "PATCH",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agentPayload),
      }
    );

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      console.error("ElevenLabs update agent error:", errorText);
      return NextResponse.json(
        { error: "Failed to update ElevenLabs agent" },
        { status: 502 }
      );
    }

    elevenlabsAgentId = agentConfig.elevenlabsAgentId;
  } else {
    // Create new agent
    const createRes = await fetch(
      "https://api.elevenlabs.io/v1/convai/agents/create",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agentPayload),
      }
    );

    if (!createRes.ok) {
      const errorText = await createRes.text();
      console.error("ElevenLabs create agent error:", errorText);
      return NextResponse.json(
        { error: "Failed to create ElevenLabs agent" },
        { status: 502 }
      );
    }

    const created: { agent_id: string } = await createRes.json();
    elevenlabsAgentId = created.agent_id;
  }

  // Store the elevenlabs agent ID in Convex
  await fetchMutation(
    api.agentConfigs.setElevenLabsAgentId,
    {
      agentConfigId: body.agentConfigId as Id<"agentConfigs">,
      elevenlabsAgentId,
    },
    { token }
  );

  return NextResponse.json({
    success: true,
    elevenlabsAgentId,
  });
}
