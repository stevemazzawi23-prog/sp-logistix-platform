import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Tickets from "./pages/Tickets";
import Reports from "./pages/Reports";
import AdminClients from "./pages/AdminClients";
import AdminTickets from "./pages/AdminTickets";
import AdminSettings from "./pages/AdminSettings";
import AdminUsers from "./pages/AdminUsers";
import TicketDetail from "./pages/TicketDetail";
import { AdminTicketDetail } from "./pages/TicketDetail";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

// Guard: redirect to /login if not authenticated
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faf9]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-3 border-[#1a5f3f]/30 border-t-[#1a5f3f] rounded-full animate-spin" />
          <p className="text-[#1a5f3f] text-sm font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <Component />;
}

// Guard: redirect to / if already authenticated
function PublicOnlyRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2438] via-[#1a5f3f] to-[#0f2438]">
        <div className="h-8 w-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={() => <PublicOnlyRoute component={Login} />} />
      <Route path="/change-password" component={() => <ProtectedRoute component={ChangePassword} />} />
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/tickets" component={() => <ProtectedRoute component={Tickets} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
      <Route path="/admin/clients" component={() => <ProtectedRoute component={AdminClients} />} />
      <Route path="/admin/tickets" component={() => <ProtectedRoute component={AdminTickets} />} />
      <Route path="/admin/users" component={() => <ProtectedRoute component={AdminUsers} />} />
      <Route path="/admin/settings" component={() => <ProtectedRoute component={AdminSettings} />} />
      <Route path="/admin/tickets/:id" component={({ params }) => <ProtectedRoute component={() => <AdminTicketDetail ticketId={Number(params.id)} />} />} />
      <Route path="/tickets/:id" component={({ params }) => <ProtectedRoute component={() => <TicketDetail ticketId={Number(params.id)} />} />} />
      <Route path="/404" component={NotFound} />
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
