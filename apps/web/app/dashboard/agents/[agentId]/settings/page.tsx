"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import QualificationGoalsEditor from "@/components/QualificationGoalsEditor";
import EmergencyProtocolEditor from "@/components/EmergencyProtocolEditor";
import type { QualificationGoal, EmergencyProtocol } from "@/lib/agentDefaults";
import { DEFAULT_VOICE_ID } from "@/lib/agentDefaults";

type ElevenLabsVoice = {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
  preview_url?: string;
  description?: string;
};

export default function AgentSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;
  const { isAuthenticated, isLoading } = useConvexAuth();

  const agent = useQuery(
    api.agentConfigs.getAgentConfig,
    isAuthenticated
      ? { agentConfigId: agentId as Id<"agentConfigs"> }
      : "skip"
  );
  const updateAgentConfig = useMutation(api.agentConfigs.updateAgentConfig);
  const setDefaultAgent = useMutation(api.agentConfigs.setDefaultAgent);

  const [agentName, setAgentName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [toneStyle, setToneStyle] = useState("");
  const [toneDescription, setToneDescription] = useState("");
  const [customContext, setCustomContext] = useState("");
  const [assignedPhoneNumber, setAssignedPhoneNumber] = useState("");
  const [elevenlabsPhoneNumberId, setElevenlabsPhoneNumberId] = useState("");
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE_ID);
  const [qualificationGoals, setQualificationGoals] = useState<
    QualificationGoal[]
  >([]);
  const [emergencyProtocol, setEmergencyProtocol] =
    useState<EmergencyProtocol>({
      triggers: [],
      instructions: "",
    });

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(
    null
  );
  const [previewError, setPreviewError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (agent) {
      setAgentName(agent.agentName);
      setBusinessName(agent.businessName);
      setToneStyle(agent.tone.style);
      setToneDescription(agent.tone.description);
      setCustomContext(agent.customContext ?? "");
      setAssignedPhoneNumber(agent.assignedPhoneNumber ?? "");
      setElevenlabsPhoneNumberId(agent.elevenlabsPhoneNumberId ?? "");
      setVoiceId(agent.voiceId ?? DEFAULT_VOICE_ID);
      setQualificationGoals(
        agent.qualificationGoals.map((g) => ({
          key: g.key,
          label: g.label,
          required: g.required,
        }))
      );
      setEmergencyProtocol({
        triggers: agent.emergencyProtocol.triggers.map((t) => ({
          keyword: t.keyword,
          action: t.action as EmergencyProtocol["triggers"][number]["action"],
        })),
        instructions: agent.emergencyProtocol.instructions,
      });
    }
  }, [agent]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    setVoicesLoading(true);
    setVoicesError(null);

    fetch("/api/elevenlabs/voices")
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load voices");
        }
        return res.json();
      })
      .then((data: { voices?: ElevenLabsVoice[] }) => {
        if (cancelled) return;
        setVoices(data.voices ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        setVoicesError(
          err instanceof Error ? err.message : "Failed to load voices"
        );
      })
      .finally(() => {
        if (!cancelled) setVoicesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (voices.length === 0) return;
    if (!voices.some((voice) => voice.voice_id === voiceId)) {
      setVoiceId(voices[0].voice_id);
    }
  }, [voices, voiceId]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewingVoiceId(null);
  }, [voiceId]);

  const handleSaveAndSync = async () => {
    if (!agent) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      await updateAgentConfig({
        agentConfigId: agent._id,
        agentName,
        businessName,
        tone: { style: toneStyle, description: toneDescription },
        customContext,
        assignedPhoneNumber: assignedPhoneNumber.trim(),
        elevenlabsPhoneNumberId: elevenlabsPhoneNumberId.trim(),
        voiceId: voiceId || DEFAULT_VOICE_ID,
        qualificationGoals,
        emergencyProtocol,
      });

      setSyncing(true);
      const res = await fetch("/api/elevenlabs/upsert-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentConfigId: agent._id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to sync with ElevenLabs");
      }

      setSaveMessage({
        type: "success",
        text: "Saved and synced to ElevenLabs",
      });
    } catch (err) {
      setSaveMessage({
        type: "error",
        text:
          err instanceof Error ? err.message : "Failed to save agent settings",
      });
    } finally {
      setSaving(false);
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!agent) return;

    setDeleting(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/elevenlabs/delete-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentConfigId: agent._id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete agent");
      }

      router.push("/dashboard/agents");
    } catch (err) {
      setSaveMessage({
        type: "error",
        text:
          err instanceof Error ? err.message : "Failed to delete agent",
      });
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSetDefault = async () => {
    if (!agent) return;
    setSettingDefault(true);
    setSaveMessage(null);
    try {
      await setDefaultAgent({ agentConfigId: agent._id });
      setSaveMessage({ type: "success", text: "Set as default agent" });
    } catch (err) {
      setSaveMessage({
        type: "error",
        text:
          err instanceof Error ? err.message : "Failed to set default agent",
      });
    } finally {
      setSettingDefault(false);
    }
  };

  const handleStopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewingVoiceId(null);
  };

  const handlePlayPreview = async () => {
    const selectedVoice = voices.find((voice) => voice.voice_id === voiceId);
    if (!selectedVoice) return;

    if (previewingVoiceId === selectedVoice.voice_id) {
      handleStopPreview();
      return;
    }

    setPreviewError(null);
    handleStopPreview();

    try {
      setPreviewingVoiceId(selectedVoice.voice_id);

      let src = selectedVoice.preview_url;
      if (!src) {
        const res = await fetch(
          `/api/elevenlabs/voice-preview?voiceId=${selectedVoice.voice_id}`
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load preview");
        }
        const blob = await res.blob();
        src = URL.createObjectURL(blob);
        previewUrlRef.current = src;
      }

      if (audioRef.current) {
        audioRef.current.src = src;
        await audioRef.current.play();
      }
    } catch (err) {
      setPreviewingVoiceId(null);
      setPreviewError(
        err instanceof Error ? err.message : "Failed to play sample"
      );
    }
  };

  if (isLoading || agent === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (agent === null) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-sm text-zinc-600">Agent not found.</p>
        <Link
          href="/dashboard/agents"
          className="text-sm text-[var(--accent)] hover:text-[var(--accent-strong)] font-medium"
        >
          Back to Agents
        </Link>
      </div>
    );
  }

  const isConnected = Boolean(agent.elevenlabsAgentId);
  const selectedVoice = voices.find((voice) => voice.voice_id === voiceId);
  const selectedMeta = selectedVoice
    ? [
        selectedVoice.category,
        ...Object.values(selectedVoice.labels ?? {}),
      ]
        .filter((value): value is string => Boolean(value))
        .slice(0, 3)
        .join(" | ")
    : "";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/agents"
          className="text-sm text-[var(--accent)] hover:text-[var(--accent-strong)] font-medium"
        >
          &larr; Back to Agents
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
          <h1 className="text-3xl font-semibold text-zinc-900 font-display">
            Agent Settings
          </h1>
          <div className="flex items-center gap-2">
            {agent.isDefault ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Default Agent
              </span>
            ) : (
              <button
                onClick={handleSetDefault}
                disabled={settingDefault}
                className="rounded-full px-3 py-1 text-xs font-medium btn-primary disabled:opacity-60 transition-colors"
              >
                {settingDefault ? "Setting..." : "Set as Default"}
              </button>
            )}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isConnected
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isConnected ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {isConnected ? "Connected" : "Not Synced"}
            </span>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="surface-card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)] flex items-center justify-center text-xs">1</span>
          Basic Info
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Agent Name
            </label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Tone Style
            </label>
            <input
              type="text"
              value={toneStyle}
              onChange={(e) => setToneStyle(e.target.value)}
              placeholder="e.g., professional"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Tone Description
            </label>
            <input
              type="text"
              value={toneDescription}
              onChange={(e) => setToneDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Voice */}
      <div className="surface-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs">2</span>
          <h2 className="text-sm font-semibold text-zinc-900">
            Phone Assignment (Optional)
          </h2>
        </div>
        <p className="text-sm text-zinc-500">
          Store the real phone number connected in ElevenLabs for this agent.
          This is optional and can be updated later.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Assigned Phone Number
            </label>
            <input
              type="text"
              value={assignedPhoneNumber}
              onChange={(e) => setAssignedPhoneNumber(e.target.value)}
              placeholder="+971501234567"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              ElevenLabs Phone Number ID
            </label>
            <input
              type="text"
              value={elevenlabsPhoneNumberId}
              onChange={(e) => setElevenlabsPhoneNumberId(e.target.value)}
              placeholder="Optional internal number id"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Voice */}
      <div className="surface-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">3</span>
          <h2 className="text-sm font-semibold text-zinc-900">Voice</h2>
        </div>
        <p className="text-sm text-zinc-500">
          Choose the ElevenLabs voice and preview how it sounds before syncing.
        </p>

        <div className="grid gap-3">
          <label className="block text-sm font-medium text-zinc-700">
            Voice Selection
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              disabled={voicesLoading || voices.length === 0}
              className="min-w-[240px] rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
            >
              {voicesLoading && (
                <option value="">Loading voices...</option>
              )}
              {!voicesLoading && voices.length === 0 && (
                <option value="">No voices available</option>
              )}
              {voices.map((voice) => {
                const meta = [
                  voice.category,
                  ...Object.values(voice.labels ?? {}),
                ]
                  .filter((value): value is string => Boolean(value))
                  .slice(0, 2)
                  .join(" | ");
                return (
                  <option key={voice.voice_id} value={voice.voice_id}>
                    {meta ? `${voice.name} - ${meta}` : voice.name}
                  </option>
                );
              })}
            </select>

            <button
              onClick={handlePlayPreview}
              disabled={!selectedVoice || voicesLoading}
              className="rounded-full px-4 py-2 text-sm font-medium btn-outline disabled:opacity-50 transition-colors"
            >
              {previewingVoiceId === selectedVoice?.voice_id
                ? "Stop Sample"
                : "Play Sample"}
            </button>
          </div>

          {selectedVoice && (
            <div className="text-xs text-zinc-500">
              {selectedMeta || selectedVoice.description || "Voice selected."}
            </div>
          )}
        </div>

        {voicesError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {voicesError}
          </div>
        )}

        {previewError && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            {previewError}
          </div>
        )}

        <audio
          ref={audioRef}
          onEnded={() => setPreviewingVoiceId(null)}
          className="hidden"
        />
      </div>

      {/* Custom Context / System Prompt */}
      <div className="surface-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs">4</span>
          Custom Context
        </h2>
        <p className="text-sm text-zinc-500">
          Add custom instructions, business details, or any context you want the agent to know.
        </p>
        <textarea
          value={customContext}
          onChange={(e) => setCustomContext(e.target.value)}
          rows={6}
          placeholder="Example: Our business hours are 8am-6pm Monday through Saturday. We offer free estimates. Emergency services are available 24/7 for storm damage..."
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all resize-none"
        />
      </div>

      {/* Qualification Goals */}
      <div className="surface-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">5</span>
          <h2 className="text-sm font-semibold text-zinc-900">Qualification Goals</h2>
        </div>
        <QualificationGoalsEditor
          goals={qualificationGoals}
          onChange={setQualificationGoals}
        />
      </div>

      {/* Emergency Protocol */}
      <div className="surface-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs">6</span>
          <h2 className="text-sm font-semibold text-zinc-900">Emergency Protocol</h2>
        </div>
        <EmergencyProtocolEditor
          protocol={emergencyProtocol}
          onChange={setEmergencyProtocol}
        />
      </div>

      {/* Knowledge Base */}
      <div className="surface-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-lg bg-yellow-100 text-yellow-700 flex items-center justify-center text-xs">7</span>
          <h2 className="text-sm font-semibold text-zinc-900">
            Knowledge Base (Shared)
          </h2>
        </div>
        <p className="text-sm text-zinc-500 mb-4">
          Manage shared knowledge that applies to every agent in this workspace.
        </p>
        <Link
          href="/dashboard/knowledge"
          className="rounded-full px-4 py-2 text-sm font-medium btn-outline transition-colors inline-flex"
        >
          Open Knowledge Base
        </Link>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div
          className={`rounded-2xl p-4 text-sm font-medium ${
            saveMessage.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Save & Sync */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveAndSync}
          disabled={saving}
          className="rounded-full px-6 py-2.5 text-sm font-medium btn-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {saving
            ? syncing
              ? "Syncing to ElevenLabs..."
              : "Saving..."
            : "Save & Sync"}
        </button>

        {isConnected && (
          <Link
            href={`/chat/${agent._id}`}
            className="rounded-full px-6 py-2.5 text-sm font-medium btn-outline transition-colors"
          >
            Open Voice Lab
          </Link>
        )}
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-red-700 mb-2">Danger Zone</h2>
        <p className="text-sm text-red-600 mb-4">
          Permanently delete this agent and all associated data. This cannot be undone.
        </p>

        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full px-4 py-2 text-sm font-medium btn-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {deleting ? "Deleting..." : "Yes, Delete Forever"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
              className="rounded-full px-4 py-2 text-sm font-medium btn-outline disabled:opacity-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-full px-4 py-2 text-sm font-medium btn-primary transition-colors cursor-pointer"
          >
            Delete Agent
          </button>
        )}
      </div>
    </div>
  );
}
