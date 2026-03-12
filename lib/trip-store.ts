// Simple in-memory store for generated trip pages.
// Pages persist for the lifetime of the server process.

const store = new Map<string, string>();

export function saveTripPage(id: string, html: string): void {
  store.set(id, html);
}

export function getTripPage(id: string): string | undefined {
  return store.get(id);
}

export function generateTripId(): string {
  return `trip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
