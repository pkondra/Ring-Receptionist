"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import TranscriptFeed from "./TranscriptFeed";
import LeadFieldsPanel from "./LeadFieldsPanel";
import MemoryFactsPanel from "./MemoryFactsPanel";
import {
  extractLeadFieldsWithAI,
  type ExtractedFields,
  type LeadMessage,
} from "@/lib/extractLeadFields";

type Message = LeadMessage;

interface MemoryFact {
  key: string;
  value: string;
}

interface VoiceChatLabProps {
  agentConfigId: Id<"agentConfigs">;
  agentName: string;
  businessName: string;
}

type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected";

export default function VoiceChatLab({
  agentConfigId,
  agentName,
  businessName,
}: VoiceChatLabProps) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [fields, setFields] = useState<ExtractedFields>({});
  const [memoryFacts, setMemoryFacts] = useState<MemoryFact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<Id<"chatSessions"> | null>(null);
  const [agentMode, setAgentMode] = useState<"listening" | "speaking">(
    "listening"
  );
  const extractionRunRef = useRef(0);
  const extractionTimerRef = useRef<number | null>(null);
  const extractionAbortRef = useRef<AbortController | null>(null);

  const conversationRef = useRef<{ endSession: () => Promise<void> } | null>(
    null
  );

  const createSession = useMutation(api.chatSessions.createSession);
  const endSessionMutation = useMutation(api.chatSessions.endSession);
  const addMessage = useMutation(api.chatMessages.addMessage);
  const updateExtractedFields = useMutation(
    api.chatSessions.updateExtractedFields
  );
  const updateMemoryFacts = useMutation(api.chatSessions.updateMemoryFacts);

  useEffect(() => {
    const newFacts: MemoryFact[] = [];
    if (fields.callerName)
      newFacts.push({ key: "Name", value: fields.callerName });
    if (fields.phone) newFacts.push({ key: "Phone", value: fields.phone });
    if (fields.address) newFacts.push({ key: "Address", value: fields.address });
    if (fields.reason) newFacts.push({ key: "Reason", value: fields.reason });
    if (fields.numberOfTrees)
      newFacts.push({ key: "Trees", value: fields.numberOfTrees });
    if (fields.sizeEstimate)
      newFacts.push({ key: "Size", value: fields.sizeEstimate });
    if (fields.urgency) newFacts.push({ key: "Urgency", value: fields.urgency });
    if (fields.hazards) newFacts.push({ key: "Hazards", value: fields.hazards });
    if (fields.accessConstraints)
      newFacts.push({ key: "Access", value: fields.accessConstraints });
    if (fields.preferredWindow)
      newFacts.push({ key: "Window", value: fields.preferredWindow });
    setMemoryFacts(newFacts);
  }, [fields]);

  const queueExtraction = useCallback((messages: LeadMessage[]) => {
    if (extractionTimerRef.current) {
      window.clearTimeout(extractionTimerRef.current);
    }

    extractionTimerRef.current = window.setTimeout(async () => {
      extractionAbortRef.current?.abort();
      const controller = new AbortController();
      extractionAbortRef.current = controller;

      const runId = ++extractionRunRef.current;

      try {
        const extracted = await extractLeadFieldsWithAI(messages, {
          signal: controller.signal,
        });
        if (runId === extractionRunRef.current) {
          setFields(extracted);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Lead extraction error:", err);
      }
    }, 900);
  }, []);

  const handleStart = useCallback(async () => {
    setError(null);
    setStatus("connecting");
    setMessages([]);
    setFields({});
    setMemoryFacts([]);

    try {
      const newSessionId = await createSession({ agentConfigId });
      setSessionId(newSessionId);

      const { Conversation } = await import("@elevenlabs/client");

      const baseCallbacks = {
        onMessage: (payload: {
          message: string;
          source: "user" | "ai";
          role: "user" | "agent";
        }) => {
          const role = payload.role;
          const newMsg: Message = { role, content: payload.message };

          setMessages((prev) => {
            const updated = [...prev, newMsg];
            if (payload.role === "user") {
              queueExtraction(updated);
            }
            return updated;
          });

          addMessage({
            sessionId: newSessionId,
            role,
            content: payload.message,
          }).catch(console.error);
        },
        onStatusChange: (prop: {
          status: "connected" | "connecting" | "disconnected" | "disconnecting";
        }) => {
          if (prop.status === "connected") {
            setStatus("connected");
          } else if (
            prop.status === "disconnected" ||
            prop.status === "disconnecting"
          ) {
            setStatus("disconnected");
          }
        },
        onModeChange: (prop: { mode: "speaking" | "listening" }) => {
          setAgentMode(prop.mode);
        },
        onError: (message: string, details?: Record<string, unknown>) => {
          console.error("Conversation error:", message, details);
          setError(message || "Conversation error");
          setStatus("disconnected");
        },
        onDisconnect: (details?: {
          reason?: string;
          message?: string;
          closeCode?: number;
          closeReason?: string;
        }) => {
          if (details?.message || details?.closeReason) {
            setError(
              details.message ??
                details.closeReason ??
                "Conversation disconnected"
            );
          }
          console.warn("Conversation disconnected:", details);
        },
      };

      const res = await fetch(
        `/api/elevenlabs/signed-url?agentId=${agentConfigId}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to get signed URL");
      }
      const { signedUrl } = await res.json();
      const conversation = await Conversation.startSession({
        signedUrl,
        connectionType: "websocket",
        ...baseCallbacks,
      });

      conversationRef.current = conversation;
      setStatus("connected");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start conversation";
      setError(message);
      setStatus("idle");
    }
  }, [agentConfigId, createSession, addMessage, queueExtraction]);

  const handleStop = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }

    if (sessionId) {
      if (extractionTimerRef.current) {
        window.clearTimeout(extractionTimerRef.current);
      }
      extractionAbortRef.current?.abort();

      let finalFields = fields;
      if (messages.length > 0) {
        try {
          finalFields = await extractLeadFieldsWithAI(messages);
          setFields(finalFields);
        } catch (err) {
          console.error("Final lead extraction error:", err);
        }
      }

      endSessionMutation({
        sessionId,
        summary: `Voice chat session with ${agentName}`,
      }).catch(console.error);

      if (Object.values(finalFields).some(Boolean)) {
        updateExtractedFields({
          sessionId,
          extractedFields: finalFields,
        }).catch(console.error);
      }

      if (memoryFacts.length > 0) {
        updateMemoryFacts({
          sessionId,
          memoryFacts,
        }).catch(console.error);
      }

      if (messages.length > 0) {
        const transcript = messages
          .map(
            (msg) =>
              `${msg.role === "user" ? "Caller" : "Agent"}: ${msg.content}`
          )
          .join("\n");

        try {
          await fetch("/api/call-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript, sessionId }),
          });
          await fetch("/api/appointment-extraction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript, sessionId }),
          });
        } catch (err) {
          console.error("Post-call automation error:", err);
        }
      }
    }

    setStatus("disconnected");
  }, [
    sessionId,
    fields,
    messages,
    memoryFacts,
    agentName,
    endSessionMutation,
    updateExtractedFields,
    updateMemoryFacts,
  ]);

  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(console.error);
      }
      if (extractionTimerRef.current) {
        window.clearTimeout(extractionTimerRef.current);
      }
      extractionAbortRef.current?.abort();
    };
  }, []);

  const isActive = status === "connected" || status === "connecting";

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Controls bar */}
      <div className="surface-card p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 font-display">
            {agentName}
          </h2>
          <p className="text-sm text-zinc-500">{businessName}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Status indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              status === "connected"
                ? "bg-emerald-50"
                : status === "connecting"
                  ? "bg-amber-50"
                  : "bg-zinc-100"
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                status === "connected"
                  ? agentMode === "speaking"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-emerald-500"
                  : status === "connecting"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-zinc-400"
              }`}
            />
            <span className={`text-sm font-medium ${
              status === "connected"
                ? "text-emerald-700"
                : status === "connecting"
                  ? "text-amber-700"
                  : "text-zinc-600"
            }`}>
              {status === "connected"
                ? agentMode === "speaking"
                  ? "Speaking"
                  : "Listening"
                : status === "connecting"
                  ? "Connecting..."
                  : status === "disconnected"
                    ? "Disconnected"
                    : "Ready"}
            </span>
          </div>

          {/* Start/Stop button */}
          {!isActive ? (
            <button
              onClick={handleStart}
              disabled={status === "connecting"}
              className="rounded-full px-5 py-2.5 text-sm font-medium btn-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Start Voice Chat
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="rounded-full px-5 py-2.5 text-sm font-medium btn-primary transition-colors cursor-pointer"
            >
              End Call
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Transcript - takes 2 cols */}
        <div className="lg:col-span-2 min-h-0 flex flex-col">
          <TranscriptFeed messages={messages} />
        </div>

        {/* Right sidebar - extracted fields + memory */}
        <div className="flex flex-col gap-4 min-h-0 overflow-y-auto">
          <LeadFieldsPanel fields={fields} />
          <MemoryFactsPanel facts={memoryFacts} />
        </div>
      </div>
    </div>
  );
}
