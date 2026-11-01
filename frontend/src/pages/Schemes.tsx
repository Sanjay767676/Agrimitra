import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { schemesService, type SchemeItem } from "../services/schemesService";

export default function Schemes() {
  const { t, i18n } = useTranslation();
  const [schemes, setSchemes] = useState<SchemeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  const currentLang = (i18n.language || "en").slice(0, 2).toLowerCase();

  const categories = [
    { label: t("schemes.all", { defaultValue: "All" }), value: "" },
    { label: t("schemes.incomeSupport", { defaultValue: "Income Support" }), value: "income" },
    { label: t("schemes.cropInsurance", { defaultValue: "Crop Insurance" }), value: "insurance" },
    { label: t("schemes.creditLoans", { defaultValue: "Credit & Loans" }), value: "credit" },
    { label: t("schemes.irrigation", { defaultValue: "Irrigation" }), value: "irrigation" },
    { label: t("schemes.equipment", { defaultValue: "Equipment / Machinery" }), value: "equipment" },
    { label: t("schemes.fertilizers", { defaultValue: "Fertilizers & Soil" }), value: "fertilizers" },
  ];

  const fetchSchemes = useCallback(
    async (cat = activeCategory, q = searchQuery) => {
      setLoading(true);
      try {
        const data = await schemesService.list({
          category: cat || undefined,
          q: q || undefined,
          lang: currentLang,
        });
        setSchemes(data);
      } catch (e) {
        console.error("Failed to load schemes:", e);
        setSchemes([]);
      } finally {
        setLoading(false);
      }
    },
    [activeCategory, searchQuery, currentLang]
  );

  useEffect(() => {
    fetchSchemes(activeCategory, searchQuery);
  }, [fetchSchemes]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSchemes(activeCategory, searchQuery);
  };

  const handleCategorySelect = (val: string) => {
    const next = activeCategory === val ? "" : val;
    setActiveCategory(next);
    fetchSchemes(next, searchQuery);
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-3">
            <i className="fas fa-landmark"></i>
            {t("schemes.badge", { defaultValue: "National & State Portals" })}
          </span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            {t("schemes.title", { defaultValue: "Government Welfare Schemes" })}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            {t(
              "schemes.subtitle",
              { defaultValue: "Verified agricultural subsidies, credit support, crop insurance, and solar equipment assistance with live translated guidelines." }
            )}
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="bg-card rounded-2xl p-4 md:p-6 border border-border shadow-sm mb-8 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
              <Input
                placeholder={t("schemes.searchPlaceholder", { defaultValue: "Search schemes (e.g. Kisan, Drip, Subsidy, Insurance)..." })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
                data-testid="input-schemes-search"
              />
            </div>
            <Button type="submit" className="rounded-xl px-5" data-testid="button-schemes-search">
              <i className="fas fa-search mr-1.5 hidden sm:inline"></i>
              {t("common.search", { defaultValue: "Search" })}
            </Button>
          </form>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {categories.map((c) => {
              const active = activeCategory === c.value;
              return (
                <Button
                  key={c.value}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  className="rounded-full text-xs h-8 transition-all"
                  onClick={() => handleCategorySelect(c.value)}
                  data-testid={`chip-scheme-${c.value || "all"}`}
                >
                  {c.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Schemes List */}
        {loading && (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="rounded-2xl border border-border p-6 space-y-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-8 w-28" />
              </Card>
            ))}
          </div>
        )}

        {!loading && schemes.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {schemes.map((s, idx) => (
              <Card
                key={s.id || idx}
                className="rounded-2xl border border-border hover:border-primary/40 hover:shadow-organic transition-all duration-300 flex flex-col justify-between bg-card group"
                data-testid={`card-scheme-${idx}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {s.ministry || s.state || "National Scheme"}
                    </span>
                    {(s.benefits || s.benefit) && (
                      <span className="text-xs font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                        {s.benefits || s.benefit}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg md:text-xl font-heading font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {s.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.description}
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-border/60">
                    <span className="text-xs text-muted-foreground">
                      <i className="fas fa-shield-halved text-primary mr-1"></i>
                      {t("schemes.officialPortal", { defaultValue: "Official Portal" })}
                    </span>
                    <a
                      href={s.applicationUrl || s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground py-2 px-3.5 rounded-xl transition-colors"
                      data-testid={`link-apply-scheme-${idx}`}
                    >
                      <span>{t("schemes.applyViewScheme", { defaultValue: "Apply / View Scheme" })}</span>
                      <i className="fas fa-arrow-up-right-from-square text-[10px]"></i>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && schemes.length === 0 && (
          <Card className="rounded-2xl border border-dashed border-border p-12 text-center">
            <i className="fas fa-landmark text-4xl text-muted-foreground/40 mb-3"></i>
            <p className="text-muted-foreground font-medium">
              {t("schemes.noSchemes", { defaultValue: "No matching government schemes found" })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("schemes.tryDifferent", { defaultValue: "Try searching with different terms or selecting another category filter." })}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
