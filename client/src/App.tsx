import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider, useApp } from "./lib/app-context";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Agenda from "./pages/Agenda";
import Documents from "./pages/Documents";
import Parametres from "./pages/Parametres";
import NotFound from "./pages/NotFound";

function AppRoutes() {
  const { state } = useApp();

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-navy)' }}>
        <div className="flex flex-col items-center gap-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/logo_white_d12a3c81.svg"
            alt="Intemporelle"
            className="w-16 h-16 animate-pulse"
          />
          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/clients" component={Clients} />
        <Route path="/clients/:id" component={ClientDetail} />
        <Route path="/agenda" component={Agenda} />
        <Route path="/documents" component={Documents} />
        <Route path="/parametres" component={Parametres} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AppProvider>
          <TooltipProvider>
            <Toaster position="top-right" />
            <AppRoutes />
          </TooltipProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
