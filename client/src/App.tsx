// =============================================================
// King's Running AI Analytics — App Shell v2.0
// Design: Light Running Theme — energetic, airy, sporty
// Backend: tRPC + Express + Supabase Life-OS
// =============================================================
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DataProvider } from "./contexts/DataContext";
import Dashboard from "./pages/Dashboard";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <DataProvider>
            <Dashboard />
            <Toaster position="top-right" theme="light" />
          </DataProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
