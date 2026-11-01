import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "../hooks/useProfile";

interface ScrapedProduct {
  name: string;
  price: string;
  rating?: string;
  imageUrl?: string;
  url: string;
  category: string;
}

export default function Marketplace() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const [activeCategory, setActiveCategory] = useState("equipment");
  const [activeSubQuery, setActiveSubQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<ScrapedProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [trending, setTrending] = useState<{ pesticides: any[]; equipment: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    {
      key: "equipment",
      title: t("marketplace.categories.equipment", { defaultValue: "Equipment" }),
      icon: "fas fa-tractor",
      description: "Tractors, tools, machinery",
      subItems: ["Power Tiller", "Sprayer", "Water Pump", "Seed Drill", "Thresher", "Cultivator"]
    },
    {
      key: "seeds",
      title: t("marketplace.categories.seeds", { defaultValue: "Seeds & Plants" }),
      icon: "fas fa-seedling",
      description: "Quality seeds, saplings",
      subItems: ["Hybrid Seeds", "Vegetable Seeds", "Fruit Saplings", "Organic Seeds", "Bio-Fertilizer Seeds"]
    },
    {
      key: "fertilizers",
      title: t("marketplace.categories.fertilizers", { defaultValue: "Fertilizers" }),
      icon: "fas fa-flask",
      description: "Organic & chemical fertilizers",
      subItems: ["Neem Cake", "Bio-Fertilizer", "NPK Fertilizer", "Urea Fertilizer", "Organic Compost", "Micronutrients"]
    },
    {
      key: "produce",
      title: t("marketplace.categories.produce", { defaultValue: "Crop Protection" }),
      icon: "fas fa-shield-halved",
      description: "Bio-pesticides, traps, netting",
      subItems: ["Neem Oil Spray", "Insect Trap", "Sticky Traps", "Pest Control Net", "Fungicide", "Weedicide"]
    }
  ];

  const fetchProducts = async (category: string, q = "") => {
    setProductsLoading(true);
    try {
      const params = new URLSearchParams({ category });
      if (q) params.set("q", q);
      const res = await fetch(`/api/market/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        setProducts([]);
      }
    } catch (e) {
      console.error("Failed to fetch market products:", e);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProducts("equipment");
  }, []);

  // Load regional trending via AI
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        if (profile?.location) qs.set("location", profile.location);
        if (profile?.cropType) qs.set("crop", profile.cropType);
        if (profile?.chatbotLanguage) qs.set("lang", profile.chatbotLanguage);
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
  }, [profile?.location, profile?.cropType, profile?.chatbotLanguage]);

  const handleCategoryClick = (catKey: string) => {
    setActiveCategory(catKey);
    setActiveSubQuery("");
    setSearchQuery("");
    fetchProducts(catKey);
  };

  const handleSubQueryClick = (sub: string) => {
    if (activeSubQuery === sub) {
      setActiveSubQuery("");
      fetchProducts(activeCategory);
    } else {
      setActiveSubQuery(sub);
      fetchProducts(activeCategory, sub);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveSubQuery("");
      fetchProducts(activeCategory, searchQuery.trim());
    }
  };

  const currentCategoryObj = categories.find((c) => c.key === activeCategory) || categories[0];

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-3">
            <i className="fas fa-store"></i>
            {t("marketplace.badge", { defaultValue: "Verified Agriculture Hub" })}
          </span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            {t("marketplace.title", { defaultValue: "Farming Marketplace" })}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            {t("marketplace.subtitle", { defaultValue: "Verified farm equipment, high-yield seeds, fertilizers, and organic crop protection with live market rates." })}
          </p>
        </div>

        {/* Marketplace Categories */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {categories.map((category) => {
            const isSelected = activeCategory === category.key;
            return (
              <Card
                key={category.key}
                className={`text-center cursor-pointer transition-all duration-300 rounded-2xl ${
                  isSelected
                    ? "border-2 border-primary shadow-organic bg-primary/5 scale-[1.02]"
                    : "border border-border hover:border-primary/50 hover:shadow-md bg-card"
                }`}
                onClick={() => handleCategoryClick(category.key)}
                data-testid={`card-category-${category.key}`}
              >
                <CardContent className="p-5 flex flex-col items-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
                    isSelected ? "bg-primary text-primary-foreground shadow-sm" : "bg-primary/10 text-primary"
                  }`}>
                    <i className={`${category.icon} text-2xl`}></i>
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-1 text-base md:text-lg">
                    {category.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{category.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search & Sub-category Filter Bar */}
        <div className="bg-card rounded-2xl p-4 md:p-6 border border-border shadow-sm mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
              <div className="relative flex-1">
                <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
                <Input
                  type="text"
                  placeholder={`Search ${currentCategoryObj.title.toLowerCase()} (e.g. ${currentCategoryObj.subItems[0]})...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl"
                  data-testid="input-marketplace-search"
                />
              </div>
              <Button type="submit" className="rounded-xl px-5" data-testid="button-search-submit">
                <i className="fas fa-search mr-1.5 hidden sm:inline"></i>
                Search
              </Button>
            </form>
          </div>

          {/* Quick Sub-item Filter Chips */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Popular in {currentCategoryObj.title}:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeSubQuery === "" ? "default" : "outline"}
                size="sm"
                className="rounded-full text-xs h-8"
                onClick={() => {
                  setActiveSubQuery("");
                  fetchProducts(activeCategory);
                }}
              >
                All
              </Button>
              {currentCategoryObj.subItems.map((sub) => {
                const isSubActive = activeSubQuery === sub;
                return (
                  <Button
                    key={sub}
                    variant={isSubActive ? "default" : "outline"}
                    size="sm"
                    className="rounded-full text-xs h-8 transition-all"
                    onClick={() => handleSubQueryClick(sub)}
                    data-testid={`chip-${sub.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {sub}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Verified Products Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
                <span>{activeSubQuery || currentCategoryObj.title} Products</span>
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border">
                  <i className="fas fa-check-circle text-primary mr-1"></i> Verified Suppliers
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Authentic agricultural catalog • Verified specifications & current prices
              </p>
            </div>
          </div>

          {productsLoading ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="rounded-2xl border border-border overflow-hidden animate-pulse">
                  <div className="h-48 bg-muted/60 w-full"></div>
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-muted/60 rounded w-3/4"></div>
                    <div className="h-3 bg-muted/40 rounded w-1/2"></div>
                    <div className="h-6 bg-muted/60 rounded w-1/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p, idx) => (
                <Card
                  key={idx}
                  className="rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-organic hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between bg-card group"
                >
                  <div>
                    {/* Product Image */}
                    <div className="relative h-48 w-full bg-white p-4 flex items-center justify-center overflow-hidden border-b border-border/50">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-muted-foreground flex flex-col items-center">
                          <i className="fas fa-image text-3xl mb-1 text-muted-foreground/40"></i>
                          <span className="text-xs">No image</span>
                        </div>
                      )}
                      {p.rating && (
                        <div className="absolute top-2.5 right-2.5 bg-background/90 backdrop-blur px-2 py-0.5 rounded-md text-xs font-semibold text-accent shadow-xs border border-border">
                          {p.rating}
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <CardContent className="p-4">
                      <h4
                        className="font-medium text-foreground text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-snug"
                        title={p.name}
                      >
                        {p.name}
                      </h4>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-lg font-bold text-primary">
                          {p.price || "Check Price"}
                        </span>
                      </div>
                    </CardContent>
                  </div>

                  {/* Buy Now Button */}
                  <div className="p-4 pt-0">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-all shadow-sm hover:shadow-md"
                      data-testid={`button-buy-product-${idx}`}
                    >
                      <i className="fas fa-shopping-cart text-xs"></i>
                      <span>{t("marketplace.buyNow", { defaultValue: "Buy Now" })}</span>
                      <i className="fas fa-arrow-up-right-from-square text-[10px] opacity-75"></i>
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border border-dashed border-border p-12 text-center">
              <i className="fas fa-box-open text-4xl text-muted-foreground/40 mb-3"></i>
              <p className="text-muted-foreground font-medium">No products found</p>
              <p className="text-xs text-muted-foreground mt-1">Try selecting another category or searching with different keywords.</p>
            </Card>
          )}
        </div>

        {/* AI Recommendations Section */}
        <Card className="shadow-organic rounded-3xl border border-border overflow-hidden">
          <CardHeader className="bg-card/50 border-b border-border pb-4">
            <CardTitle className="text-xl font-heading flex items-center gap-2">
              <i className="fas fa-chart-line text-primary"></i>
              {t("marketplace.trendingTitle", { defaultValue: "AI Recommended for your region" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading && <p className="text-muted-foreground">{t("loading", { defaultValue: "Loading suggestions..." })}</p>}
            {!loading && trending && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                    <i className="fas fa-shield-virus text-destructive text-sm"></i>
                    {t("marketplace.trendingPesticides", { defaultValue: "Recommended Pesticides & Protection" })}
                  </h4>
                  <ul className="space-y-3">
                    {(trending.pesticides || []).map((p: any, idx: number) => (
                      <li key={idx} className="p-3.5 rounded-2xl border border-border bg-card/60 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors">
                        <div>
                          <div className="font-medium text-foreground text-sm">{p.name}</div>
                          {p.use && <div className="text-xs text-muted-foreground mt-0.5">{p.use}</div>}
                          {p.safety && <div className="text-[11px] text-muted-foreground/80 mt-1 italic"><i className="fas fa-info-circle mr-1"></i>{p.safety}</div>}
                        </div>
                        <a
                          className="shrink-0 text-xs bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                          href={`https://www.google.com/search?q=${encodeURIComponent(p.name + " agriculture buy online")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <i className="fas fa-shopping-cart text-[11px]"></i> Buy Now
                        </a>
                      </li>
                    ))}
                    {(!trending.pesticides || trending.pesticides.length === 0) && (
                      <li className="text-sm text-muted-foreground">{t("marketplace.noPesticides", { defaultValue: "No suggestions available" })}</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                    <i className="fas fa-tools text-accent text-sm"></i>
                    {t("marketplace.trendingEquipment", { defaultValue: "Recommended Farm Equipment" })}
                  </h4>
                  <ul className="space-y-3">
                    {(trending.equipment || []).map((e: any, idx: number) => (
                      <li key={idx} className="p-3.5 rounded-2xl border border-border bg-card/60 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors">
                        <div>
                          <div className="font-medium text-foreground text-sm">{e.name}</div>
                          {e.use && <div className="text-xs text-muted-foreground mt-0.5">{e.use}</div>}
                          {e.tip && <div className="text-[11px] text-muted-foreground/80 mt-1 italic"><i className="fas fa-lightbulb mr-1"></i>{e.tip}</div>}
                        </div>
                        <a
                          className="shrink-0 text-xs bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                          href={`https://www.google.com/search?q=${encodeURIComponent(e.name + " agriculture equipment buy online")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <i className="fas fa-shopping-cart text-[11px]"></i> Buy Now
                        </a>
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
