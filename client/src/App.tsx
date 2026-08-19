import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./i18n";
import NotFound from "./pages/NotFound";

const Home = lazy(() => import("./pages/Home"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Catalog = lazy(() => import("./pages/Catalog"));
const SimulationDetail = lazy(() => import("./pages/SimulationDetail"));
const Workspace = lazy(() => import("./pages/Workspace"));
const Results = lazy(() => import("./pages/Results"));
const Certificate = lazy(() => import("./pages/Certificate"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const PublicPortfolio = lazy(() => import("./pages/PublicPortfolio"));

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/onboarding" component={Onboarding} />
    <Route path="/catalog" component={Catalog} />
    <Route path="/simulations/:slug" component={SimulationDetail} />
    <Route path="/workspace/:sessionId" component={Workspace} />
    <Route path="/results/:sessionId" component={Results} />
    <Route path="/certificate/:code" component={Certificate} />
    <Route path="/portfolio" component={Portfolio} />
    <Route path="/u/:slug" component={PublicPortfolio} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><LanguageProvider><TooltipProvider><Toaster /><Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-50 text-sm font-semibold text-slate-500">Loading CareerSim Gulf…</div>}><Router /></Suspense></TooltipProvider></LanguageProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
