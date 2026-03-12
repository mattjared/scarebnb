"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { track } from "@vercel/analytics";
import Link from "next/link";
import { useState, FormEvent } from "react";

const chatTransport = new DefaultChatTransport({ api: "/api/chat" });

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    transport: chatTransport,
  });
  const [input, setInput] = useState("");
  const isLoading = status === "streaming" || status === "submitted";

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    track("chat_message_sent", { message_length: input.length });
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Limitations sidebar */}
      <div
        style={{
          width: 220,
          padding: "1.5rem 1rem",
          borderRight: "1px solid #ddd",
          fontSize: "0.85rem",
          flexShrink: 0,
        }}
      >
        <Link href="/" style={{ opacity: 0.5, fontSize: "0.8rem" }}>
          ← Back
        </Link>
        <h2 style={{ fontSize: "1rem", margin: "1rem 0 0.75rem" }}>
          Act 2: Chat
        </h2>
        <p style={{ opacity: 0.6, marginBottom: "1rem" }}>
          AI concierge — smart but limited.
        </p>
        <div style={{ opacity: 0.7 }}>
          <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
            Can&apos;t do:
          </p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li>❌ Check real-time weather</li>
            <li>❌ Find local events</li>
            <li>❌ Compare with external data</li>
            <li>❌ Produce a trip plan</li>
            <li>❌ Contact a host</li>
            <li>❌ Take any action</li>
          </ul>
        </div>
      </div>

      {/* Chat panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxWidth: 700,
          margin: "0 auto",
          padding: "1rem",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", marginBottom: "1rem" }}>
          {messages.length === 0 && (
            <p style={{ opacity: 0.4, marginTop: "2rem", textAlign: "center" }}>
              Ask the ScareBNB Concierge anything about the 20 listings...
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                marginBottom: "1rem",
                padding: "0.75rem",
                borderRadius: 8,
                background: m.role === "user" ? "#f0f0f0" : "#f8f8f8",
              }}
            >
              <strong style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                {m.role === "user" ? "You" : "Concierge"}
              </strong>
              <div style={{ marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>
                {m.parts
                  .filter((p) => p.type === "text")
                  .map((p, i) => (
                    <span key={i}>{p.type === "text" ? p.text : null}</span>
                  ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <p style={{ opacity: 0.5, fontStyle: "italic" }}>Thinking...</p>
          )}
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Find me something spooky under $100..."
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fff",
              color: "#171717",
              fontSize: "1rem",
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: "0.75rem 1.5rem",
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
    </div>
  );
}
