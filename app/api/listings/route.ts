import { NextRequest, NextResponse } from "next/server";
import { getListings, getListingsByFilter } from "@/lib/listings";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const minScare = searchParams.get("minScare");
  const maxPrice = searchParams.get("maxPrice");
  const country = searchParams.get("country");
  const minWeirdness = searchParams.get("minWeirdness");

  const hasFilters = minScare || maxPrice || country || minWeirdness;

  const listings = hasFilters
    ? await getListingsByFilter({
        minScare: minScare ? parseInt(minScare, 10) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
        country: country || undefined,
        minWeirdness: minWeirdness ? parseInt(minWeirdness, 10) : undefined,
      })
    : await getListings();

  return NextResponse.json({
    count: listings.length,
    listings,
    _meta: {
      source: "ScareBNB Open API",
      filters_available: ["minScare", "minWeirdness", "maxPrice", "country"],
    },
  });
}
