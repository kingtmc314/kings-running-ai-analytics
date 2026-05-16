// =============================================================
// King's Running AI Analytics — Dashboard Shell
// Responsive: sidebar on desktop (md+), top header nav on mobile
// =============================================================
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, BarChart2, Brain, Trophy, Scale,
  Moon, Heart, Activity, ShoppingBag, PlusCircle, Menu, X,
  RefreshCw, Zap, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";
import OverviewTab from "@/components/tabs/OverviewTab";
import AnalyticsTab from "@/components/tabs/AnalyticsTab";
import AICoachTab from "@/components/tabs/AICoachTab";
import RaceRecordTab from "@/components/tabs/RaceRecordTab";
import BodyFitnessTab from "@/components/tabs/BodyFitnessTab";
import SleepTab from "@/components/tabs/SleepTab";
import HeartRateTab from "@/components/tabs/HeartRateTab";
import ActivitiesTab from "@/components/tabs/ActivitiesTab";
import ShoeLockerTab from "@/components/tabs/ShoeLockerTab";
import LogDataTab from "@/components/tabs/LogDataTab";

type TabId =
  | "overview" | "analytics" | "ai" | "race" | "body"
  | "sleep" | "heartrate" | "activities" | "shoes" | "log";

const NAV_ITEMS: { id: TabId; icon: React.ElementType; label: string }[] = [
  { id: "overview",    icon: LayoutDashboard, label: "Overview" },
  { id: "analytics",   icon: BarChart2,       label: "Analytics" },
  { id: "ai",          icon: Brain,           label: "AI Coach" },
  { id: "race",        icon: Trophy,          label: "Race Record" },
  { id: "body",        icon: Scale,           label: "Body Fitness" },
  { id: "sleep",       icon: Moon,            label: "Sleep" },
  { id: "heartrate",   icon: Heart,           label: "Heart Rate" },
  { id: "activities",  icon: Activity,        label: "Activities" },
  { id: "shoes",       icon: ShoppingBag,     label: "Shoe Locker" },
  { id: "log",         icon: PlusCircle,      label: "Log Data" },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { syncStatus, fetchFromGoogle, processedShoes } = useData();
  const retirementAlertFired = useRef(false);

  // Close mobile menu on tab change
  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  // Fire shoe retirement alerts once after data loads
  useEffect(() => {
    if (syncStatus !== "success" || retirementAlertFired.current) return;
    if (!processedShoes || processedShoes.length === 0) return;
    retirementAlertFired.current = true;

    const nearRetirement = processedShoes.filter(
      (s) => s.Status === "In Use" && s.totalDist >= 700
    );

    if (nearRetirement.length === 0) return;

    nearRetirement.forEach((shoe) => {
      const name = shoe["Shoes Name"] || shoe.Shoes || "Unknown Shoe";
      const dist = shoe.totalDist;
      const pct = Math.round((dist / 800) * 100);
      toast.warning(
        `⚠️ Shoe nearing retirement: ${name}`,
        {
          description: `${dist.toFixed(0)} km used (${pct}% of 800 km limit). Consider retiring this pair soon.`,
          duration: 8000,
          action: {
            label: "View Shoes",
            onClick: () => handleTabChange("shoes"),
          },
        }
      );
    });
  }, [syncStatus, processedShoes]);

  const TAB_COMPONENTS: Record<TabId, React.ReactNode> = {
    overview:   <OverviewTab />,
    analytics:  <AnalyticsTab />,
    ai:         <AICoachTab />,
    race:       <RaceRecordTab />,
    body:       <BodyFitnessTab />,
    sleep:      <SleepTab />,
    heartrate:  <HeartRateTab />,
    activities: <ActivitiesTab />,
    shoes:      <ShoeLockerTab />,
    log:        <LogDataTab />,
  };

  const activeLabel = NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? "";

  return (
    <div className="flex h-screen running-bg overflow-hidden">

      {/* ══════════════════════════════════════════════════════
          DESKTOP SIDEBAR (hidden on mobile, visible on md+)
      ══════════════════════════════════════════════════════ */}
      <aside
        className={cn(
          "hidden md:flex flex-col shrink-0 h-full transition-all duration-300 ease-out",
          "bg-sidebar border-r border-sidebar-border",
          sidebarOpen ? "w-56" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 glow-blue">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-display font-700 text-sm text-sidebar-foreground leading-tight">King's Running</p>
              <p className="text-[10px] text-muted-foreground leading-tight">AI Analytics</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-150",
                  "hover:bg-sidebar-accent hover:text-white",
                  isActive
                    ? "bg-primary/20 text-primary border-r-2 border-primary"
                    : "text-muted-foreground"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "")} />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sync button */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => fetchFromGoogle()}
            disabled={syncStatus === "loading"}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all",
              "bg-sidebar-accent hover:bg-primary/20 text-muted-foreground hover:text-primary",
              syncStatus === "loading" && "opacity-60 cursor-not-allowed"
            )}
            title={!sidebarOpen ? "Sync Data" : undefined}
          >
            <RefreshCw className={cn("w-3.5 h-3.5 shrink-0", syncStatus === "loading" && "animate-spin")} />
            {sidebarOpen && (
              <span>
                {syncStatus === "loading" ? "Syncing…" : syncStatus === "success" ? "Synced" : syncStatus === "error" ? "Retry Sync" : "Sync Data"}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── DESKTOP top bar (md+) ── */}
        <header className="hidden md:flex items-center gap-3 px-5 py-3 border-b border-border bg-card shrink-0 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <h1 className="font-display font-700 text-base text-foreground">{activeLabel}</h1>
          <div className="ml-auto flex items-center gap-2">
            {syncStatus === "success" && (
              <span className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Live
              </span>
            )}
            {syncStatus === "error" && (
              <span className="text-xs text-red-400">Sync failed</span>
            )}
          </div>
        </header>

        {/* ── MOBILE header (< md) ── */}
        <header className="md:hidden shrink-0 bg-sidebar border-b border-sidebar-border shadow-sm">
          {/* Top bar: logo + sync status + hamburger */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-700 text-sm text-sidebar-foreground leading-tight truncate">King's Running</p>
              <p className="text-[9px] text-muted-foreground leading-tight">AI Analytics</p>
            </div>
            {/* Sync indicator */}
            {syncStatus === "success" && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Live
              </span>
            )}
            {syncStatus === "loading" && (
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground animate-spin shrink-0" />
            )}
            {/* Hamburger / close */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-white hover:bg-sidebar-accent transition-colors shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Current page label + dropdown hint */}
          <div
            className="flex items-center justify-between px-4 pb-2 cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="text-xs font-semibold text-primary">{activeLabel}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", mobileMenuOpen && "rotate-180")} />
          </div>

          {/* Dropdown nav menu */}
          {mobileMenuOpen && (
            <nav className="border-t border-sidebar-border bg-sidebar pb-2 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-1 p-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-white"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "")} />
                      <span className="truncate text-xs">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              {/* Sync button in mobile menu */}
              <div className="px-2 pt-1 border-t border-sidebar-border mt-1">
                <button
                  onClick={() => { fetchFromGoogle(); setMobileMenuOpen(false); }}
                  disabled={syncStatus === "loading"}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-sidebar-accent hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all disabled:opacity-60"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", syncStatus === "loading" && "animate-spin")} />
                  {syncStatus === "loading" ? "Syncing…" : "Sync Data"}
                </button>
              </div>
            </nav>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5">
          <div className="animate-fade-up">
            {TAB_COMPONENTS[activeTab]}
          </div>
        </main>
      </div>
    </div>
  );
}
