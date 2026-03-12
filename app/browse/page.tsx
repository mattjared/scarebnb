import { getListings } from "@/lib/listings";
import { Listing } from "@/lib/types";
import Link from "next/link";

export default async function BrowsePage() {
  const listings = await getListings();

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/" style={{ opacity: 0.5, fontSize: "0.9rem" }}>
          ← Back
        </Link>
        <h1 style={{ fontSize: "2rem", marginTop: "0.5rem" }}>
          Browse Listings
        </h1>
        <p style={{ opacity: 0.7 }}>{listings.length} cursed properties</p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {listings.map((listing: Listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: "1.25rem",
      }}
    >
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>
        {listing.property_name}
      </h2>
      <p style={{ opacity: 0.6, fontSize: "0.85rem", marginBottom: "0.75rem" }}>
        {listing.city}, {listing.country} · ${listing.price_per_night}/night
      </p>
      <p
        style={{
          fontStyle: "italic",
          fontSize: "0.9rem",
          marginBottom: "0.75rem",
          opacity: 0.8,
        }}
      >
        &ldquo;{listing.tagline}&rdquo;
      </p>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          fontSize: "0.8rem",
          opacity: 0.7,
          marginBottom: "0.5rem",
        }}
      >
        <span>Scare: {listing.scare_score}/10</span>
        <span>Weird: {listing.weirdness_score}/10</span>
        <span>Rating: {listing.rating}</span>
      </div>
      <p style={{ fontSize: "0.8rem", opacity: 0.6 }}>
        Host: {listing.host_name} · Ghosts: {listing.ghost_sighting_frequency}
      </p>
      <details style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
        <summary style={{ cursor: "pointer", opacity: 0.7 }}>Details</summary>
        <div style={{ marginTop: "0.5rem", opacity: 0.8 }}>
          <p>
            <strong>Amenities:</strong> {listing.amenities}
          </p>
          <p style={{ marginTop: "0.25rem" }}>
            <strong>House rules:</strong> {listing.house_rules}
          </p>
          <p style={{ marginTop: "0.25rem" }}>
            <strong>Recent review:</strong> {listing.last_review_snippet}
          </p>
          <p style={{ marginTop: "0.25rem" }}>
            <strong>WiFi:</strong> {listing.wifi_reliability} · Max guests:{" "}
            {listing.max_guests}
          </p>
        </div>
      </details>
    </div>
  );
}
