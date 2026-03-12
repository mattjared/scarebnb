"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { track } from "@vercel/analytics";
import Link from "next/link";
import { useState, useEffect, FormEvent } from "react";

const agentTransport = new DefaultChatTransport({ api: "/api/agent" });

export default function AgentPage() {
  const { messages, sendMessage, status } = useChat({
    transport: agentTransport,
  });
  const [input, setInput] = useState("");
  const [tripPageUrl, setTripPageUrl] = useState<string | null>(null);
  const isLoading = status === "streaming" || status === "submitted";

  // Watch for generate_trip_page tool results to auto-show the preview
  useEffect(() => {
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      for (const part of m.parts) {
        // Check for tool invocation results that contain a trip page URL
        const p = part as { type: string; state?: string; output?: { url?: string; type?: string } };
        if (
          p.state === "output-available" &&
          p.output?.type === "trip_page" &&
          p.output?.url
        ) {
          setTripPageUrl(p.output.url);
          track("trip_page_generated", { url: p.output.url });
        }
      }
    }
  }, [messages]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    track("agent_message_sent", { message_length: input.length });
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Chat panel */}
      <div
        style={{
          width: 380,
          display: "flex",
          flexDirection: "column",
          padding: "1rem",
          borderRight: "1px solid #ddd",
          flexShrink: 0,
        }}
      >
        <div>
          <Link href="/" style={{ opacity: 0.5, fontSize: "0.8rem" }}>
            ← Back
          </Link>
          <h2 style={{ fontSize: "1rem", margin: "0.5rem 0" }}>
            Act 3: Agent
          </h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto", marginBottom: "1rem" }}>
          {messages.length === 0 && (
            <p style={{ opacity: 0.4, marginTop: "2rem", textAlign: "center" }}>
              Ask the agent to plan a cursed vacation...
            </p>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {isLoading && (
            <p style={{ opacity: 0.5, fontStyle: "italic" }}>
              Agent is working...
            </p>
          )}
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Plan me a spooky weekend under $100..."
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fff",
              color: "#171717",
              fontSize: "0.9rem",
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#f0f0f0",
              color: "#171717",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </form>
      </div>

      {/* Agent trace panel */}
      <div
        style={{
          width: 320,
          padding: "1rem",
          overflowY: "auto",
          fontSize: "0.85rem",
          flexShrink: 0,
          borderRight: "1px solid #ddd",
        }}
      >
        <h3 style={{ marginBottom: "1rem", opacity: 0.7 }}>Agent Trace</h3>
        {messages.length === 0 && (
          <p style={{ opacity: 0.3 }}>Tool calls will appear here...</p>
        )}
        {messages.map((m) => (
          <TraceEntries key={m.id} message={m} />
        ))}
      </div>

      {/* Trip page preview panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <div
          style={{
            padding: "0.75rem 1rem",
            borderBottom: "1px solid #ddd",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.85rem",
          }}
        >
          <span style={{ fontWeight: 600 }}>Preview</span>
          {tripPageUrl && (
            <a
              href={tripPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("trip_page_opened", { url: tripPageUrl })}
              style={{ color: "#2563eb", textDecoration: "none" }}
            >
              Open in new tab ↗
            </a>
          )}
        </div>
        {tripPageUrl ? (
          <iframe
            src={tripPageUrl}
            style={{
              flex: 1,
              border: "none",
              width: "100%",
            }}
            title="Trip page preview"
          />
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ccc",
              fontSize: "0.9rem",
            }}
          >
            Trip page will appear here once the agent generates it...
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const textParts = message.parts.filter((p) => p.type === "text");
  if (textParts.length === 0 && message.role === "assistant") return null;

  return (
    <div
      style={{
        marginBottom: "0.75rem",
        padding: "0.6rem",
        borderRadius: 8,
        background: message.role === "user" ? "#f0f0f0" : "#f8f8f8",
        fontSize: "0.9rem",
      }}
    >
      <strong style={{ fontSize: "0.75rem", opacity: 0.6 }}>
        {message.role === "user" ? "You" : "Agent"}
      </strong>
      {textParts.map((part, i) => (
        <div key={i} style={{ marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>
          {part.type === "text" ? part.text : null}
        </div>
      ))}
    </div>
  );
}

function TraceEntries({ message }: { message: UIMessage }) {
  if (message.role !== "assistant") return null;

  const toolParts = message.parts.filter(
    (p) => p.type === "dynamic-tool" || p.type.startsWith("tool-")
  );
  if (toolParts.length === 0) return null;

  return (
    <>
      {toolParts.map((part, i) => {
        const toolPart = part as {
          type: string;
          toolName?: string;
          toolCallId: string;
          state: string;
          input?: unknown;
          output?: unknown;
        };
        const toolName =
          toolPart.toolName ||
          (toolPart.type.startsWith("tool-")
            ? toolPart.type.slice(5)
            : toolPart.type);

        return (
          <div
            key={i}
            style={{
              marginBottom: "0.75rem",
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: 6,
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
              🔧 {toolName}
            </div>
            <div style={{ opacity: 0.6, fontSize: "0.8rem" }}>
              Args: {JSON.stringify(toolPart.input)}
            </div>
            {toolPart.state === "output-available" && (
              <details style={{ marginTop: "0.25rem" }}>
                <summary style={{ cursor: "pointer", opacity: 0.7 }}>
                  Result
                </summary>
                <pre
                  style={{
                    fontSize: "0.75rem",
                    overflow: "auto",
                    maxHeight: 200,
                    marginTop: "0.25rem",
                  }}
                >
                  {JSON.stringify(toolPart.output, null, 2)}
                </pre>
              </details>
            )}
            {(toolPart.state === "input-available" ||
              toolPart.state === "input-streaming") && (
              <span style={{ opacity: 0.5 }}>⏳ Running...</span>
            )}
          </div>
        );
      })}
    </>
  );
}
