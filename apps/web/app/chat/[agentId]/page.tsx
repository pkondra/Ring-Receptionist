"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import VoiceChatLab from "@/components/VoiceChatLab";
import Link from "next/link";

export default function ChatPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const { isAuthenticated, isLoading } = useConvexAuth();

  const agentConfig = useQuery(
    api.agentConfigs.getAgentConfig,
    isAuthenticated
      ? { agentConfigId: agentId as Id<"agentConfigs"> }
      : "skip"
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (agentConfig === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-sm text-zinc-600">Agent not found.</p>
        <Link
          href="/dashboard"
          className="text-sm text-[var(--accent)] hover:text-[var(--accent-strong)] font-medium"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (agentConfig === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-zinc-500">Loading agent...</p>
      </div>
    );
  }

  if (!agentConfig.elevenlabsAgentId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-center">
          <p className="text-zinc-600 font-medium">Agent not connected</p>
          <p className="text-sm text-zinc-400 mt-1">
            Go to Agent Settings and click &quot;Save &amp; Sync&quot; first.
          </p>
        </div>
        <Link
          href={`/dashboard/agents/${agentId}/settings`}
          className="text-sm text-[var(--accent)] hover:text-[var(--accent-strong)] font-medium"
        >
          Go to Agent Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="mx-6 mt-5 surface-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-[var(--accent)] hover:text-[var(--accent-strong)] font-medium"
          >
            &larr; Dashboard
          </Link>
          <span className="text-sm font-semibold text-zinc-900">
            Voice Chat Lab
          </span>
        </div>
      </div>

      {/* Chat lab */}
      <div className="flex-1 p-6 min-h-0">
        <VoiceChatLab
          agentConfigId={agentConfig._id}
          agentName={agentConfig.agentName}
          businessName={agentConfig.businessName}
        />
      </div>
    </div>
  );
}
