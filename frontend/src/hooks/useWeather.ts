import { useQuery } from "@tanstack/react-query";
import { weatherService } from "../services/weatherService";
import { useProfile } from "./useProfile";
import type { WeatherData, Alert } from "../types";

export function useWeather() {
  const { profile } = useProfile();

  const { data: weather, isLoading } = useQuery({
    queryKey: ["weather", profile?.location],
    queryFn: () => weatherService.getCurrentWeather(profile?.location || "Kerala, India"),
    enabled: !!profile,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 3 * 60 * 1000, // Consider data stale after 3 minutes
  });

  // Generate alerts based on weather and profile
  const alerts: Alert[] = [];
  if (weather && profile) {
    // High temperature alert
    if (weather.tempC > 35) {
      alerts.push({
        id: "temp-high",
        type: "weather",
        severity: "medium",
        title: "High Temperature",
        description: `Temperature above 35°C (${weather.tempC}°C). Consider increasing irrigation frequency.`,
        isRead: false,
        createdAt: new Date(),
      });
    }

    // Heavy rain alert
    if (weather.rainProb24h > 0.6) {
      alerts.push({
        id: "rain-heavy",
        type: "weather",
        severity: "high",
        title: "Heavy Rain Alert",
        description: "Rain expected in next 6 hours. Delay irrigation and spraying.",
        isRead: false,
        createdAt: new Date(),
      });
    }

    // Pest risk alert (high humidity + specific crops)
    if (weather.humidity > 85 && profile.cropType === "rice") {
      alerts.push({
        id: "pest-risk",
        type: "pest",
        severity: "low",
        title: "Pest Outbreak Risk",
        description: "High humidity favorable for pest growth. Monitor crops closely.",
        isRead: false,
        createdAt: new Date(),
      });
    }
  }

  return {
    weather,
    alerts,
    isLoading,
  };
}
