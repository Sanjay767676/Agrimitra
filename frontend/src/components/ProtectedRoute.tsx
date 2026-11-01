import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";

/**
 * Guards a page so only authenticated users can see it. While Supabase is
 * loading the session we show a spinner; unauthenticated users are redirected
 * to /auth. If Supabase isn't configured at all, we let the page render so the
 * app still works in localStorage-only mode.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isConfigured } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isConfigured && !loading && !user) {
      setLocation("/auth");
    }
  }, [isConfigured, loading, user, setLocation]);

  if (isConfigured && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <i className="fas fa-spinner fa-spin text-3xl text-primary"></i>
      </div>
    );
  }

  if (isConfigured && !user) {
    return null; // redirecting
  }

  return <>{children}</>;
}
