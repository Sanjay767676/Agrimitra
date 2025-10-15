import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "../hooks/useProfile";
import { useWeather } from "../hooks/useWeather";

export default function Dashboard() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { weather, isLoading: weatherLoading } = useWeather();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loadingSchemes, setLoadingSchemes] = useState(false);
  const [yieldFormOpen, setYieldFormOpen] = useState(false);
  const [yieldInputs, setYieldInputs] = useState({ crop: profile?.cropType || "", area: "", unit: "hectare", variety: "", irrigation: profile?.irrigation || "", fertilizerLevel: "medium", sowingDate: "", location: profile?.location || "" });
  const [yieldResult, setYieldResult] = useState<{ perHectare: number; total: number; unit: string } | null>(null);

  useEffect(() => {
    const loadSchemes = async () => {
      setLoadingSchemes(true);
      try {
        const qs = new URLSearchParams();
        if (profile?.location) qs.set("state", profile.location);
        const resp = await fetch(`/api/schemes${qs.toString() ? `?${qs.toString()}` : ""}`);
        const data = await resp.json();
        setSchemes(data.schemes || []);
      } catch {
        setSchemes([]);
      } finally {
        setLoadingSchemes(false);
      }
    };
    loadSchemes();
  }, [profile?.location]);

  const submitYield = async () => {
    try {
      const resp = await fetch("/api/yield/estimate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(yieldInputs) });
      if (resp.status === 400) {
        const data = await resp.json();
        alert(`Missing: ${data.missing.join(", ")}`);
        return;
      }
      const data = await resp.json();
      setYieldResult(data);
      setYieldFormOpen(false);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">{t("dashboard.title")}</h2>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Crop Health Card */}
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.cropHealth")}</CardTitle>
              <i className="fas fa-leaf text-primary text-xl"></i>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2" data-testid="text-crop-health">
                92%
              </div>
              <p className="text-sm text-muted-foreground">Excellent condition</p>
            </CardContent>
          </Card>

          {/* Weather Forecast */}
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.weatherForecast")}</CardTitle>
              <i className="fas fa-cloud-sun text-accent text-xl"></i>
            </CardHeader>
            <CardContent>
              {weatherLoading ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <div className="text-3xl font-bold text-foreground mb-2" data-testid="text-weather-temp">
                  {weather?.tempC || 28}°C
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {weather?.condition || "Partly cloudy"}, {Math.round((weather?.rainProb24h || 0.4) * 100)}% rain
              </p>
            </CardContent>
          </Card>

          {/* Market Prices */}
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.marketPrice")}</CardTitle>
              <i className="fas fa-chart-line text-primary text-xl"></i>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-2" data-testid="text-market-price">
                ₹2,400
              </div>
              <p className="text-sm text-muted-foreground">
                Per quintal ({profile?.cropType ? t(`crops.${profile.cropType}`) : "rice"}) (↑5%)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Yield Analysis */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("dashboard.yieldAnalytics")}</CardTitle>
              <Button size="sm" onClick={() => setYieldFormOpen(true)}>Enter details</Button>
            </div>
          </CardHeader>
          <CardContent>
            {yieldResult ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-md border border-border">
                  <div className="text-sm text-muted-foreground">Per hectare</div>
                  <div className="text-2xl font-bold">{yieldResult.perHectare} {yieldResult.unit}</div>
                </div>
                <div className="p-4 rounded-md border border-border">
                  <div className="text-sm text-muted-foreground">Estimated total</div>
                  <div className="text-2xl font-bold">{yieldResult.total} {yieldResult.unit}</div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">Provide your crop details to estimate yield.</div>
            )}

            {yieldFormOpen && (
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input placeholder="Crop (e.g., rice)" value={yieldInputs.crop} onChange={e => setYieldInputs({ ...yieldInputs, crop: e.target.value })} />
                <div className="flex gap-2">
                  <Input placeholder="Area" value={yieldInputs.area} onChange={e => setYieldInputs({ ...yieldInputs, area: e.target.value })} />
                  <Input placeholder="Unit (hectare/acre)" value={yieldInputs.unit} onChange={e => setYieldInputs({ ...yieldInputs, unit: e.target.value })} />
                </div>
                <Input placeholder="Variety (optional)" value={yieldInputs.variety} onChange={e => setYieldInputs({ ...yieldInputs, variety: e.target.value })} />
                <Input placeholder="Irrigation (drip/sprinkler/flood)" value={yieldInputs.irrigation} onChange={e => setYieldInputs({ ...yieldInputs, irrigation: e.target.value })} />
                <Input placeholder="Fertilizer level (low/medium/high)" value={yieldInputs.fertilizerLevel} onChange={e => setYieldInputs({ ...yieldInputs, fertilizerLevel: e.target.value })} />
                <Input placeholder="Sowing date (YYYY-MM-DD)" value={yieldInputs.sowingDate} onChange={e => setYieldInputs({ ...yieldInputs, sowingDate: e.target.value })} />
                <Input placeholder="Location" value={yieldInputs.location} onChange={e => setYieldInputs({ ...yieldInputs, location: e.target.value })} />
                <div className="col-span-full flex gap-2">
                  <Button onClick={submitYield}>Estimate</Button>
                  <Button variant="ghost" onClick={() => setYieldFormOpen(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schemes */}
        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle>{t("dashboard.schemes", { defaultValue: "Schemes for you" })}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSchemes && <div className="text-muted-foreground">{t("loading", { defaultValue: "Loading..." })}</div>}
            {!loadingSchemes && (
              <div className="grid md:grid-cols-2 gap-4">
                {schemes.map((s, idx) => (
                  <a key={idx} href={s.applicationUrl || s.url} target="_blank" rel="noreferrer" className="p-4 rounded-md border border-border hover:bg-muted/40">
                    <div className="font-semibold text-foreground">{s.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{s.description}</div>
                  </a>
                ))}
                {schemes.length === 0 && <div className="text-sm text-muted-foreground">No schemes available</div>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
