import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useProfile } from "../hooks/useProfile";
import { useI18n } from "../hooks/useI18n";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLanding = location === "/";
  const isChat = location === "/chat";

  const navItems = [
    { key: "home", href: "/", label: t("nav.home") },
    { key: "cropSuggestion", href: "/dashboard", label: t("nav.cropSuggestion") },
    { key: "schemes", href: "/dashboard", label: t("nav.schemes") },
    { key: "marketplace", href: "/marketplace", label: t("nav.marketplace") },
    { key: "chat", href: "/chat", label: t("nav.chat") },
    { key: "profile", href: "/profile", label: t("nav.profile") },
  ];

  if (isLanding) {
    return (
      <>
        {children}
        <FloatingChatButton />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-lg p-2">
                <i className="fas fa-seedling text-primary-foreground text-xl"></i>
              </div>
              <h1 
                className="text-xl font-bold text-primary cursor-pointer" 
                onClick={() => setLocation("/")}
                data-testid="logo-agrimitra"
              >
                Agrimitra
              </h1>
            </div>
            
            {/* Navigation Menu */}
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

            {/* Language Selector & Mobile Menu */}
            <div className="flex items-center space-x-3">
              <Select value={currentLanguage} onValueChange={changeLanguage}>
                <SelectTrigger className="w-32" data-testid="language-selector">
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
              
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-toggle"
              >
                <i className="fas fa-bars text-xl"></i>
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
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

      {/* Footer */}
      {!isChat && (
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
      )}

      {/* Floating Chat Button */}
      {!isChat && <FloatingChatButton />}
    </div>
  );
}
