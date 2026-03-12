import { NextRequest, NextResponse } from "next/server";
import { getTripPage } from "@/lib/trip-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const html = getTripPage(id);

  if (!html) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;text-align:center;color:#999">
        <h2>Trip page not found</h2>
        <p>This page may have expired or the agent hasn't generated it yet.</p>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
