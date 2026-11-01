import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Schemes from "./pages/Schemes";
import Marketplace from "./pages/Marketplace";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={Auth} />
      <Route path="/profile">
        <ProtectedRoute><Profile /></ProtectedRoute>
      </Route>
      <Route path="/chat">
        <ProtectedRoute><Chat /></ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/schemes">
        <ProtectedRoute><Schemes /></ProtectedRoute>
      </Route>
      <Route path="/marketplace">
        <ProtectedRoute><Marketplace /></ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <TooltipProvider>
            <Layout>
              <Router />
            </Layout>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;
