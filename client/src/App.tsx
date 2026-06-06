import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, lazy, Suspense } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { EmployeSessionProvider, useEmployeSession } from "./contexts/EmployeSessionContext";
import { AppProvider, useApp } from "./lib/app-context";
import { trpc } from "@/lib/trpc";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Inscription from "@/pages/Inscription";
import ConnexionEmail from "@/pages/ConnexionEmail";

// Lazy-loaded pages
const Archives = lazy(() => import('@/pages/Archives'));
const ArchivesNumerisees = lazy(() => import('@/pages/ArchivesNumerisees'));
const EcranPIN = lazy(() => import('@/pages/EcranPIN'));
const GestionUtilisateurs = lazy(() => import('@/pages/GestionUtilisateurs'));
const Clients = lazy(() => import("./pages/Clients"));
const ClientDetail = lazy(() => import("./pages/ClientDetail"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const SetupStudio = lazy(() => import("./pages/SetupStudio"));
const Documents = lazy(() => import("./pages/Documents"));
const Parametres = lazy(() => import("./pages/Parametres"));
const Salaries = lazy(() => import("./pages/Salaries"));
const Engagements = lazy(() => import("./pages/Engagements"));
const DocumentForm = lazy(() => import("./pages/DocumentForm"));
const AffichageSalon = lazy(() => import('@/pages/AffichageSalon'));
const RgpdSalarie = lazy(() => import("@/pages/RgpdSalarie"));
const PolitiqueConfidentialite = lazy(() => import("@/pages/PolitiqueConfidentialite"));
const MentionsLegales = lazy(() => import("@/pages/MentionsLegales"));
const VideosDemoPage = lazy(() => import("@/pages/VideosDemoPage"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const APropos = lazy(() => import("@/pages/APropos"));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-navy)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Chargement...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { state } = useApp();
  const [location] = useLocation();
  const path = location;

  // SÉPARATION RADICALE : Si l'URL contient super-admin, on force le monde Admin
  if (path.includes('/super-admin')) {
    if (!state.isAuthenticated) {
      return <Login />;
    }
    return (
      <Suspense fallback={<LoadingFallback />}>
        <SuperAdmin />
      </Suspense>
    );
  }

  // SINON : Monde iPad / Client
  if (state.isLoading) {
    return <LoadingFallback />;
  }

  return (
    <Layout>
      <Suspense fallback={<LoadingFallback />}>
        <Switch>
          <Route path="/pin" component={EcranPIN} />
          <Route path="/" component={EcranPIN} />
          <Route path="/gestion-utilisateurs" component={GestionUtilisateurs} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/clients" component={Clients} />
          <Route path="/clients/:id" component={ClientDetail} />
          <Route path="/clients/:clientId/document/:docType" component={DocumentForm} />
          <Route path="/document/:docType" component={DocumentForm} />
          <Route path="/documents" component={Documents} />
          <Route path="/parametres" component={Parametres} />
          <Route path="/salaries" component={Salaries} />
          <Route path="/engagements" component={Engagements} />
          <Route path="/archives" component={Archives} />
          <Route path="/archives-numerisees" component={ArchivesNumerisees} />
          <Route path="/rgpd-salarie" component={RgpdSalarie} />
          <Route path="/info-client-rgpd" component={AffichageSalon} />
          <Route path="/confidentialite" component={PolitiqueConfidentialite} />
          <Route path="/mentions-legales" component={MentionsLegales} />
          <Route path="/videos-demo" component={VideosDemoPage} />
          <Route path="/a-propos" component={APropos} />
          <Route path="/inscription" component={Inscription} />
          <Route path="/connexion" component={ConnexionEmail} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AppProvider>
          <EmployeSessionProvider>
            <TooltipProvider>
              <Toaster position="top-right" />
              <AppRoutes />
            </TooltipProvider>
          </EmployeSessionProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
