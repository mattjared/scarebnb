# ScareBNB — Build Instructions

## What This Is
ScareBNB is a teaching demo that shows the progression from static page → AI app → AI agent, using 20 fictional "cursed" Airbnb-style listings. One Next.js project, three routes (`/browse`, `/chat`, `/agent`), same data, escalating AI capability.

The audience is two-fold:
1. **Vibe coders** — AI-curious, may have built a chatbot, need to learn deployment and architecture
2. **Developers** — know Next.js, need to understand the guts of an AI agent (tool use, planning, human-in-the-loop)

## The Narrative Arc
- **Act 1 (`/browse`)**: Static page. Beautiful but dumb. You have to do all the thinking yourself.
- **Act 2 (`/chat`)**: AI chat app. Can answer questions about listings but can't check weather, find events, or take action. It's a parrot with personality.
- **Act 3 (`/agent`)**: Full agent. Plans, researches, branches decisions, produces deliverables, takes action with human approval. This is the WOW moment.

Acts 1 and 2 exist to build frustration. Act 3 is the payoff.

---

## Tech Stack
- **Framework**: Next.js (App Router)
- **Database**: Supabase (Postgres)
- **AI (All Acts)**: Vercel AI Gateway via AI SDK
- **External APIs**: wttr.in (weather), Open-Meteo (weather fallback)
- **Deployment**: Vercel
- **Styling**: Tailwind CSS — dark, slightly spooky theme throughout

## AI Gateway Setup

We use Vercel's AI Gateway for ALL AI calls. This is important for the 
demo audience (Vercel employees) — it shows the product in action and 
eliminates the need for separate Anthropic API keys.

### How it works
AI Gateway provides a single endpoint for ~100+ AI models. The AI SDK 
(v5+) uses it by default — just pass a model string like 
`anthropic/claude-sonnet-4.5` and it routes through the gateway 
automatically. No provider-specific SDK imports needed.

### Authentication
1. Go to Vercel Dashboard → AI Gateway → API Keys
2. Create a new key
3. Set it as `AI_GATEWAY_API_KEY` in your environment

When deployed to Vercel, you can also use OIDC token auth (zero config,
no API key needed). The AI SDK handles this automatically.

### Act 2 — AI SDK with Gateway (simple chat)
```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: 'anthropic/claude-sonnet-4.5', // Routes through AI Gateway automatically
    system: `You are the ScareBNB Concierge...`,
    messages,
  });

  return result.toDataStreamResponse();
}
```

No `@ai-sdk/anthropic` import needed. The AI SDK sees the 
`provider/model` format and routes through the gateway.

### Act 3 — AI SDK with Gateway + Tool Use (agent)
For the agent, we still use the AI SDK (not raw Anthropic SDK) but 
with tool definitions. The AI SDK handles the tool use loop for us 
via `maxSteps`, but we stream each step to the UI for the trace panel.

```typescript
// app/api/agent/route.ts
import { streamText, tool } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: 'anthropic/claude-sonnet-4.5',
    system: agentSystemPrompt,
    messages,
    maxSteps: 10, // Allow up to 10 tool call rounds
    tools: {
      get_weather: tool({
        description: 'Get current weather at a location',
        parameters: z.object({
          city: z.string(),
          country: z.string().optional(),
        }),
        execute: async ({ city, country }) => {
          // Call wttr.in, return weather data
          return await getWeather(city, country);
        },
      }),
      // ... other tools
    },
  });

  return result.toDataStreamResponse();
}
```

### Why AI Gateway matters for the demo
- **One key, all models**: No juggling Anthropic/OpenAI/Google keys
- **Swap models live**: Change `anthropic/claude-sonnet-4.5` to 
  `openai/gpt-4o` and the same agent works — great demo moment
- **Built-in observability**: Token usage and latency visible in 
  Vercel dashboard
- **OIDC auth on Vercel**: Zero config in production, the gateway 
  authenticates via Vercel's identity automatically
- **Failover**: If Anthropic goes down, configure automatic fallback 
  to another provider in gateway settings

### Alternative: Direct Anthropic SDK via Gateway
If you want to show the raw tool use loop (more educational for 
developers), you can also use the Anthropic SDK pointed at the 
gateway:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh',
});

const message = await client.messages.create({
  model: 'anthropic/claude-sonnet-4.5',
  max_tokens: 4096,
  system: agentSystemPrompt,
  messages,
  tools: toolDefinitions,
});
```

This gives you full control over the loop (check stop_reason, 
execute tools, feed back results manually). Better for teaching 
the mechanics but more code.

**Recommendation:** Use AI SDK + `maxSteps` for Act 2 AND Act 3. 
It's cleaner and showcases the Vercel stack. If the developer 
audience wants to see the raw loop, show the Anthropic SDK 
alternative as a "here's what's happening under the hood" moment.

## Environment Variables
```
AI_GATEWAY_API_KEY=              # Vercel AI Gateway key
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # for seed script only
```

---

## Project Structure

```
scarebnb/
├── app/
│   ├── page.tsx                    ← Landing / table of contents
│   ├── browse/
│   │   └── page.tsx                ← Act 1: Static listing page
│   ├── chat/
│   │   └── page.tsx                ← Act 2: AI chat app
│   ├── agent/
│   │   └── page.tsx                ← Act 3: Full agent
│   ├── api/
│   │   ├── listings/
│   │   │   ├── route.ts           ← Public API: all/filtered listings
│   │   │   └── [id]/
│   │   │       └── route.ts       ← Public API: single listing
│   │   ├── chat/
│   │   │   └── route.ts           ← Act 2: AI SDK streamText via Gateway
│   │   └── agent/
│   │       └── route.ts           ← Act 3: AI SDK streamText + tools via Gateway
│   └── components/
│       ├── ListingCard.tsx         ← Shared: all acts
│       ├── ListingGrid.tsx         ← Shared: filterable grid
│       ├── ChatPanel.tsx           ← Shared: Acts 2 & 3
│       ├── AgentTrace.tsx          ← Act 3: visible thinking
│       ├── TripDossier.tsx         ← Act 3: deliverable output
│       ├── BookingApproval.tsx     ← Act 3: human-in-the-loop
│       └── LimitationsList.tsx     ← Act 2: visible "can't do" list
├── lib/
│   ├── listings.ts                 ← Data access (Supabase w/ CSV fallback)
│   ├── tools.ts                    ← Act 3: tool definitions + executors
│   └── weather.ts                  ← wttr.in + Open-Meteo fallback
├── scripts/
│   └── seed.ts                     ← Load CSV → Supabase
├── data/
│   └── scarebnb_listings.csv       ← Canonical seed data (20 listings)
├── .env.local
├── .env.example
└── INSTRUCTIONS.md                 ← This file
```

---

## Build Steps

### Phase 0: Project Setup

**Step 0.1 — Scaffold the project**
```bash
npx create-next-app@latest scarebnb --typescript --tailwind --app --src=false
cd scarebnb
```

**Step 0.2 — Install dependencies**
```bash
# Database
npm install @supabase/supabase-js

# AI — AI SDK handles everything via gateway
npm install ai zod

# Optional: if you want to show raw Anthropic SDK alternative
npm install @anthropic-ai/sdk

# CSV parsing (for seed script)
npm install papaparse
npm install -D @types/papaparse tsx
```

**Step 0.3 — Set up Supabase**
1. Create a new Supabase project at supabase.com
2. Run the table creation SQL (see Database Schema section below)
3. Copy URL and keys to `.env.local`

**Step 0.4 — Seed the database**
1. Place `scarebnb_listings.csv` in `data/`
2. Run `npx tsx scripts/seed.ts`
3. Verify in Supabase dashboard that 20 rows exist

**Step 0.5 — Create `.env.example`**
```
AI_GATEWAY_API_KEY=your_ai_gateway_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

### Phase 1: Data Layer

**Step 1.1 — Database schema**
```sql
create table listings (
  id serial primary key,
  property_name text not null,
  location text,
  city text not null,
  country text not null,
  latitude decimal(10,6),
  longitude decimal(10,6),
  price_per_night integer,
  host_name text,
  host_response_vibe text,
  rating decimal(2,1),
  reviews_count integer,
  scare_score integer,
  weirdness_score integer,
  wifi_reliability text,
  ghost_sighting_frequency text,
  max_guests integer,
  amenities text,
  tagline text,
  house_rules text,
  last_review_snippet text
);

-- Enable read access for anon key
alter table listings enable row level security;
create policy "Public read access" on listings for select using (true);
```

**Step 1.2 — Data access layer (`lib/listings.ts`)**
Single module that all routes import from. Queries Supabase, with a fallback to parsing the local CSV if Supabase isn't configured (for offline dev or participants who skip the DB setup).

Should export:
- `getListings()` — all listings
- `getListingById(id)` — single listing
- `getListingsByFilter({ minScare, maxPrice, country, minWeirdness })` — filtered

**Step 1.3 — Seed script (`scripts/seed.ts`)**
Reads CSV, parses with PapaParse, upserts to Supabase. Should be idempotent (safe to run multiple times).

**Step 1.4 — Public API endpoints**
```
GET /api/listings                           → all listings
GET /api/listings?country=US                → by country
GET /api/listings?minScare=7                → by scare score
GET /api/listings?maxPrice=100              → by price
GET /api/listings?minWeirdness=8            → by weirdness
GET /api/listings/7                         → single listing
```

Response format:
```json
{
  "count": 20,
  "listings": [...],
  "_meta": {
    "source": "ScareBNB Open API",
    "filters_available": ["minScare", "minWeirdness", "maxPrice", "country"]
  }
}
```

---

### Phase 2: Landing Page (`/`)

The table of contents. Sets the tone for the whole demo.

**Design:**
- Title: "ScareBNB" with tagline "Every stay comes with a story. And possibly a ghost."
- Three cards linking to `/browse`, `/chat`, `/agent`
- Each card has an act number, title, subtitle explaining what it does
- Dark, spooky aesthetic — this establishes the visual language for everything
- Maybe a subtle fog or particle animation in the background
- Link to `/api/listings` somewhere as "Open API"

Keep it simple. This page should take 30 seconds to understand.

---

### Phase 3: Act 1 — `/browse` (Static Page)

**Purpose:** Show the data beautifully. Demonstrate what a "page" is — it shows things but doesn't think.

**Components needed:**
- `ListingGrid` — responsive grid of `ListingCard` components
- `ListingCard` — shows property name, city/country, price, rating, scare score, weirdness score, ghost frequency, tagline. Click to expand for amenities, house rules, last review.
- Filter bar — filter by scare score range, weirdness score range, price range, country, ghost frequency
- Sort — by price, rating, scare score, weirdness score
- Stats bar at top — fun superlatives:
  - Most Haunted (highest ghost frequency)
  - Cheapest (lowest price — The Suspiciously Cheap Chateau at $12)
  - Scariest (highest scare score)
  - Weirdest (highest weirdness score)
  - Most Reviewed (highest review count — Nonna at 234)

**Visual extras for the "wow" in Act 1:**
- A scare-vs-weirdness scatter plot where each dot is a listing (hover to see name). This is immediately engaging and shows the two axes are independent.
- Or: a small map showing all 20 locations globally with pins

**What this CAN'T do (to set up Act 2):**
- Can't ask questions
- Can't get personalized recommendations
- Can't compare listings intelligently
- You have to read every card yourself and decide

---

### Phase 4: Act 2 — `/chat` (AI App)

**Purpose:** Add conversational AI. Show what a "system prompt + context" approach gives you — and where it hits a wall.

**Layout:** Listing grid on the left (reuse from Act 1), chat panel on the right.

**New components:**
- `ChatPanel` — message list + input, uses `useChat` hook from AI SDK
- `LimitationsList` — a visible sidebar or overlay showing what the chat CAN'T do:
  ```
  ❌ Check real-time weather
  ❌ Find local events
  ❌ Compare listings with external data
  ❌ Produce a trip plan
  ❌ Contact a host
  ❌ Take any action
  ```

**API route: `/api/chat/route.ts`**
- Uses AI SDK `streamText` routed through Vercel AI Gateway
- Model: `anthropic/claude-sonnet-4.5` (just a string, no provider import)
- System prompt injects all 20 listings as JSON
- Persona: "ScareBNB Concierge" — darkly funny, opinionated, genuinely helpful but ominous

**System prompt should include:**
```
You are the ScareBNB Concierge — a darkly funny, slightly ominous 
travel advisor. You know everything about these 20 listings and you 
have STRONG opinions.

You genuinely want guests to find their perfect cursed stay, but 
you're honest about the ghosts, the weird hosts, and the structural 
integrity of each property.

Here are all the listings you know about:
{listings_json}

Guidelines:
- Be helpful but unsettling
- Always mention ghost frequency when relevant  
- If someone wants "normal," gently discourage them
- Rate guest compatibility on a "Scare Index" of 1-10
- You may editorialize about the hosts
- If asked about weather, events, or anything not in the data,
  honestly say you don't have access to that information
- Keep responses concise — 2-3 paragraphs max
```

**Interaction: listing highlighting**
When the AI mentions a listing by name in its response, highlight that card in the grid. This makes the chat feel connected to the UI, not separate.

**Key demo moment:** Ask "What's the weather like at the Haunted Lighthouse?" The AI says it doesn't know. This is the setup for Act 3.

---

### Phase 5: Act 3 — `/agent` (Full Agent)

**Purpose:** This is the payoff. The AI can now plan, research, branch decisions, produce deliverables, and take action with human approval.

**Layout:** Listing grid (left), chat panel (center), agent trace panel (right).

**New components:**

**`AgentTrace`** — The most important component for teaching. Shows the agent's thinking in real time as a vertical timeline:
```
🧠 Planning...
  → User wants: spooky weekend, under $100, 2 guests
  → Will filter by ghost frequency + price
  → Will check weather at top candidates
  → Will search for events at best match
  → Will generate trip dossier

🔧 Calling get_weather("Whitby, GB")
  → Result: 6°C, heavy rain, fog

🧠 Thinking...
  → Whitby weather is bad this weekend
  → Checking alternative spooky listings...

🔧 Calling get_weather("Asheville, US")
  → Result: 22°C, clear skies

🔧 Calling search_events("Asheville this weekend")
  → Result: Appalachian Folk Festival, Blue Ridge...

📋 Generating trip dossier...

✉️ Drafting message to Mothman Mike...
  → [Awaiting your approval]
```

Each step appears as it happens via server-sent events. Tool calls show both the request and the result. Thinking steps show the agent's reasoning.

**`TripDossier`** — A rendered card that the agent produces as a deliverable:
- Property name, location, price
- Real-time weather (from tool call)
- Nearby events (from tool call)
- Scare score + weirdness score
- Packing list (generated by AI based on weather + listing quirks)
- Vibe rating
- "Draft Message to Host" button

**`BookingApproval`** — Human-in-the-loop card:
- Shows the drafted message (written in the host's response vibe style)
- Three buttons: Approve & Send to Slack / Edit / Cancel
- On approve: posts to a real Slack channel via MCP

**API route: `/api/agent/route.ts`**

This is the core teaching piece. Uses AI SDK with `maxSteps` for the 
tool use loop, routed through Vercel AI Gateway. The AI SDK handles 
the loop automatically — call tool, feed result back, repeat — but we 
stream each step to the UI so the trace panel shows everything.

For the developer audience, optionally show the raw Anthropic SDK 
approach (manual loop) as a "here's what's under the hood" moment.

**The agent loop (AI SDK version):**
```
1. User sends message
2. AI SDK sends to Claude via AI Gateway with tool definitions
3. If Claude returns a tool call → AI SDK executes it automatically
4. Result fed back to Claude → may trigger more tool calls
5. Repeats until Claude gives final text or maxSteps reached
6. Each step streamed to client for AgentTrace panel
```

**The agent loop (raw Anthropic SDK — for teaching):**
```
1. Receive user message
2. Send to Claude via gateway with tool definitions
3. Check response:
   a. If stop_reason is "end_turn" → stream final text, done
   b. If stop_reason is "tool_use" → execute each tool call
      → append tool results to messages → go to step 2
4. Stream each step to client via SSE
```

**Tool definitions:**

```typescript
// 1. get_weather
{
  name: "get_weather",
  description: "Get current weather conditions at a location. Use this to check conditions at any listing location before recommending it.",
  input_schema: {
    type: "object",
    properties: {
      city: { type: "string", description: "City name" },
      country: { type: "string", description: "Country code (US, GB, etc)" }
    },
    required: ["city"]
  }
}

// 2. search_events  
{
  name: "search_events",
  description: "Search for upcoming events near a location. Use this to find things happening near a listing this week/weekend.",
  input_schema: {
    type: "object",
    properties: {
      location: { type: "string", description: "City or area to search" },
      timeframe: { type: "string", description: "e.g. 'this weekend', 'next week'" }
    },
    required: ["location"]
  }
}

// 3. compare_listings
{
  name: "compare_listings",
  description: "Do a structured comparison of 2-3 listings across all dimensions (price, scare, weirdness, ghost frequency, amenities, location).",
  input_schema: {
    type: "object",
    properties: {
      listing_ids: { type: "array", items: { type: "number" }, description: "IDs of listings to compare" }
    },
    required: ["listing_ids"]
  }
}

// 4. generate_trip_dossier
{
  name: "generate_trip_dossier",
  description: "Generate a complete trip dossier for a recommended listing, including weather, events, packing list, and vibe assessment. Call this when you've decided on a final recommendation.",
  input_schema: {
    type: "object",
    properties: {
      listing_id: { type: "number" },
      trip_dates: { type: "string", description: "Intended travel dates" },
      guest_count: { type: "number" },
      weather_summary: { type: "string", description: "Weather info you already gathered" },
      events_nearby: { type: "string", description: "Events info you already gathered" }
    },
    required: ["listing_id"]
  }
}

// 5. draft_booking_message
{
  name: "draft_booking_message",
  description: "Draft a booking inquiry message to the host. The message should match the host's 'response vibe' style. This requires human approval before sending.",
  input_schema: {
    type: "object",
    properties: {
      listing_id: { type: "number" },
      guest_message_context: { type: "string", description: "What the guest wants to communicate" },
      host_name: { type: "string" },
      host_response_vibe: { type: "string" }
    },
    required: ["listing_id", "host_name", "host_response_vibe"]
  }
}
```

**Agent system prompt:**
```
You are the ScareBNB Agent — an autonomous travel advisor that 
actively researches and plans cursed vacations. You don't just 
answer questions — you investigate, compare, and take action.

Here are all 20 ScareBNB listings:
{listings_json}

YOUR WORKFLOW:
1. ALWAYS start by making a plan. State what you're going to do 
   step by step before doing it.
2. Be PROACTIVE — don't wait to be asked. If you're recommending 
   a listing, check its weather. If comparing options, look up 
   events at both locations.
3. BRANCH your decisions — if weather is bad at one spot, 
   automatically check alternatives.
4. When you've landed on a recommendation, generate a trip dossier.
5. Offer to draft a booking message. If the user agrees, draft it 
   in the host's response vibe style.

PERSONALITY:
- Darkly funny, slightly ominous, but genuinely helpful
- You take your job VERY seriously despite the absurdity
- You have strong opinions and you're not afraid to share them
- You refer to ghost sightings as a feature, not a bug

RULES:
- Always check weather before finalizing a recommendation
- Never recommend a listing without mentioning its scare score 
  AND weirdness score
- If a guest wants "not scary," respect it but be a little 
  disappointed
- The trip dossier is your masterpiece — make it thorough
- Booking messages MUST match the host's vibe
```

**Tool execution (`lib/tools.ts`):**
Each tool function handles the actual API calls or data lookups:
- `get_weather`: calls wttr.in, falls back to Open-Meteo
- `search_events`: for MVP, use a curated set of fake events that match listing locations. Later can integrate real search.
- `compare_listings`: queries Supabase for the requested IDs, returns structured comparison
- `generate_trip_dossier`: assembles data from previous tool calls into a structured dossier object
- `draft_booking_message`: returns a structured draft object that the UI renders as an approval card

**Weather fallback (`lib/weather.ts`):**
```typescript
async function getWeather(city: string, country?: string) {
  try {
    // Primary: wttr.in
    const res = await fetch(`https://wttr.in/${city}?format=j1`, { 
      signal: AbortSignal.timeout(3000) 
    });
    if (res.ok) return parseWttrResponse(await res.json());
  } catch {}
  
  // Fallback: Open-Meteo (needs lat/long, get from listing data)
  // ...
}
```

---

### Phase 6: Public API Docs Page

**Optional but recommended.** A simple page at `/api` or a section on the landing page showing:
- Available endpoints with example URLs
- Sample response JSON
- "Try it" links that open in a new tab
- Note about the data being fictional

This makes the API feel real and gives participants a reference.

---

### Phase 7: Polish & Resilience

**Fallback data layer:** `lib/listings.ts` should detect if Supabase env vars are missing and fall back to parsing the local CSV. The app should always work.

**Error states:** If a tool call fails in Act 3, the agent should handle it gracefully — show the error in the trace panel and let the agent adapt.

**Loading states:** Each act should have proper loading/skeleton states. The agent trace should show a pulsing indicator during tool calls.

**Mobile responsive:** All three acts should work on mobile, even if the layout simplifies (stack panels vertically instead of side by side).

---

## Build Order (Recommended)

Build in this order so you always have something working:

```
Phase 0 → Phase 1 → Phase 3 (Act 1) → Phase 2 (Landing) → 
Phase 4 (Act 2) → Phase 5 (Act 3) → Phase 6 → Phase 7
```

Rationale: Get the data layer and Act 1 working first so you have 
a deployable app immediately. The landing page comes next because 
it ties everything together visually. Then add intelligence 
(Act 2) and agency (Act 3). Polish last.

Deploy to Vercel after each phase so you always have a live URL.

---

## Key Demo Script

When presenting, use this flow:

**Act 1 (2 min):** "Here's ScareBNB. 20 cursed listings. Look at this scatter plot — scare and weirdness are different things. Filter around. Click some listings. Now — which one should you book for a spooky weekend under $100? You'd have to read all 20, check the weather yourself, google events... that's a lot of tabs."

**Act 2 (3 min):** "Now I can ask. 'Find me something spooky under $100.' Great answer. But watch — 'What's the weather at the Haunted Lighthouse?' It doesn't know. 'Are there events near the Cryptid Cabin?' It can't check. 'Book it for me.' It can't do anything. Look at this limitations list. It's smart but it's trapped."

**Act 3 (5 min):** "Same question. 'Plan me a spooky weekend under $100.' Watch the trace panel. It's making a plan. Now it's checking weather at three locations. Whitby is storming — it's pivoting to Asheville. Found a folk festival nearby. It's generating a trip dossier. Now it's drafting a message to Mothman Mike — look, it's writing in riddles because that's Mike's vibe. [Click approve] And there it is in Slack."

**The lesson:** "A page shows data. An app talks about data. An agent acts on data. The difference is a while loop and some tool definitions."