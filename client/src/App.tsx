import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Tickets from "./pages/Tickets";
import Reports from "./pages/Reports";
import AdminClients from "./pages/AdminClients";
import AdminTickets from "./pages/AdminTickets";
import AdminSettings from "./pages/AdminSettings";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/tickets"} component={Tickets} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/admin/clients"} component={AdminClients} />
      <Route path={"/admin/tickets"} component={AdminTickets} />
      <Route path={"/admin/settings"} component={AdminSettings} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
