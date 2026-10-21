import type { WeatherData } from "../types";

const BASE_URL = "/api";

class WeatherService {
  async getCurrentWeather(location: string): Promise<WeatherData> {
    try {
      const weatherResponse = await fetch(
        `${BASE_URL}/weather?location=${encodeURIComponent(location)}`,
      );
      if (!weatherResponse.ok) {
        throw new Error("Failed to fetch weather data");
      }
      return (await weatherResponse.json()) as WeatherData;
    } catch (error) {
      console.error("Weather service error:", error);

      // Return fallback data for demo purposes
      return {
        tempC: 32,
        humidity: 75,
        condition: "partly cloudy",
        rainProb24h: 0.3,
        wind: 12,
        forecastArray: [],
      };
    }
  }
}

export const weatherService = new WeatherService();
