import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import DatabaseView from "./pages/DatabaseView";
import PageView from "./pages/PageView";
import Status from "./pages/Status";
import AdminUsers from "./pages/AdminUsers";
import AdminResources from "./pages/AdminResources";

function AuthenticatedRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/database/:id" component={DatabaseView} />
        <Route path="/page/:id" component={PageView} />
        <Route path="/status" component={Status} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/resources" component={AdminResources} />
        <Route component={Dashboard} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/404" component={NotFound} />
      <Route path="/dashboard" component={AuthenticatedRoutes} />
      <Route path="/database/:id" component={AuthenticatedRoutes} />
      <Route path="/page/:id" component={AuthenticatedRoutes} />
      <Route path="/status" component={AuthenticatedRoutes} />
      <Route path="/admin/users" component={AuthenticatedRoutes} />
      <Route path="/admin/resources" component={AuthenticatedRoutes} />
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
