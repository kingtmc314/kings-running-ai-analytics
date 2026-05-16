// =============================================================
// King's Running AI Analytics — App Shell
// Design: Premium Sports Dashboard / Dark Glassmorphism
// =============================================================
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DataProvider } from "./contexts/DataContext";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <DataProvider>
          <Dashboard />
          <Toaster position="top-right" theme="dark" />
        </DataProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
