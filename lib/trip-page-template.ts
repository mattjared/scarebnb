export interface TripPageData {
  property_name: string;
  tagline: string;
  location: string;
  city: string;
  country: string;
  price_per_night: number;
  nights: number;
  total_cost_usd: number;
  rating: number;
  scare_score: number;
  weirdness_score: number;
  ghost_sighting_frequency: string;
  host_name: string;
  host_response_vibe: string;
  amenities: string;
  house_rules: string;
  weather_summary: string;
  weather_temp_c: number;
  weather_condition: string;
  client_city?: string;
  client_weather_summary?: string;
  temperature_difference?: string;
  btc_needed?: string;
  satoshis_needed?: number;
  btc_verdict?: string;
  events: { name: string; date: string; description: string }[];
  packing_list: string[];
  agent_recommendation: string;
}

export function generateTripPageHTML(data: TripPageData, pageId: string): string {
  const eventsHTML = data.events.length > 0
    ? data.events.map(e => `
        <div style="margin-bottom:12px;padding:12px;background:#f8f8f8;border-radius:6px">
          <strong>${esc(e.name)}</strong> · <span style="color:#666">${esc(e.date)}</span>
          <div style="margin-top:4px;font-size:14px;color:#444">${esc(e.description)}</div>
        </div>`).join("")
    : "<p style='color:#999'>No events found for this location.</p>";

  const packingHTML = data.packing_list.length > 0
    ? `<ul style="columns:2;column-gap:24px;padding-left:20px">${data.packing_list.map(item => `<li style="margin-bottom:6px">${esc(item)}</li>`).join("")}</ul>`
    : "";

  const btcSection = data.btc_needed
    ? `<div style="margin-top:24px;padding:20px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px">
        <h3 style="margin:0 0 8px;font-size:16px">₿ Bitcoin Cost</h3>
        <div style="font-size:28px;font-weight:700;color:#ea580c">${esc(data.btc_needed)} BTC</div>
        <div style="font-size:14px;color:#666;margin-top:4px">${(data.satoshis_needed || 0).toLocaleString()} satoshis</div>
        <div style="font-size:14px;color:#888;margin-top:8px;font-style:italic">${esc(data.btc_verdict || "")}</div>
      </div>`
    : "";

  const weatherCompareSection = data.client_city
    ? `<div style="margin-top:16px;padding:16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px">
        <strong>vs. ${esc(data.client_city)}:</strong> ${esc(data.client_weather_summary || "")}
        <div style="font-size:14px;color:#666;margin-top:4px">${esc(data.temperature_difference || "")}</div>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(data.property_name)} — ScareBNB Trip</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#171717;background:#fff;line-height:1.6}
    .hero{padding:48px 24px;text-align:center;border-bottom:1px solid #eee}
    .hero h1{font-size:32px;margin-bottom:4px}
    .hero .tagline{font-style:italic;color:#666;font-size:18px;margin-bottom:16px}
    .hero .location{font-size:14px;color:#999}
    .content{max-width:680px;margin:0 auto;padding:32px 24px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:24px 0}
    .stat{padding:16px;border:1px solid #eee;border-radius:8px;text-align:center}
    .stat .value{font-size:24px;font-weight:700}
    .stat .label{font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px}
    h2{font-size:20px;margin:32px 0 12px;padding-top:24px;border-top:1px solid #eee}
    h2:first-of-type{border-top:none;padding-top:0}
    .weather-box{padding:20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px}
    .weather-big{font-size:36px;font-weight:700}
    .recommendation{margin-top:32px;padding:24px;background:#fefce8;border:1px solid #fef08a;border-radius:8px;font-size:15px}
    .footer{text-align:center;padding:32px;font-size:12px;color:#ccc;border-top:1px solid #eee;margin-top:48px}
    .share-bar{padding:12px 24px;background:#f8f8f8;text-align:center;font-size:13px;color:#888}
  </style>
</head>
<body>
  <div class="share-bar">🔗 Shareable trip page · <strong>${esc(pageId)}</strong></div>

  <div class="hero">
    <h1>${esc(data.property_name)}</h1>
    <div class="tagline">"${esc(data.tagline)}"</div>
    <div class="location">${esc(data.location)} · ${esc(data.city)}, ${esc(data.country)}</div>
  </div>

  <div class="content">
    <div class="grid">
      <div class="stat">
        <div class="value">$${data.price_per_night}</div>
        <div class="label">Per Night</div>
      </div>
      <div class="stat">
        <div class="value">$${data.total_cost_usd}</div>
        <div class="label">${data.nights} Night${data.nights > 1 ? "s" : ""} Total</div>
      </div>
      <div class="stat">
        <div class="value">${data.scare_score}/10</div>
        <div class="label">Scare Score</div>
      </div>
      <div class="stat">
        <div class="value">${data.weirdness_score}/10</div>
        <div class="label">Weirdness</div>
      </div>
      <div class="stat">
        <div class="value">${data.rating}</div>
        <div class="label">Rating</div>
      </div>
      <div class="stat">
        <div class="value">${esc(data.ghost_sighting_frequency)}</div>
        <div class="label">Ghost Activity</div>
      </div>
    </div>

    <h2>🌦 Weather</h2>
    <div class="weather-box">
      <div class="weather-big">${data.weather_temp_c}°C</div>
      <div style="color:#666;margin-top:4px">${esc(data.weather_condition)}</div>
      <div style="font-size:14px;color:#888;margin-top:4px">${esc(data.weather_summary)}</div>
    </div>
    ${weatherCompareSection}
    ${btcSection}

    <h2>🎪 Nearby Events</h2>
    ${eventsHTML}

    <h2>🧳 Packing List</h2>
    ${packingHTML}

    <h2>🏠 The Host</h2>
    <div style="padding:16px;background:#f8f8f8;border-radius:8px">
      <strong>${esc(data.host_name)}</strong>
      <div style="font-size:14px;color:#666;margin-top:4px">Communication style: ${esc(data.host_response_vibe)}</div>
    </div>

    <h2>📋 Amenities</h2>
    <p>${esc(data.amenities)}</p>

    <h2>📜 House Rules</h2>
    <p style="font-style:italic;color:#444">${esc(data.house_rules)}</p>

    <div class="recommendation">
      <strong>🔮 Agent's Take:</strong><br>
      ${esc(data.agent_recommendation)}
    </div>
  </div>

  <div class="footer">
    Generated by ScareBNB Agent · Every stay comes with a story
  </div>
</body>
</html>`;
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
