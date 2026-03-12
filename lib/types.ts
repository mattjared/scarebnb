export interface Listing {
  id: number;
  property_name: string;
  location: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  price_per_night: number;
  host_name: string;
  host_response_vibe: string;
  rating: number;
  reviews_count: number;
  scare_score: number;
  weirdness_score: number;
  wifi_reliability: string;
  ghost_sighting_frequency: string;
  max_guests: number;
  amenities: string;
  tagline: string;
  house_rules: string;
  last_review_snippet: string;
}

export interface ListingFilter {
  minScare?: number;
  maxPrice?: number;
  country?: string;
  minWeirdness?: number;
}
