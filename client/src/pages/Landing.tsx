import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-lg p-2">
                <i className="fas fa-seedling text-primary-foreground text-xl"></i>
              </div>
              <h1 className="text-xl font-bold text-primary">Agrimitra</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative">
        <div className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Background with gradient overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080" 
              alt="Golden wheat fields under blue sky" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/60"></div>
          </div>
          
          {/* Hero Content */}
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 fade-in">
              {t("landing.title")}
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 font-light fade-in">
              {t("landing.subtitle")}
            </p>
            <p className="text-lg text-primary-foreground/80 mb-12 max-w-2xl mx-auto fade-in">
              {t("landing.description")}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center fade-in">
              <Button 
                className="bg-accent text-accent-foreground px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-accent/90 transition-all duration-300 shadow-lg transform hover:scale-105"
                onClick={() => setLocation("/profile")}
                data-testid="button-get-started"
              >
                <i className="fas fa-user-plus mr-2"></i>
                {t("landing.getStarted")}
              </Button>
              <Button 
                variant="outline"
                className="bg-card/20 text-primary-foreground border-2 border-primary-foreground/30 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-card/30 transition-all duration-300"
                onClick={() => setLocation("/chat")}
                data-testid="button-login-farmer"
              >
                <i className="fas fa-comments mr-2"></i>
                {t("landing.loginAsFarmer")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-primary rounded-lg p-2">
              <i className="fas fa-seedling text-primary-foreground"></i>
            </div>
            <span className="text-lg font-bold text-primary">Agrimitra</span>
          </div>
          <p className="text-muted-foreground mb-4">{t("footer.tagline")}</p>
          <p className="text-sm text-muted-foreground">{t("footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
}
