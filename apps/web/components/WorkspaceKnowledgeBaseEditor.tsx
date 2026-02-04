"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

interface Props {
  workspaceId: Id<"workspaces">;
  agentIds: Array<Id<"agentConfigs">>;
}

export default function WorkspaceKnowledgeBaseEditor({
  workspaceId,
  agentIds,
}: Props) {
  const entries = useQuery(api.workspaceKnowledgeEntries.listByWorkspace, {
    workspaceId,
  });
  const addEntry = useMutation(api.workspaceKnowledgeEntries.addEntry);
  const updateEntry = useMutation(api.workspaceKnowledgeEntries.updateEntry);
  const deleteEntryMutation = useMutation(
    api.workspaceKnowledgeEntries.deleteEntry
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<
    Id<"workspaceKnowledgeEntries"> | null
  >(null);
  const [editingElevenlabsId, setEditingElevenlabsId] = useState<
    string | null
  >(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<
    Id<"workspaceKnowledgeEntries"> | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [syncingAgents, setSyncingAgents] = useState(false);

  const syncAllAgents = async () => {
    if (agentIds.length === 0) return;
    setSyncingAgents(true);
    try {
      for (const agentConfigId of agentIds) {
        await fetch("/api/elevenlabs/upsert-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentConfigId }),
        });
      }
    } finally {
      setSyncingAgents(false);
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    setAdding(true);
    setError(null);

    try {
      const entryId = await addEntry({
        workspaceId,
        title: newTitle.trim(),
        content: newContent.trim(),
      });

      const res = await fetch("/api/elevenlabs/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
        }),
      });

      if (res.ok) {
        const data: { id: string } = await res.json();
        await updateEntry({
          entryId,
          elevenlabsKbId: data.id,
        });
        await syncAllAgents();
      } else {
        console.error("Failed to sync KB entry to ElevenLabs");
      }

      setNewTitle("");
      setNewContent("");
      setShowAddForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add knowledge entry"
      );
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = (entry: {
    _id: Id<"workspaceKnowledgeEntries">;
    title: string;
    content: string;
    elevenlabsKbId?: string | null;
  }) => {
    setEditingId(entry._id);
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditingElevenlabsId(entry.elevenlabsKbId ?? null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim() || !editContent.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/elevenlabs/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to sync KB entry to ElevenLabs");
      }

      const data: { id: string } = await res.json();

      if (editingElevenlabsId) {
        await fetch("/api/elevenlabs/knowledge", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kbDocId: editingElevenlabsId }),
        }).catch(console.error);
      }

      await updateEntry({
        entryId: editingId,
        title: editTitle.trim(),
        content: editContent.trim(),
        elevenlabsKbId: data.id,
      });

      await syncAllAgents();
      setEditingId(null);
      setEditingElevenlabsId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update knowledge entry"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: {
    _id: Id<"workspaceKnowledgeEntries">;
    elevenlabsKbId?: string;
  }) => {
    setDeletingId(entry._id);
    setError(null);

    try {
      if (entry.elevenlabsKbId) {
        await fetch("/api/elevenlabs/knowledge", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kbDocId: entry.elevenlabsKbId }),
        }).catch(console.error);
      }

      await deleteEntryMutation({ entryId: entry._id });
      await syncAllAgents();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete knowledge entry"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            Shared knowledge applied to every agent in this workspace.
          </p>
          {syncingAgents && (
            <p className="text-xs text-zinc-400 mt-1">Syncing agents...</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="rounded-full px-3 py-1.5 text-xs font-medium btn-primary transition-colors cursor-pointer"
        >
          + Add Entry
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Entry title"
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black/20 transition-all"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Entry content... Add FAQs, service details, pricing info, policies, etc."
            rows={5}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black/20 transition-all resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding || !newTitle.trim() || !newContent.trim()}
              className="rounded-full px-4 py-2 text-sm font-medium btn-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {adding ? "Adding..." : "Add Entry"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewTitle("");
                setNewContent("");
              }}
              className="rounded-full px-4 py-2 text-sm font-medium btn-outline transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {entries === undefined ? (
        <p className="text-sm text-zinc-400 py-4 text-center surface-muted">
          Loading entries...
        </p>
      ) : entries.length === 0 && !showAddForm ? (
        <p className="text-sm text-zinc-400 py-4 text-center surface-muted">
          No knowledge entries yet. Add entries to give every agent reference material.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry._id} className="surface-muted p-4">
              {editingId === entry._id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-black focus:ring-1 focus:ring-black/20 transition-all"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-black focus:ring-1 focus:ring-black/20 transition-all resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="rounded-full px-4 py-2 text-sm font-medium btn-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditingElevenlabsId(null);
                      }}
                      className="rounded-full px-4 py-2 text-sm font-medium btn-outline transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-zinc-900">
                        {entry.title}
                      </h4>
                      {entry.elevenlabsKbId && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          Synced
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                      {entry.content}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-3">
                    <button
                      type="button"
                      onClick={() => handleEdit(entry)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:text-black hover:bg-white transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry)}
                      disabled={deletingId === entry._id}
                      className="rounded-lg p-1.5 text-zinc-400 hover:text-black hover:bg-white disabled:opacity-50 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
