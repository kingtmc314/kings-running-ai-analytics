// =============================================================
// King's Running AI Analytics — App Shell
// Design: Light Running Theme — energetic, airy, sporty
// =============================================================
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DataProvider } from "./contexts/DataContext";
import { AuthGuard } from "./components/AuthGuard";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { Route, Switch } from "wouter";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {() => (
          <AuthGuard>
            <DataProvider>
              <Dashboard />
            </DataProvider>
          </AuthGuard>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Router />
        <Toaster position="top-right" theme="light" />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
