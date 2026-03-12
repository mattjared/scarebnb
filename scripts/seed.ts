import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  console.error("Set them in .env.local or as environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
  const csvPath = path.join(process.cwd(), "data", "scarebnb_listings.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const { data: rows } = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  console.log(`Parsed ${rows.length} listings from CSV`);

  const listings = rows.map((row) => ({
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

  // Delete existing rows and re-insert (idempotent)
  const { error: deleteError } = await supabase
    .from("listings")
    .delete()
    .gte("id", 0);

  if (deleteError) {
    console.error("Error clearing listings table:", deleteError.message);
    console.error(
      "Make sure the listings table exists. Run the SQL schema first."
    );
    process.exit(1);
  }

  const { data, error } = await supabase
    .from("listings")
    .insert(listings)
    .select();

  if (error) {
    console.error("Error seeding listings:", error.message);
    process.exit(1);
  }

  console.log(`Seeded ${data.length} listings successfully!`);
}

seed();
