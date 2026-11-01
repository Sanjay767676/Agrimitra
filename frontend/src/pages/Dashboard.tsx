import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "../hooks/useProfile";
import { useWeather } from "../hooks/useWeather";

interface CropRecommendation {
  id: string;
  cropName: string;
  cropNameLocal: string;
  variety: string;
  durationMonths: number;
  durationDays: number;
  season: string;
  suitabilityScore: number;
  expectedYield: {
    perAcre: number;
    totalYield: number;
    unit: string;
  };
  economics: {
    currentMandiPricePerQuintal: number;
    mandiSource: string;
    estimatedCostPerAcre: number;
    totalGrossRevenue: number;
    totalEstimatedCost: number;
    netEstimatedProfit: number;
    roiPercent: number;
  };
  agronomicReasons: string[];
  waterRequirement: "Low" | "Medium" | "High";
  riskLevel: "Low" | "Moderate";
  cultivationRoadmap: {
    stage: string;
    timeline: string;
    activities: string;
  }[];
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { profile } = useProfile();
  const { weather, isLoading: weatherLoading } = useWeather();

  // Farm input parameters
  const [location, setLocation] = useState(profile?.location || "Coimbatore, Tamil Nadu");
  const [landArea, setLandArea] = useState<number>(Number(profile?.landSize) || 2);
  const [landUnit, setLandUnit] = useState<string>(profile?.landUnit || "acres");
  const [previousCrop, setPreviousCrop] = useState<string>("Paddy (Rice)");
  const [soilType, setSoilType] = useState<string>(profile?.soilType || "Clay loam");
  const [irrigation, setIrrigation] = useState<string>(profile?.irrigation || "Drip");

  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTabRoadmap, setActiveTabRoadmap] = useState<Record<string, number>>({});

  const currentLang = profile?.chatbotLanguage || i18n.language || "en";

  // Sync with profile if updated
  useEffect(() => {
    if (profile) {
      if (profile.location) setLocation(profile.location);
      if (profile.landSize) setLandArea(Number(profile.landSize) || 2);
      if (profile.landUnit) setLandUnit(profile.landUnit);
      if (profile.soilType) setSoilType(profile.soilType);
      if (profile.irrigation) setIrrigation(profile.irrigation);
    }
  }, [profile]);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/crop/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          landArea,
          landUnit,
          previousCrop,
          soilType,
          irrigation,
          weather: weather
            ? {
                tempC: weather.tempC,
                humidity: weather.humidity,
                condition: weather.condition,
                rainProb: weather.rainProb24h,
              }
            : null,
          lang: currentLang,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (e) {
      console.error("Failed to load crop recommendations:", e);
    } finally {
      setLoading(false);
    }
  }, [location, landArea, landUnit, previousCrop, soilType, irrigation, weather, currentLang]);

  // Initial load
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const previousCropOptions = [
    "Paddy (Rice)",
    "Sugarcane",
    "Cotton",
    "Maize (Corn)",
    "Banana",
    "Turmeric",
    "Groundnut",
    "Vegetables (Tomato/Brinjal)",
  ];

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-3">
            <i className="fas fa-seedling"></i>
            {t("dashboard.badge", { defaultValue: "Agronomic AI Advisory & Mandi Analytics" })}
          </span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            {t("dashboard.title", { defaultValue: "Crop Suggestion & Yield Analytics" })}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            {t(
              "dashboard.subtitle",
              { defaultValue: "Tailored crop suggestions considering your previous crop rotation, land area, current weather patterns, and real-time Mandi market rates." }
            )}
          </p>
        </div>

        {/* Input Parameters Card */}
        <Card className="rounded-3xl border border-border shadow-sm mb-10 bg-card overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-border/60 py-4 px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm">
                  <i className="fas fa-sliders"></i>
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg font-heading font-bold">
                    Farm Parameters & Agronomic Profile
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Adjust your land parameters to calculate realistic yields</p>
                </div>
              </div>

              {/* Weather Quick Glance */}
              <div className="flex items-center gap-3 bg-background/80 backdrop-blur px-3 py-1.5 rounded-2xl border border-border text-xs">
                <i className="fas fa-cloud-sun text-accent text-base"></i>
                <div>
                  <span className="font-bold text-foreground">
                    {weatherLoading ? "..." : `${weather?.tempC || 28}°C`}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    • {weather?.condition || "Partly cloudy"} • {Math.round((weather?.rainProb24h || 0.3) * 100)}% rain
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Location */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Location
                </label>
                <div className="relative">
                  <i className="fas fa-location-dot absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"></i>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Coimbatore, Tamil Nadu"
                    className="pl-8 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Land Area */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Land Area
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={landArea}
                    onChange={(e) => setLandArea(Number(e.target.value) || 1)}
                    className="rounded-xl text-sm"
                  />
                  <Select value={landUnit} onValueChange={(v) => setLandUnit(v)}>
                    <SelectTrigger className="w-24 rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acres">Acres</SelectItem>
                      <SelectItem value="hectares">Hectares</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Previous Crop */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Previous Crop
                </label>
                <Select value={previousCrop} onValueChange={(v) => setPreviousCrop(v)}>
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {previousCropOptions.map((crop) => (
                      <SelectItem key={crop} value={crop}>
                        {crop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Soil Type */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Soil Type
                </label>
                <Select value={soilType} onValueChange={(v) => setSoilType(v)}>
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Clay loam">Clay Loam</SelectItem>
                    <SelectItem value="Red soil">Red Loamy</SelectItem>
                    <SelectItem value="Black cotton soil">Black Cotton Soil</SelectItem>
                    <SelectItem value="Alluvial soil">Alluvial Soil</SelectItem>
                    <SelectItem value="Sandy loam">Sandy Loam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Irrigation */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Irrigation
                </label>
                <Select value={irrigation} onValueChange={(v) => setIrrigation(v)}>
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Drip">Drip Irrigation</SelectItem>
                    <SelectItem value="Canal / Flood">Canal / Basin</SelectItem>
                    <SelectItem value="Borewell / Sprinkler">Borewell Sprinkler</SelectItem>
                    <SelectItem value="Rainfed">Rainfed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={fetchRecommendations}
                disabled={loading}
                className="rounded-xl px-6 py-2.5 font-medium shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i> Analyzing Rotation & Mandi Rates...
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-magic-sparkles mr-2"></i> Suggest Best 3 Crops
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Crop Recommendations Section */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
                <span>Recommended Crops for Rotation</span>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                  After {previousCrop}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Scientific crop rotation tailored for {landArea} {landUnit} in {location}
              </p>
            </div>
          </div>

          {loading && (
            <div className="grid lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="rounded-3xl border border-border p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-32 w-full" />
                </Card>
              ))}
            </div>
          )}

          {!loading && recommendations.length > 0 && (
            <div className="grid lg:grid-cols-3 gap-6">
              {recommendations.map((crop, idx) => (
                <Card
                  key={crop.id || idx}
                  className="rounded-3xl border border-border hover:border-primary/50 shadow-sm hover:shadow-organic transition-all duration-300 flex flex-col justify-between bg-card overflow-hidden"
                >
                  <div>
                    {/* Crop Card Header */}
                    <div className="p-6 pb-4 border-b border-border/60 bg-muted/20">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {crop.season}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          {crop.suitabilityScore}% Match
                        </span>
                      </div>

                      <h4 className="text-xl font-heading font-bold text-foreground">
                        {crop.cropName}
                      </h4>
                      {crop.cropNameLocal && crop.cropNameLocal !== crop.cropName && (
                        <p className="text-sm font-medium text-primary mt-0.5">
                          {crop.cropNameLocal}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended Variety: <span className="font-semibold text-foreground">{crop.variety}</span>
                      </p>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 p-6 pb-4">
                      {/* Duration */}
                      <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80">
                        <div className="text-[11px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
                          <i className="fas fa-clock text-accent"></i> Duration
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {crop.durationMonths} Months
                        </div>
                        <div className="text-xs text-muted-foreground">({crop.durationDays} days to harvest)</div>
                      </div>

                      {/* Total Expected Yield */}
                      <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80">
                        <div className="text-[11px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
                          <i className="fas fa-weight-hanging text-primary"></i> Total Yield
                        </div>
                        <div className="text-lg font-bold text-primary">
                          {crop.expectedYield.totalYield} {crop.expectedYield.unit}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({crop.expectedYield.perAcre} Q/Acre)
                        </div>
                      </div>

                      {/* Current Mandi Price */}
                      <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80">
                        <div className="text-[11px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
                          <i className="fas fa-tag text-emerald-600"></i> Mandi Rate
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          ₹{crop.economics.currentMandiPricePerQuintal.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate" title={crop.economics.mandiSource}>
                          / quintal (APMC)
                        </div>
                      </div>

                      {/* Estimated Net Profit */}
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                        <div className="text-[11px] uppercase font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                          <i className="fas fa-chart-line text-emerald-600"></i> Net Profit
                        </div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{crop.economics.netEstimatedProfit.toLocaleString()}
                        </div>
                        <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                          {crop.economics.roiPercent}% Return
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary Strip */}
                    <div className="px-6 pb-4">
                      <div className="p-3 rounded-2xl bg-card border border-border flex items-center justify-between text-xs">
                        <div>
                          <span className="text-muted-foreground">Gross Revenue:</span>{" "}
                          <span className="font-semibold text-foreground">
                            ₹{crop.economics.totalGrossRevenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-3 w-px bg-border"></div>
                        <div>
                          <span className="text-muted-foreground">Est. Cost:</span>{" "}
                          <span className="font-semibold text-muted-foreground">
                            ₹{crop.economics.totalEstimatedCost.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rotation Rationale */}
                    <div className="px-6 pb-4">
                      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <i className="fas fa-rotate text-primary"></i> Why After {previousCrop}?
                      </h5>
                      <ul className="space-y-1.5 text-xs text-foreground/90">
                        {crop.agronomicReasons.map((reason, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2">
                            <i className="fas fa-check text-primary text-[10px] mt-1 shrink-0"></i>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Cultivation Timeline Roadmap */}
                    {crop.cultivationRoadmap && crop.cultivationRoadmap.length > 0 && (
                      <div className="px-6 pb-6 border-t border-border/60 pt-4">
                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center justify-between">
                          <span>Cultivation Schedule</span>
                          <span className="text-[11px] font-normal text-muted-foreground">4 Key Stages</span>
                        </h5>

                        <div className="space-y-2">
                          {crop.cultivationRoadmap.map((stage, sIdx) => (
                            <div key={sIdx} className="p-2.5 rounded-xl bg-muted/20 border border-border text-xs">
                              <div className="flex items-center justify-between font-semibold text-foreground mb-0.5">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold">
                                    {sIdx + 1}
                                  </span>
                                  {stage.stage}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-normal bg-background px-2 py-0.5 rounded-md border border-border">
                                  {stage.timeline}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-[11px] pl-5">{stage.activities}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
