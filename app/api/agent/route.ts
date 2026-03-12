import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { z } from "zod";
import { getListings } from "@/lib/listings";
import {
  executeGetWeather,
  executeSearchEvents,
  executeCompareListings,
  executeGenerateTripDossier,
  executeDraftBookingMessage,
  executeGetBtcPrice,
  executeCompareWeather,
} from "@/lib/tools";

export async function POST(req: Request) {
  const { messages } = await req.json();
  const listings = await getListings();

  const result = streamText({
    model: "anthropic/claude-sonnet-4.5",
    system: `You are the ScareBNB Agent — an autonomous travel advisor that actively researches and plans cursed vacations. You don't just answer questions — you investigate, compare, and take action.

Here are all 20 ScareBNB listings:
${JSON.stringify(listings, null, 2)}

YOUR WORKFLOW:
1. ALWAYS start by making a plan. State what you're going to do step by step before doing it.
2. Be PROACTIVE — don't wait to be asked. If you're recommending a listing, check its weather. If comparing options, look up events at both locations.
3. ALWAYS ask the user where they're currently located, then use compare_weather to show how the destination weather compares to their home city.
4. ALWAYS calculate the Bitcoin cost for any recommended listing using get_btc_price. Guests love knowing how many sats their haunted getaway costs.
5. BRANCH your decisions — if weather is bad at one spot, automatically check alternatives.
6. When you've landed on a recommendation, generate a trip dossier.
7. Offer to draft a booking message. If the user agrees, draft it in the host's response vibe style.

PERSONALITY:
- Darkly funny, slightly ominous, but genuinely helpful
- You take your job VERY seriously despite the absurdity
- You have strong opinions and you're not afraid to share them
- You refer to ghost sightings as a feature, not a bug

RULES:
- Always check weather before finalizing a recommendation
- Always compare weather between the guest's home city and the destination
- Always calculate the BTC cost — this is non-negotiable, guests need to know their satoshi exposure
- Never recommend a listing without mentioning its scare score AND weirdness score
- If a guest wants "not scary," respect it but be a little disappointed
- The trip dossier is your masterpiece — make it thorough
- Booking messages MUST match the host's vibe`,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(10),
    tools: {
      get_weather: tool({
        description:
          "Get current weather conditions at a location. Use this to check conditions at any listing location before recommending it.",
        inputSchema: z.object({
          city: z.string().describe("City name"),
          country: z.string().optional().describe("Country code (US, GB, etc)"),
        }),
        execute: async (args) => executeGetWeather(args),
      }),
      search_events: tool({
        description:
          "Search for upcoming events near a location. Use this to find things happening near a listing this week/weekend.",
        inputSchema: z.object({
          location: z.string().describe("City or area to search"),
          timeframe: z
            .string()
            .optional()
            .describe("e.g. 'this weekend', 'next week'"),
        }),
        execute: async (args) => executeSearchEvents(args),
      }),
      compare_listings: tool({
        description:
          "Do a structured comparison of 2-3 listings across all dimensions (price, scare, weirdness, ghost frequency, amenities, location).",
        inputSchema: z.object({
          listing_ids: z
            .array(z.number())
            .describe("IDs of listings to compare"),
        }),
        execute: async (args) => executeCompareListings(args),
      }),
      generate_trip_dossier: tool({
        description:
          "Generate a complete trip dossier for a recommended listing, including weather, events, packing list, and vibe assessment. Call this when you've decided on a final recommendation.",
        inputSchema: z.object({
          listing_id: z.number(),
          trip_dates: z
            .string()
            .optional()
            .describe("Intended travel dates"),
          guest_count: z.number().optional(),
          weather_summary: z
            .string()
            .optional()
            .describe("Weather info you already gathered"),
          events_nearby: z
            .string()
            .optional()
            .describe("Events info you already gathered"),
        }),
        execute: async (args) => executeGenerateTripDossier(args),
      }),
      draft_booking_message: tool({
        description:
          "Draft a booking inquiry message to the host. The message should match the host's 'response vibe' style. This requires human approval before sending.",
        inputSchema: z.object({
          listing_id: z.number(),
          guest_message_context: z
            .string()
            .optional()
            .describe("What the guest wants to communicate"),
          host_name: z.string(),
          host_response_vibe: z.string(),
        }),
        execute: async (args) => executeDraftBookingMessage(args),
      }),
      get_btc_price: tool({
        description:
          "Calculate how much Bitcoin a guest would need to sell to pay for a stay. Always use this when recommending a listing — guests need to know their satoshi exposure.",
        inputSchema: z.object({
          listing_id: z.number().describe("The listing to price in BTC"),
          nights: z.number().describe("Number of nights for the stay"),
        }),
        execute: async (args) => executeGetBtcPrice(args),
      }),
      compare_weather: tool({
        description:
          "Compare weather between the guest's current city and a destination city. Use this to help guests understand what climate shift to expect.",
        inputSchema: z.object({
          client_city: z.string().describe("Guest's current/home city"),
          client_country: z.string().optional().describe("Guest's country code"),
          destination_city: z.string().describe("Destination city"),
          destination_country: z.string().optional().describe("Destination country code"),
        }),
        execute: async (args) => executeCompareWeather(args),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
