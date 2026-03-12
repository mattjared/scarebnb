import { getWeather } from "./weather";
import { getListingById } from "./listings";
import { Listing } from "./types";

// --- Crypto price (CoinGecko free API) ---

export async function executeGetBtcPrice(args: {
  listing_id: number;
  nights: number;
}) {
  const listing = await getListingById(args.listing_id);
  if (!listing) return { error: `Listing ${args.listing_id} not found` };

  const totalCost = listing.price_per_night * args.nights;

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    const btcPrice = data.bitcoin?.usd;

    if (btcPrice) {
      const btcNeeded = totalCost / btcPrice;
      const satoshis = Math.round(btcNeeded * 100_000_000);
      return {
        property_name: listing.property_name,
        price_per_night_usd: listing.price_per_night,
        nights: args.nights,
        total_cost_usd: totalCost,
        btc_price_usd: btcPrice,
        btc_needed: parseFloat(btcNeeded.toFixed(8)),
        satoshis_needed: satoshis,
        verdict:
          satoshis < 10000
            ? "Barely a rounding error in your wallet. Do it."
            : satoshis < 100000
            ? "Less than a night of degen trading losses. Worth it."
            : satoshis < 1000000
            ? "A meaningful chunk of sats, but ghosts are priceless."
            : "Whale-level spend. But have you SEEN this place?",
        source: "coingecko",
      };
    }
  } catch {
    // fallback
  }

  return {
    property_name: listing.property_name,
    total_cost_usd: totalCost,
    btc_price_usd: null,
    btc_needed: null,
    error: "Could not fetch BTC price. The blockchain ghosts are uncooperative.",
    source: "unavailable",
  };
}

// --- Weather comparison (client city vs destination) ---

export async function executeCompareWeather(args: {
  client_city: string;
  client_country?: string;
  destination_city: string;
  destination_country?: string;
}) {
  const [clientWeather, destWeather] = await Promise.all([
    getWeather(args.client_city, args.client_country),
    getWeather(args.destination_city, args.destination_country),
  ]);

  const tempDiff = destWeather.temperature_c - clientWeather.temperature_c;

  return {
    client: clientWeather,
    destination: destWeather,
    temperature_difference_c: tempDiff,
    temperature_difference_f: Math.round(tempDiff * 9 / 5),
    comparison:
      Math.abs(tempDiff) < 3
        ? "Nearly identical temperatures. The only chill will be from the ghosts."
        : tempDiff > 10
        ? `${Math.abs(tempDiff)}°C warmer at the destination. Pack light — the spirits will keep you cool.`
        : tempDiff < -10
        ? `${Math.abs(tempDiff)}°C colder at the destination. Layer up. The cold isn't just the ghosts.`
        : tempDiff > 0
        ? `${Math.abs(tempDiff)}°C warmer at the destination. A pleasant upgrade from ${args.client_city}.`
        : `${Math.abs(tempDiff)}°C cooler at the destination. Brings a certain atmospheric dread.`,
  };
}

// --- Fake events data (MVP — curated per location) ---

const EVENTS_DB: Record<string, { name: string; date: string; description: string }[]> = {
  Whitby: [
    { name: "Whitby Goth Weekend", date: "This weekend", description: "Biannual gothic festival with live music, markets, and a lot of black lace." },
    { name: "Dracula Walking Tour", date: "Daily", description: "Follow Bram Stoker's footsteps through Whitby's atmospheric streets." },
  ],
  Asheville: [
    { name: "Appalachian Folk Festival", date: "This weekend", description: "Three days of bluegrass, storytelling, and mountain craft demonstrations." },
    { name: "Blue Ridge Ghost Walk", date: "Friday nights", description: "Guided paranormal tour through downtown Asheville's most haunted spots." },
  ],
  "New York": [
    { name: "Greenwich Village Ghost Tour", date: "Nightly", description: "Walking tour of Manhattan's most haunted locations." },
    { name: "Midnight Jazz at Blue Note", date: "This Saturday", description: "Late night jazz session with surprise guest performers." },
  ],
  Salem: [
    { name: "Salem Witch Trials Memorial Night", date: "This Friday", description: "Candlelit ceremony and historical reenactment." },
    { name: "Haunted Happenings Festival", date: "All month", description: "Salem's famous month-long celebration of the macabre." },
  ],
  Edinburgh: [
    { name: "Edinburgh Ghost Bus Tour", date: "Daily", description: "Comedy-horror tour through the Old Town on a converted bus." },
    { name: "Underground Vault Experience", date: "This weekend", description: "Explore the sealed vaults beneath Edinburgh's South Bridge." },
  ],
  "New Orleans": [
    { name: "Voodoo Music + Arts Festival", date: "This weekend", description: "Three-day music festival in City Park." },
    { name: "French Quarter Ghost Tour", date: "Nightly", description: "Walk through the haunted heart of New Orleans." },
  ],
  Amboise: [
    { name: "Loire Valley Wine Festival", date: "This Saturday", description: "Tastings from 30+ local vineyards along the Loire." },
    { name: "Château Night Tour", date: "Friday evening", description: "Candlelit tour of the Royal Château d'Amboise." },
  ],
  Bran: [
    { name: "Dracula's Castle Night Tour", date: "This Friday", description: "After-hours tour of Bran Castle by torchlight." },
    { name: "Transylvania Film Festival", date: "Next week", description: "Horror and arthouse cinema screenings in historic venues." },
  ],
  Rothenburg: [
    { name: "Night Watchman Tour", date: "Nightly", description: "Follow the medieval night watchman through Rothenburg's cobbled streets." },
    { name: "Medieval Festival", date: "This weekend", description: "Annual celebration with jousting, markets, and period costumes." },
  ],
  Hamilton: [
    { name: "Bermuda Triangle Mystery Cruise", date: "This Saturday", description: "Sunset cruise through the legendary triangle. Return not guaranteed." },
  ],
  Cortona: [
    { name: "Tuscan Food Festival", date: "This weekend", description: "Three days of truffle hunting, olive oil tasting, and pasta-making workshops." },
  ],
  Interlaken: [
    { name: "Alpine Yodeling Championship", date: "This Saturday", description: "Annual competition echoing through the Swiss Alps." },
    { name: "Jungfrau Marathon", date: "Next weekend", description: "Scenic mountain marathon from Interlaken to Kleine Scheidegg." },
  ],
  Alesund: [
    { name: "Norwegian Sea Festival", date: "This weekend", description: "Celebration of maritime culture with boat races and seafood." },
  ],
  Luxor: [
    { name: "Temple Sound & Light Show", date: "Nightly", description: "Dramatic light show at the ancient Karnak Temple." },
    { name: "Nile Felucca Sunset Cruise", date: "Daily", description: "Traditional sailboat cruise at golden hour." },
  ],
  Istanbul: [
    { name: "Grand Bazaar Night Market", date: "This Friday", description: "Special after-hours access to the covered market with live music." },
    { name: "Whirling Dervishes Ceremony", date: "This Sunday", description: "Sacred Sufi ceremony at Galata Mevlevihane." },
  ],
  Moher: [
    { name: "Wild Atlantic Way Festival", date: "This weekend", description: "Music, storytelling, and cliff walks along Ireland's west coast." },
  ],
  "Namche Bazaar": [
    { name: "Sherpa Culture Festival", date: "This weekend", description: "Traditional Sherpa music, dance, and storytelling at base camp." },
  ],
  Rachel: [
    { name: "Area 51 Stargazing Night", date: "This Saturday", description: "Organized sky watching event in the Nevada desert. Bring your own tin foil hat." },
  ],
  "Coober Pedy": [
    { name: "Outback Opal Festival", date: "Next weekend", description: "Mining demonstrations, gem trading, and underground art exhibitions." },
  ],
  "Cesky Krumlov": [
    { name: "Five-Petaled Rose Festival", date: "This weekend", description: "Medieval festival with parades, sword fights, and fire shows in the castle courtyard." },
    { name: "Baroque Night Concert", date: "This Friday", description: "Classical concert in the revolving theatre gardens." },
  ],
};

export async function executeGetWeather(args: { city: string; country?: string }) {
  return await getWeather(args.city, args.country);
}

export async function executeSearchEvents(args: { location: string; timeframe?: string }) {
  const events = EVENTS_DB[args.location] || [];
  if (events.length === 0) {
    return {
      location: args.location,
      timeframe: args.timeframe || "this week",
      events: [],
      note: `No events found for ${args.location}. This is a curated demo dataset.`,
    };
  }
  return {
    location: args.location,
    timeframe: args.timeframe || "this week",
    events,
  };
}

export async function executeCompareListings(args: { listing_ids: number[] }) {
  const listings: (Listing | undefined)[] = await Promise.all(
    args.listing_ids.map((id) => getListingById(id))
  );

  const valid = listings.filter((l): l is Listing => l !== undefined);

  return {
    comparison: valid.map((l) => ({
      id: l.id,
      property_name: l.property_name,
      city: l.city,
      country: l.country,
      price_per_night: l.price_per_night,
      rating: l.rating,
      reviews_count: l.reviews_count,
      scare_score: l.scare_score,
      weirdness_score: l.weirdness_score,
      ghost_sighting_frequency: l.ghost_sighting_frequency,
      wifi_reliability: l.wifi_reliability,
      max_guests: l.max_guests,
      amenities: l.amenities,
      host_name: l.host_name,
      host_response_vibe: l.host_response_vibe,
    })),
  };
}

export async function executeGenerateTripDossier(args: {
  listing_id: number;
  trip_dates?: string;
  guest_count?: number;
  weather_summary?: string;
  events_nearby?: string;
}) {
  const listing = await getListingById(args.listing_id);
  if (!listing) {
    return { error: `Listing ${args.listing_id} not found` };
  }

  return {
    type: "trip_dossier",
    listing: {
      id: listing.id,
      property_name: listing.property_name,
      location: listing.location,
      city: listing.city,
      country: listing.country,
      price_per_night: listing.price_per_night,
      rating: listing.rating,
      scare_score: listing.scare_score,
      weirdness_score: listing.weirdness_score,
      ghost_sighting_frequency: listing.ghost_sighting_frequency,
      host_name: listing.host_name,
      host_response_vibe: listing.host_response_vibe,
      amenities: listing.amenities,
      house_rules: listing.house_rules,
      tagline: listing.tagline,
    },
    trip_dates: args.trip_dates || "Not specified",
    guest_count: args.guest_count || 1,
    weather_summary: args.weather_summary || "Not checked",
    events_nearby: args.events_nearby || "Not checked",
  };
}

export async function executeDraftBookingMessage(args: {
  listing_id: number;
  guest_message_context?: string;
  host_name: string;
  host_response_vibe: string;
}) {
  const listing = await getListingById(args.listing_id);
  return {
    type: "booking_draft",
    listing_id: args.listing_id,
    property_name: listing?.property_name || "Unknown",
    host_name: args.host_name,
    host_response_vibe: args.host_response_vibe,
    guest_context: args.guest_message_context || "",
    status: "awaiting_approval",
    note: "This draft requires human approval before sending.",
  };
}
