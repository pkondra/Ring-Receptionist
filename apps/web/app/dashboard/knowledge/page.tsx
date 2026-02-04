"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import WorkspaceKnowledgeBaseEditor from "@/components/WorkspaceKnowledgeBaseEditor";

export default function KnowledgeBasePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const workspace = useQuery(
    api.workspaces.getMyWorkspace,
    isAuthenticated ? {} : "skip"
  );
  const agents = useQuery(
    api.agentConfigs.listAgents,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  if (isLoading || workspace === undefined || agents === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-500">Workspace not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-zinc-900 font-display">
          Knowledge Base
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Shared knowledge applied to every agent in this workspace.
        </p>
      </div>

      <div className="surface-card p-6">
        <WorkspaceKnowledgeBaseEditor
          workspaceId={workspace._id}
          agentIds={agents.map((agent) => agent._id)}
        />
      </div>
    </div>
  );
}
