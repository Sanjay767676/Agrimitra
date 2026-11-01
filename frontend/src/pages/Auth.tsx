import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../hooks/useAuth";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { signIn, signUp, isConfigured } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!isConfigured) {
      setError("Authentication is not configured. Add VITE_SUPABASE_ANON_KEY to frontend/.env.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error);
        } else {
          setInfo("Account created. If email confirmation is enabled, check your inbox, then log in.");
          setMode("login");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error);
        } else {
          setLocation("/profile");
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-organic rounded-3xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div className="bg-primary rounded-2xl p-2 shadow-organic">
              <i className="fas fa-seedling text-primary-foreground text-xl"></i>
            </div>
            <span className="text-2xl font-heading font-bold text-primary">Agrimitra</span>
          </div>
          <CardTitle className="text-2xl">
            {mode === "login" ? t("auth.loginTitle", { defaultValue: "Welcome back" }) : t("auth.signupTitle", { defaultValue: "Create your account" })}
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "login"
              ? t("auth.loginSubtitle", { defaultValue: "Log in to continue to your farm dashboard" })
              : t("auth.signupSubtitle", { defaultValue: "Sign up to save your farm profile and chats" })}
          </p>
        </CardHeader>
        <CardContent>
          {!isConfigured && (
            <div className="mb-4 text-sm bg-destructive/10 text-destructive rounded-md p-3">
              Authentication isn't configured yet. Add your Supabase anon key to
              <code className="mx-1">frontend/.env</code>.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email", { defaultValue: "Email" })}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password", { defaultValue: "Password" })}</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                data-testid="input-password"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-primary">{info}</p>}

            <Button type="submit" className="w-full" disabled={submitting} data-testid="button-auth-submit">
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {t("auth.pleaseWait", { defaultValue: "Please wait..." })}
                </>
              ) : mode === "login" ? (
                t("auth.login", { defaultValue: "Log in" })
              ) : (
                t("auth.signup", { defaultValue: "Sign up" })
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-4">
            {mode === "login" ? (
              <>
                {t("auth.noAccount", { defaultValue: "Don't have an account?" })}{" "}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={() => { setMode("signup"); setError(null); setInfo(null); }}
                  data-testid="link-switch-signup"
                >
                  {t("auth.signup", { defaultValue: "Sign up" })}
                </button>
              </>
            ) : (
              <>
                {t("auth.haveAccount", { defaultValue: "Already have an account?" })}{" "}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={() => { setMode("login"); setError(null); setInfo(null); }}
                  data-testid="link-switch-login"
                >
                  {t("auth.login", { defaultValue: "Log in" })}
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
