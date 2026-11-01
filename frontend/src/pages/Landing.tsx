import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "../hooks/useI18n";
import { useAuth } from "../hooks/useAuth";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, languages } = useI18n();
  const { user, isConfigured, loading } = useAuth();
  const isLoggedIn = isConfigured ? (!loading && Boolean(user)) : true;

  const features = [
    { icon: "fa-robot", title: t("features.aiAdvisory.title", { defaultValue: "AI Farm Advisory" }), desc: t("features.aiAdvisory.desc", { defaultValue: "Personalized, weather-aware crop advice from KRISHI SAKHI." }) },
    { icon: "fa-cloud-sun-rain", title: t("features.weather.title", { defaultValue: "Live Weather & Alerts" }), desc: t("features.weather.desc", { defaultValue: "Current conditions, rain probability and timely farm alerts." }) },
    { icon: "fa-language", title: t("features.multilingual.title", { defaultValue: "13 Indian Languages" }), desc: t("features.multilingual.desc", { defaultValue: "Chat and read in the language you are most comfortable with." }) },
    { icon: "fa-landmark", title: t("features.schemes.title", { defaultValue: "Government Schemes" }), desc: t("features.schemes.desc", { defaultValue: "Discover up-to-date welfare schemes you can apply for." }) },
    { icon: "fa-microphone-lines", title: t("features.voice.title", { defaultValue: "Voice Support" }), desc: t("features.voice.desc", { defaultValue: "Speak your question and hear the answer read aloud." }) },
    { icon: "fa-seedling", title: t("features.yield.title", { defaultValue: "Yield Estimates" }), desc: t("features.yield.desc", { defaultValue: "Estimate your harvest from crop, land and irrigation details." }) },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="bg-card/80 backdrop-blur border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-2xl p-2 shadow-organic">
                <i className="fas fa-seedling text-primary-foreground text-xl"></i>
              </div>
              <h1 className="text-2xl font-heading font-bold text-primary">Agrimitra</h1>
            </div>

            <div className="flex items-center gap-3">
              <Select value={currentLanguage} onValueChange={changeLanguage}>
                <SelectTrigger className="w-36 rounded-xl" data-testid="language-selector-landing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.nativeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="hidden sm:inline-flex rounded-xl"
                onClick={() => setLocation(isLoggedIn ? "/dashboard" : "/auth")}
                data-testid="button-nav-login"
              >
                {isLoggedIn ? t("nav.cropSuggestion", { defaultValue: "Dashboard" }) : t("landing.loginAsFarmer")}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Organic background blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary/20 blob blur-2xl" aria-hidden="true"></div>
        <div className="absolute -bottom-32 -left-24 w-[28rem] h-[28rem] bg-accent/10 blob blur-3xl" aria-hidden="true"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div className="fade-in">
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                <i className="fas fa-leaf"></i>
                {t("landing.badge", { defaultValue: "Your Digital Farming Companion" })}
              </span>
              <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">
                {t("landing.title")}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
                {t("landing.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="bg-accent text-accent-foreground px-8 py-6 rounded-2xl font-semibold text-lg hover:bg-accent/90 transition-all duration-300 shadow-organic hover:scale-[1.02]"
                  onClick={() => setLocation(isLoggedIn ? "/dashboard" : "/auth")}
                  data-testid="button-get-started"
                >
                  <i className="fas fa-seedling mr-2"></i>
                  {isLoggedIn ? t("nav.cropSuggestion", { defaultValue: "Go to Dashboard" }) : t("landing.getStarted")}
                </Button>
                {!isLoggedIn && (
                  <Button
                    variant="outline"
                    className="px-8 py-6 rounded-2xl font-semibold text-lg border-2 hover:bg-primary/5 transition-all duration-300"
                    onClick={() => setLocation("/auth")}
                    data-testid="button-login-farmer"
                  >
                    <i className="fas fa-comments mr-2"></i>
                    {t("landing.loginAsFarmer")}
                  </Button>
                )}
              </div>
            </div>

            {/* Hero image in an organic frame */}
            <div className="relative fade-in">
              <div className="blob overflow-hidden shadow-organic aspect-square max-w-lg mx-auto">
                <img
                  src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1200&q=80"
                  alt="Indian farmer in a green field"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating stat card */}
              <div className="absolute -bottom-4 left-4 bg-card rounded-2xl shadow-organic px-5 py-3 border border-border">
                <div className="flex items-center gap-3">
                  <div className="bg-secondary/20 text-primary rounded-xl p-2">
                    <i className="fas fa-globe"></i>
                  </div>
                  <div>
                    <p className="font-heading font-bold text-foreground leading-none">13 Languages</p>
                    <p className="text-xs text-muted-foreground">Built for every farmer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-20 bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              {t("landing.featuresTitle", { defaultValue: "Everything your farm needs" })}
            </h2>
            <p className="text-muted-foreground">
              {t("landing.featuresSubtitle", { defaultValue: "One companion for advice, weather, schemes and more." })}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-in">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-card rounded-3xl p-6 border border-border shadow-organic hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="bg-primary/10 text-primary rounded-2xl w-14 h-14 flex items-center justify-center mb-4">
                  <i className={`fas ${f.icon} text-2xl`}></i>
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative overflow-hidden bg-primary rounded-[2rem] px-8 py-12 md:py-16 text-center shadow-organic">
            <div className="absolute -top-16 -right-10 w-64 h-64 bg-white/10 blob" aria-hidden="true"></div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4 relative">
              {t("landing.ctaTitle", { defaultValue: "Ready to grow smarter?" })}
            </h2>
            <p className="text-primary-foreground/85 mb-8 max-w-xl mx-auto relative">
              {t("landing.ctaSubtitle", { defaultValue: "Create your free profile and start getting advice today." })}
            </p>
            <Button
              className="relative bg-accent text-accent-foreground px-8 py-6 rounded-2xl font-semibold text-lg hover:bg-accent/90 transition-all duration-300 shadow-organic hover:scale-[1.02]"
              onClick={() => setLocation(isLoggedIn ? "/dashboard" : "/auth")}
              data-testid="button-cta-bottom"
            >
              <i className="fas fa-user-plus mr-2"></i>
              {isLoggedIn ? t("nav.cropSuggestion", { defaultValue: "Go to Dashboard" }) : t("landing.getStarted")}
            </Button>
          </div>
        </div>
      </section>

      {/* Compact Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1.5">
              <i className="fas fa-seedling text-primary-foreground text-sm"></i>
            </div>
            <span className="font-heading font-bold text-primary">Agrimitra</span>
          </div>
          <p className="text-xs text-muted-foreground">{t("footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
}
