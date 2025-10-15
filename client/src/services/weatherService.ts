const BASE_URL = "/api";

export interface WeatherResponse {
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
  };
  clouds: {
    all: number;
  };
  rain?: {
    "1h": number;
  };
}

export interface ForecastResponse {
  list: Array<{
    main: {
      temp: number;
      humidity: number;
    };
    weather: Array<{
      main: string;
      description: string;
    }>;
    pop: number; // Probability of precipitation
    dt_txt: string;
  }>;
}

class WeatherService {
  async getCurrentWeather(location: string) {
    try {
      const weatherResponse = await fetch(`${BASE_URL}/weather?location=${encodeURIComponent(location)}`);
      if (!weatherResponse.ok) {
        throw new Error("Failed to fetch weather data");
      }
      const data = await weatherResponse.json();
      return data;
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

  async getDetailedForecast(location: string, days: number = 5) {
    try {
      // Implementation for detailed forecast
      // This would return daily forecasts for the specified number of days
      return [];
    } catch (error) {
      console.error("Forecast service error:", error);
      return [];
    }
  }
}

export const weatherService = new WeatherService();
