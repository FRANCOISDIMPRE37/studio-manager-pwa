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
// import Vitrine from "./pages/Vitrine"; // Composant supprimé
import NotFound from "./pages/NotFound";
import Inscription from "@/pages/Inscription";
import ConnexionEmail from "@/pages/ConnexionEmail";

// Lazy-loaded pages (chargées à la demande)
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
const Admin = lazy(() => import("@/pages/Admin"));

const isEmployeAllowedRoute = (path: string) => {
  const cleanPath = path.split('?')[0];
  return cleanPath === '/pin' || cleanPath === '/clients' || /^\/clients\/[^/]+$/.test(cleanPath) || /^\/clients\/[^/]+\/document\/[^/]+$/.test(cleanPath);
};

// Composant de chargement
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
  const { state, setAuthenticated } = useApp();
  const { isLoggedIn: isEmployeLoggedIn } = useEmployeSession();
  const [location, navigate] = useLocation();
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

  useEffect(() => {
    if (isEmployeLoggedIn && !isEmployeAllowedRoute(location)) {
      navigate('/clients');
    }
  }, [isEmployeLoggedIn, location, navigate]);

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
  const path = location;
  const hostname = window.location.hostname;

  if (isEmployeLoggedIn && !isEmployeAllowedRoute(path)) {
    return <LoadingFallback />;
  }

  if (path === '/inscription') return <Inscription />;
  if (path === '/connexion') return <ConnexionEmail />;
  
  if (path === '/super-admin') {
    // Autoriser studio.intemporelle.eu pour l'accès super-admin
    if (hostname !== 'app.intemporelle.eu' && hostname !== 'studio.intemporelle.eu' && hostname !== 'localhost' && !hostname.startsWith('127.')) {
      window.location.href = '/';
      return null;
    }
    return <Suspense fallback={<LoadingFallback />}><SuperAdmin /></Suspense>;
  }

  if (path === '/setup-studio' || path.startsWith('/setup-studio')) return <Suspense fallback={<LoadingFallback />}><Onboarding /></Suspense>;

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
    return <Suspense fallback={<LoadingFallback />}><Onboarding /></Suspense>;
  }

  // make sure to consider if you need authentication for certain routes
  return (
    <Layout>
      <Suspense fallback={<LoadingFallback />}>
        <Switch>
          <Route path="/super-admin" component={SuperAdmin} />
          <Route path="/pin" component={EcranPIN} />
          <Route path="/gestion-utilisateurs" component={GestionUtilisateurs} />
          <Route path="/" component={Dashboard} />
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
          <Route path="/vitrine" component={Vitrine} />
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
