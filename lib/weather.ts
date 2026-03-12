export interface WeatherResult {
  city: string;
  country?: string;
  temperature_c: number;
  temperature_f: number;
  condition: string;
  humidity: number;
  wind_kph: number;
  feels_like_c: number;
  source: string;
}

export async function getWeather(
  city: string,
  country?: string
): Promise<WeatherResult> {
  // Primary: wttr.in
  try {
    const location = country ? `${city},${country}` : city;
    const res = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      const current = data.current_condition?.[0];
      if (current) {
        return {
          city,
          country,
          temperature_c: parseInt(current.temp_C, 10),
          temperature_f: parseInt(current.temp_F, 10),
          condition: current.weatherDesc?.[0]?.value || "Unknown",
          humidity: parseInt(current.humidity, 10),
          wind_kph: parseInt(current.windspeedKmph, 10),
          feels_like_c: parseInt(current.FeelsLikeC, 10),
          source: "wttr.in",
        };
      }
    }
  } catch {
    // fall through to fallback
  }

  // Fallback: Open-Meteo (free, no key needed)
  try {
    // First geocode the city
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
      { signal: AbortSignal.timeout(3000) }
    );
    const geoData = await geoRes.json();
    const loc = geoData.results?.[0];
    if (loc) {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true`,
        { signal: AbortSignal.timeout(3000) }
      );
      const weatherData = await weatherRes.json();
      const cw = weatherData.current_weather;
      if (cw) {
        return {
          city,
          country,
          temperature_c: Math.round(cw.temperature),
          temperature_f: Math.round(cw.temperature * 9 / 5 + 32),
          condition: describeWeatherCode(cw.weathercode),
          humidity: 0, // Open-Meteo current_weather doesn't include humidity
          wind_kph: Math.round(cw.windspeed),
          feels_like_c: Math.round(cw.temperature),
          source: "open-meteo",
        };
      }
    }
  } catch {
    // fall through to error
  }

  return {
    city,
    country,
    temperature_c: 0,
    temperature_f: 32,
    condition: "Unable to fetch weather",
    humidity: 0,
    wind_kph: 0,
    feels_like_c: 0,
    source: "unavailable",
  };
}

function describeWeatherCode(code: number): string {
  const codes: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return codes[code] || "Unknown conditions";
}
