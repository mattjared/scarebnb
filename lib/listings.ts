import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import fs from "fs";
import path from "path";
import { Listing, ListingFilter } from "./types";

// --- Supabase client (only created if env vars exist) ---

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key && url.startsWith("http")) {
    try {
      return createClient(url, key);
    } catch {
      return null;
    }
  }
  return null;
}

// --- CSV fallback ---

let csvCache: Listing[] | null = null;

function loadCSV(): Listing[] {
  if (csvCache) return csvCache;

  const csvPath = path.join(process.cwd(), "data", "scarebnb_listings.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const { data } = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  csvCache = data.map((row, i) => ({
    id: i + 1,
    property_name: row.property_name,
    location: row.location,
    city: row.city,
    country: row.country,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    price_per_night: parseInt(row.price_per_night, 10),
    host_name: row.host_name,
    host_response_vibe: row.host_response_vibe,
    rating: parseFloat(row.rating),
    reviews_count: parseInt(row.reviews_count, 10),
    scare_score: parseInt(row.scare_score, 10),
    weirdness_score: parseInt(row.weirdness_score, 10),
    wifi_reliability: row.wifi_reliability,
    ghost_sighting_frequency: row.ghost_sighting_frequency,
    max_guests: parseInt(row.max_guests, 10),
    amenities: row.amenities,
    tagline: row.tagline,
    house_rules: row.house_rules,
    last_review_snippet: row.last_review_snippet,
  }));

  return csvCache;
}

// --- Public API ---

export async function getListings(): Promise<Listing[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("id");
    if (!error && data) return data as Listing[];
  }
  return loadCSV();
}

export async function getListingById(
  id: number
): Promise<Listing | undefined> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();
    if (!error && data) return data as Listing;
  }
  const all = loadCSV();
  return all.find((l) => l.id === id);
}

export async function getListingsByFilter(
  filter: ListingFilter
): Promise<Listing[]> {
  const supabase = getSupabase();

  if (supabase) {
    let query = supabase.from("listings").select("*");
    if (filter.minScare !== undefined)
      query = query.gte("scare_score", filter.minScare);
    if (filter.maxPrice !== undefined)
      query = query.lte("price_per_night", filter.maxPrice);
    if (filter.country !== undefined)
      query = query.eq("country", filter.country);
    if (filter.minWeirdness !== undefined)
      query = query.gte("weirdness_score", filter.minWeirdness);

    const { data, error } = await query.order("id");
    if (!error && data) return data as Listing[];
  }

  // CSV fallback with in-memory filtering
  let results = loadCSV();
  if (filter.minScare !== undefined)
    results = results.filter((l) => l.scare_score >= filter.minScare!);
  if (filter.maxPrice !== undefined)
    results = results.filter((l) => l.price_per_night <= filter.maxPrice!);
  if (filter.country !== undefined)
    results = results.filter((l) => l.country === filter.country);
  if (filter.minWeirdness !== undefined)
    results = results.filter((l) => l.weirdness_score >= filter.minWeirdness!);

  return results;
}
