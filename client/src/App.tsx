// =============================================================
// King's Running AI Analytics — App Shell
// Design: Light Running Theme — energetic, airy, sporty
// =============================================================
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DataProvider } from "./contexts/DataContext";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <DataProvider>
          <Dashboard />
          <Toaster position="top-right" theme="light" />
        </DataProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
