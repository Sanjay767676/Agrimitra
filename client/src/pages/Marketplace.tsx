import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";

export default function Marketplace() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const [trending, setTrending] = useState<{ pesticides: any[]; equipment: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        if (profile?.location) qs.set("location", profile.location);
        if (profile?.cropType) qs.set("crop", profile.cropType);
        const resp = await fetch(`/api/market/trending${qs.toString() ? `?${qs.toString()}` : ""}`);
        if (resp.ok) {
          const data = await resp.json();
          setTrending(data);
        } else {
          setTrending({ pesticides: [], equipment: [] });
        }
      } catch {
        setTrending({ pesticides: [], equipment: [] });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.location, profile?.cropType]);

  const categories = [
    {
      icon: "fas fa-tractor",
      title: t("marketplace.equipment"),
      description: "Tractors, tools, machinery",
      key: "equipment",
    },
    {
      icon: "fas fa-seedling",
      title: t("marketplace.seeds"),
      description: "Quality seeds, saplings",
      key: "seeds",
    },
    {
      icon: "fas fa-vial",
      title: t("marketplace.fertilizers"),
      description: "Organic & chemical fertilizers",
      key: "fertilizers",
    },
    {
      icon: "fas fa-apple-alt",
      title: t("marketplace.produce"),
      description: "Fresh crops, direct from farm",
      key: "produce",
    },
  ];

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">{t("marketplace.title")}</h2>
          <p className="text-muted-foreground">{t("marketplace.subtitle")}</p>
        </div>

        {/* Marketplace Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {categories.map((category, index) => (
            <Card key={index} className="shadow-lg text-center hover:shadow-xl transition-shadow cursor-pointer" onClick={async () => {
              try {
                const resp = await fetch(`/api/market/products?category=${category.key}`);
                const data = await resp.json();
                setTrending({
                  pesticides: trending?.pesticides || [],
                  equipment: (data.products || []).map((p: any) => ({ name: p.name, use: p.category, tip: p.url }))
                });
              } catch {}
            }}>
              <CardContent className="p-6">
                <i className={`${category.icon} text-primary text-3xl mb-4`}></i>
                <h3 className="font-semibold text-foreground mb-2">{category.title}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trending via AI */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t("marketplace.trendingTitle", { defaultValue: "Trending for your region" })}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-muted-foreground">{t("loading", { defaultValue: "Loading..." })}</p>}
            {!loading && trending && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">{t("marketplace.trendingPesticides", { defaultValue: "Pesticides" })}</h3>
                  <ul className="space-y-2">
                    {(trending.pesticides || []).map((p: any, idx: number) => (
                      <li key={idx} className="p-3 rounded-md border border-border">
                        <div className="font-medium text-foreground">{p.name}</div>
                        {p.use && <div className="text-sm text-muted-foreground">{p.use}</div>}
                        <a className="text-xs text-primary mt-1 inline-block" href={`https://www.amazon.in/s?k=${encodeURIComponent(p.name)}`} target="_blank" rel="noreferrer">Buy</a>
                      </li>
                    ))}
                    {(!trending.pesticides || trending.pesticides.length === 0) && (
                      <li className="text-sm text-muted-foreground">{t("marketplace.noPesticides", { defaultValue: "No suggestions available" })}</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">{t("marketplace.trendingEquipment", { defaultValue: "Equipment" })}</h3>
                  <ul className="space-y-2">
                    {(trending.equipment || []).map((e: any, idx: number) => (
                      <li key={idx} className="p-3 rounded-md border border-border">
                        <div className="font-medium text-foreground">{e.name}</div>
                        {e.use && <div className="text-sm text-muted-foreground">{e.use}</div>}
                        <a className="text-xs text-primary mt-1 inline-block" href={`https://www.amazon.in/s?k=${encodeURIComponent(e.name)}`} target="_blank" rel="noreferrer">Buy</a>
                      </li>
                    ))}
                    {(!trending.equipment || trending.equipment.length === 0) && (
                      <li className="text-sm text-muted-foreground">{t("marketplace.noEquipment", { defaultValue: "No suggestions available" })}</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
