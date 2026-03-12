"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";

export default function Home() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "4rem 2rem" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>ScareBNB</h1>
      <p style={{ fontSize: "1.2rem", opacity: 0.7, marginBottom: "3rem" }}>
        Every stay comes with a story. And possibly a ghost.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <Link
          href="/browse"
          onClick={() => track("nav_click", { destination: "browse" })}
          style={{
            display: "block",
            padding: "1.5rem",
            border: "1px solid #ccc",
            borderRadius: 8,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <strong>Act 1 — Browse</strong>
          <br />
          <span style={{ opacity: 0.7 }}>
            20 cursed listings. You do the thinking.
          </span>
        </Link>

        <Link
          href="/chat"
          onClick={() => track("nav_click", { destination: "chat" })}
          style={{
            display: "block",
            padding: "1.5rem",
            border: "1px solid #ccc",
            borderRadius: 8,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <strong>Act 2 — Chat</strong>
          <br />
          <span style={{ opacity: 0.7 }}>
            AI concierge. Smart but trapped.
          </span>
        </Link>

        <Link
          href="/agent"
          onClick={() => track("nav_click", { destination: "agent" })}
          style={{
            display: "block",
            padding: "1.5rem",
            border: "1px solid #ccc",
            borderRadius: 8,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <strong>Act 3 — Agent</strong>
          <br />
          <span style={{ opacity: 0.7 }}>
            Full agent. Plans, researches, acts.
          </span>
        </Link>
      </div>

      <p style={{ marginTop: "2rem", fontSize: "0.9rem", opacity: 0.5 }}>
        <a
          href="/api/listings"
          onClick={() => track("nav_click", { destination: "api" })}
          style={{ color: "inherit" }}
        >
          Open API →
        </a>
      </p>
    </div>
  );
}
