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

  const currentLang = (i18n.language || "en").slice(0, 2).toLowerCase();

  // Farm input parameters
  const [location, setLocation] = useState(profile?.location || "Coimbatore, Tamil Nadu");
  const [landArea, setLandArea] = useState<number>(Number(profile?.landSize) || 2);
  const [landUnit, setLandUnit] = useState<string>(profile?.landUnit || "acres");
  const [previousCrop, setPreviousCrop] = useState<string>("Paddy (Rice)");
  const [soilType, setSoilType] = useState<string>(profile?.soilType || "Clay loam");
  const [irrigation, setIrrigation] = useState<string>(profile?.irrigation || "Drip");

  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Initial load and re-fetch when language changes
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const previousCropOptions = [
    { value: "Paddy (Rice)", label: currentLang === "ta" ? "நெல் / அரிசி (Paddy)" : "Paddy (Rice)" },
    { value: "Sugarcane", label: currentLang === "ta" ? "கரும்பு (Sugarcane)" : "Sugarcane" },
    { value: "Cotton", label: currentLang === "ta" ? "பருத்தி (Cotton)" : "Cotton" },
    { value: "Maize (Corn)", label: currentLang === "ta" ? "மக்காச்சோளம் (Maize)" : "Maize (Corn)" },
    { value: "Banana", label: currentLang === "ta" ? "வாழை (Banana)" : "Banana" },
    { value: "Turmeric", label: currentLang === "ta" ? "மஞ்சள் (Turmeric)" : "Turmeric" },
    { value: "Groundnut", label: currentLang === "ta" ? "வேர்க்கடலை (Groundnut)" : "Groundnut" },
    { value: "Vegetables (Tomato/Brinjal)", label: currentLang === "ta" ? "காய்கறிகள் (Vegetables)" : "Vegetables (Tomato/Brinjal)" },
  ];

  const soilTypeOptions = [
    { value: "Clay loam", label: currentLang === "ta" ? "களிமண் வண்டல் (Clay Loam)" : "Clay Loam" },
    { value: "Red soil", label: currentLang === "ta" ? "செம்மண் (Red Loamy)" : "Red Loamy" },
    { value: "Black cotton soil", label: currentLang === "ta" ? "கரிசல் மண் (Black Cotton Soil)" : "Black Cotton Soil" },
    { value: "Alluvial soil", label: currentLang === "ta" ? "வண்டல் மண் (Alluvial Soil)" : "Alluvial Soil" },
    { value: "Sandy loam", label: currentLang === "ta" ? "மணல் வண்டல் (Sandy Loam)" : "Sandy Loam" },
  ];

  const irrigationOptions = [
    { value: "Drip", label: currentLang === "ta" ? "சொட்டு நீர்ப்பாசனம் (Drip)" : "Drip Irrigation" },
    { value: "Canal / Flood", label: currentLang === "ta" ? "கால்வாய் / படுகை (Canal/Flood)" : "Canal / Basin" },
    { value: "Borewell / Sprinkler", label: currentLang === "ta" ? "ஆழ்துளை கிணறு / தெளிப்பான் (Borewell/Sprinkler)" : "Borewell Sprinkler" },
    { value: "Rainfed", label: currentLang === "ta" ? "மழை சார்ந்த பயிர் (Rainfed)" : "Rainfed" },
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
                    {t("dashboard.farmProfileTitle", { defaultValue: "Farm Parameters & Agronomic Profile" })}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.farmProfileSubtitle", { defaultValue: "Adjust your land parameters to calculate realistic yields" })}
                  </p>
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
                  {t("dashboard.location", { defaultValue: "Location" })}
                </label>
                <div className="relative">
                  <i className="fas fa-location-dot absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"></i>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t("dashboard.locationPlaceholder", { defaultValue: "e.g. Coimbatore, Tamil Nadu" })}
                    className="pl-8 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Land Area */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  {t("dashboard.landArea", { defaultValue: "Land Area" })}
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
                      <SelectItem value="acres">{t("units.acres", { defaultValue: "Acres" })}</SelectItem>
                      <SelectItem value="hectares">{t("units.hectares", { defaultValue: "Hectares" })}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Previous Crop */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  {t("dashboard.previousCrop", { defaultValue: "Previous Crop" })}
                </label>
                <Select value={previousCrop} onValueChange={(v) => setPreviousCrop(v)}>
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {previousCropOptions.map((crop) => (
                      <SelectItem key={crop.value} value={crop.value}>
                        {crop.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Soil Type */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  {t("dashboard.soilType", { defaultValue: "Soil Type" })}
                </label>
                <Select value={soilType} onValueChange={(v) => setSoilType(v)}>
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {soilTypeOptions.map((soil) => (
                      <SelectItem key={soil.value} value={soil.value}>
                        {soil.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Irrigation */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  {t("dashboard.irrigation", { defaultValue: "Irrigation" })}
                </label>
                <Select value={irrigation} onValueChange={(v) => setIrrigation(v)}>
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {irrigationOptions.map((irr) => (
                      <SelectItem key={irr.value} value={irr.value}>
                        {irr.label}
                      </SelectItem>
                    ))}
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
                    <i className="fas fa-spinner fa-spin mr-2"></i> {t("dashboard.analyzing", { defaultValue: "Analyzing Rotation & Mandi Rates..." })}
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-magic-sparkles mr-2"></i> {t("dashboard.suggestBtn", { defaultValue: "Suggest Best 3 Crops" })}
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
                <span>{t("dashboard.recommendedHeading", { defaultValue: "Recommended Crops for Rotation" })}</span>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                  {t("dashboard.after", { defaultValue: "After" })} {previousCrop}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("dashboard.tailoredFor", { defaultValue: "Scientific crop rotation tailored for" })} {landArea} {landUnit} in {location}
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
              {recommendations.map((crop, idx) => {
                const displayName =
                  currentLang !== "en" && crop.cropNameLocal ? crop.cropNameLocal : crop.cropName;
                const secondaryName =
                  currentLang !== "en" && crop.cropNameLocal ? crop.cropName : "";

                return (
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
                            {crop.suitabilityScore}% {t("dashboard.match", { defaultValue: "Match" })}
                          </span>
                        </div>

                        <h4 className="text-xl font-heading font-bold text-foreground">
                          {displayName}
                        </h4>
                        {secondaryName && (
                          <p className="text-sm font-medium text-muted-foreground mt-0.5">
                            {secondaryName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("dashboard.variety", { defaultValue: "Recommended Variety" })}:{" "}
                          <span className="font-semibold text-foreground">{crop.variety}</span>
                        </p>
                      </div>

                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3 p-6 pb-4">
                        {/* Duration */}
                        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80">
                          <div className="text-[11px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
                            <i className="fas fa-clock text-accent"></i> {t("dashboard.duration", { defaultValue: "Duration" })}
                          </div>
                          <div className="text-lg font-bold text-foreground">
                            {crop.durationMonths} {t("dashboard.months", { defaultValue: "Months" })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ({crop.durationDays} {t("dashboard.daysToHarvest", { defaultValue: "days to harvest" })})
                          </div>
                        </div>

                        {/* Total Expected Yield */}
                        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80">
                          <div className="text-[11px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
                            <i className="fas fa-weight-hanging text-primary"></i> {t("dashboard.totalYield", { defaultValue: "Total Yield" })}
                          </div>
                          <div className="text-lg font-bold text-primary">
                            {crop.expectedYield.totalYield} {crop.expectedYield.unit}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ({crop.expectedYield.perAcre} {t("dashboard.perAcre", { defaultValue: "Q/Acre" })})
                          </div>
                        </div>

                        {/* Current Mandi Price */}
                        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80">
                          <div className="text-[11px] uppercase font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
                            <i className="fas fa-tag text-emerald-600"></i> {t("dashboard.mandiRate", { defaultValue: "Mandi Rate" })}
                          </div>
                          <div className="text-lg font-bold text-foreground">
                            ₹{crop.economics.currentMandiPricePerQuintal.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate" title={crop.economics.mandiSource}>
                            {t("dashboard.mandiPerQuintal", { defaultValue: "/ quintal (APMC)" })}
                          </div>
                        </div>

                        {/* Estimated Net Profit */}
                        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                          <div className="text-[11px] uppercase font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                            <i className="fas fa-chart-line text-emerald-600"></i> {t("dashboard.netProfit", { defaultValue: "Net Profit" })}
                          </div>
                          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{crop.economics.netEstimatedProfit.toLocaleString()}
                          </div>
                          <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                            {crop.economics.roiPercent}% {t("dashboard.return", { defaultValue: "Return" })}
                          </div>
                        </div>
                      </div>

                      {/* Financial Summary Strip */}
                      <div className="px-6 pb-4">
                        <div className="p-3 rounded-2xl bg-card border border-border flex items-center justify-between text-xs">
                          <div>
                            <span className="text-muted-foreground">{t("dashboard.grossRevenue", { defaultValue: "Gross Revenue" })}:</span>{" "}
                            <span className="font-semibold text-foreground">
                              ₹{crop.economics.totalGrossRevenue.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-3 w-px bg-border"></div>
                          <div>
                            <span className="text-muted-foreground">{t("dashboard.estCost", { defaultValue: "Est. Cost" })}:</span>{" "}
                            <span className="font-semibold text-muted-foreground">
                              ₹{crop.economics.totalEstimatedCost.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rotation Rationale */}
                      <div className="px-6 pb-4">
                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <i className="fas fa-rotate text-primary"></i> {t("dashboard.whyAfter", { defaultValue: "Why After" })} {previousCrop}?
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
                            <span>{t("dashboard.cultivationSchedule", { defaultValue: "Cultivation Schedule" })}</span>
                            <span className="text-[11px] font-normal text-muted-foreground">
                              {t("dashboard.stages", { defaultValue: "4 Key Stages" })}
                            </span>
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
