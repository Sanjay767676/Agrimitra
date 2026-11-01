import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useProfile } from "../hooks/useProfile";
import { useI18n } from "../hooks/useI18n";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import FloatingChatButton from "./FloatingChatButton";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { currentLanguage, changeLanguage, languages } = useI18n();
  const { user, isConfigured, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  const isLanding = location === "/";
  const isChat = location === "/chat";
  const isLoggedIn = isConfigured ? (!loading && Boolean(user)) : true;

  const navItems = [
    { key: "home", href: "/", label: t("nav.home") },
    { key: "cropSuggestion", href: "/dashboard", label: t("nav.cropSuggestion") },
    { key: "schemes", href: "/schemes", label: t("nav.schemes") },
    { key: "marketplace", href: "/marketplace", label: t("nav.marketplace") },
    { key: "chat", href: "/chat", label: t("nav.chat") },
    { key: "profile", href: "/profile", label: t("nav.profile") },
  ];

  if (isLanding) {
    return (
      <>
        {children}
        {isLoggedIn && <FloatingChatButton />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="bg-card/80 backdrop-blur border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-2xl p-2 shadow-organic">
                <i className="fas fa-seedling text-primary-foreground text-xl"></i>
              </div>
              <h1 
                className="text-2xl font-heading font-bold text-primary cursor-pointer" 
                onClick={() => setLocation("/")}
                data-testid="logo-agrimitra"
              >
                Agrimitra
              </h1>
            </div>
            
            {/* Navigation Menu (only visible when logged in) */}
            {isLoggedIn && (
              <div className="hidden md:flex items-center space-x-6">
                {navItems.map((item) => (
                  <Button
                    key={item.key}
                    variant="ghost"
                    className={`text-sm transition-colors ${
                      location === item.href
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                    onClick={() => setLocation(item.href)}
                    data-testid={`nav-${item.key}`}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Language Selector, Auth & Mobile Menu */}
            <div className="flex items-center space-x-3">
              <Select value={currentLanguage} onValueChange={changeLanguage}>
                <SelectTrigger className="w-32 rounded-xl" data-testid="language-selector">
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

              {/* Login button (when not logged in and not already on /auth) */}
              {!isLoggedIn && location !== "/auth" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setLocation("/auth")}
                  data-testid="button-nav-login"
                >
                  <i className="fas fa-sign-in-alt mr-1"></i>
                  {t("landing.loginAsFarmer", { defaultValue: "Login" })}
                </Button>
              )}

              {/* Sign out (only when logged in) */}
              {isLoggedIn && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                  onClick={handleSignOut}
                  data-testid="button-sign-out"
                  title={t("nav.signOut", { defaultValue: "Sign out" })}
                >
                  <i className="fas fa-sign-out-alt mr-1"></i>
                  <span className="hidden sm:inline">{t("nav.signOut", { defaultValue: "Sign out" })}</span>
                </Button>
              )}

              {/* Mobile Menu Button (only when logged in) */}
              {isLoggedIn && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  data-testid="mobile-menu-toggle"
                >
                  <i className="fas fa-bars text-xl"></i>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Menu (only when logged in) */}
          {isLoggedIn && mobileMenuOpen && (
            <div className="md:hidden border-t border-border py-4">
              <div className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <Button
                    key={item.key}
                    variant="ghost"
                    className={`justify-start ${
                      location === item.href
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => {
                      setLocation(item.href);
                      setMobileMenuOpen(false);
                    }}
                    data-testid={`mobile-nav-${item.key}`}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Compact Footer */}
      {!isChat && (
        <footer className="bg-card border-t border-border">
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
      )}

      {/* Floating Chat Button (only when logged in) */}
      {isLoggedIn && !isChat && <FloatingChatButton />}
    </div>
  );
}
