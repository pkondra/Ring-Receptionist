"use client";

interface Message {
  role: "user" | "agent";
  content: string;
}

interface TranscriptFeedProps {
  messages: Message[];
}

export default function TranscriptFeed({ messages }: TranscriptFeedProps) {
  return (
    <div className="surface-card p-5 h-full flex flex-col">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">
        Live Transcript
      </h3>
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-zinc-400">
              Start a conversation to see the transcript...
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.role === "user"
                  ? "bg-[var(--accent-soft)] border border-[var(--border)]"
                  : "bg-zinc-50 border border-zinc-200"
              }`}
            >
              <span className={`block text-xs font-medium mb-1 ${
                msg.role === "user" ? "text-[var(--accent-strong)]" : "text-zinc-500"
              }`}>
                {msg.role === "user" ? "You" : "Agent"}
              </span>
              <p className="text-sm text-zinc-800">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
