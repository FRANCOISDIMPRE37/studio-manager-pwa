import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { Route, Switch } from "wouter";
import Archives from '@/pages/Archives';
import ArchivesNumerisees from '@/pages/ArchivesNumerisees';
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider, useApp } from "./lib/app-context";
import { trpc } from "@/lib/trpc";
import Layout from "./components/Layout";
import EcranPIN from '@/pages/EcranPIN';
import GestionUtilisateurs from '@/pages/GestionUtilisateurs';
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import SuperAdmin from "./pages/SuperAdmin";
import SetupStudio from "./pages/SetupStudio";
import Documents from "./pages/Documents";
import Parametres from "./pages/Parametres";
import Salaries from "./pages/Salaries";
import Engagements from "./pages/Engagements";
import NotFound from "./pages/NotFound";
import DocumentForm from "./pages/DocumentForm";
import AffichageSalon from '@/pages/AffichageSalon';
import RgpdSalarie from "@/pages/RgpdSalarie";
import PolitiqueConfidentialite from "@/pages/PolitiqueConfidentialite";
import MentionsLegales from "@/pages/MentionsLegales";
import VideosDemoPage from "@/pages/VideosDemoPage";
import Onboarding from "@/pages/Onboarding";
import APropos from "@/pages/APropos";
import Inscription from "@/pages/Inscription";
import ConnexionEmail from "@/pages/ConnexionEmail";
import Admin from "@/pages/Admin";

function AppRoutes() {
  const { state, setAuthenticated } = useApp();
  const { data: firstLoginData, isLoading: firstLoginLoading, error: firstLoginError } = trpc.salon.getFirstLogin.useQuery(
    undefined,
    {
      enabled: state.isAuthenticated && !state.isDemo,
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    }
  );

  useEffect(() => {
    if (state.isAuthenticated && firstLoginError) {
      console.warn('[iPad Auth] Session serveur invalide ou expirée : retour connexion sans boucle de chargement.', firstLoginError.message);
      setAuthenticated(false);
    }
  }, [state.isAuthenticated, firstLoginError, setAuthenticated]);
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-navy)' }}>
        <div className="flex flex-col items-center gap-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/logo_intemporelle_293813dd.jpg"
            alt="Intemporelle RGPD & Cybersécurité"
            className="rounded-lg animate-pulse"
            style={{ width: '180px', objectFit: 'contain' }}
          />
          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  // Routes publiques accessibles sans authentification
  const path = window.location.pathname;
  if (path === '/inscription') return <Inscription />;
  if (path === '/connexion') return <ConnexionEmail />;
  if (path === '/super-admin') return <SuperAdmin />;
  if (path === '/setup-studio' || path.startsWith('/setup-studio')) return <Onboarding />;

  if (!state.isAuthenticated || firstLoginError) {
    return <Login />;
  }

  // Première connexion : onboarding non encore effectué → Engagements (flag côté serveur)
  if (firstLoginLoading && !firstLoginError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-navy)' }}>
        <div className="flex flex-col items-center gap-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/logo_intemporelle_293813dd.jpg"
            alt="Intemporelle"
            className="rounded-lg animate-pulse"
            style={{ width: '140px', objectFit: 'contain' }}
          />
          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Chargement...</p>
        </div>
      </div>
    );
  }
  if (firstLoginData?.firstLogin === true) {
    return <Onboarding />;
  }

  // make sure to consider if you need authentication for certain routes
  return (
    <Layout>
      <Switch>
        <Route path="/super-admin" component={SuperAdmin} />
        <Route path="/pin" component={EcranPIN} /><Route path="/gestion-utilisateurs" component={GestionUtilisateurs} /><Route path="/" component={Dashboard} />
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
