// =============================================================
// Shoe Locker Tab — King's Running AI Analytics
// =============================================================
import { useMemo, useState } from "react";
import { ShoppingBag, DollarSign, Activity, Calendar } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { formatDateDisplay } from "@/lib/runningData";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  "In Use": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Not Yet Opened": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Retired": "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const MAX_SHOE_DIST = 800; // km before retirement warning

export default function ShoeLockerTab() {
  const { processedShoes } = useData();
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = useMemo(() => {
    if (statusFilter === "All") return processedShoes;
    return processedShoes.filter((s) => s.Status === statusFilter);
  }, [processedShoes, statusFilter]);

  const totalSpend = useMemo(
    () => processedShoes.reduce((acc, s) => acc + s.parsedPrice, 0),
    [processedShoes]
  );

  const totalDist = useMemo(
    () => processedShoes.reduce((acc, s) => acc + s.totalDist, 0),
    [processedShoes]
  );

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display font-700 text-2xl text-white">{processedShoes.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Shoes</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display font-700 text-2xl text-emerald-400">HK${totalSpend.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Investment</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display font-700 text-2xl text-primary">{totalDist.toFixed(0)} km</p>
          <p className="text-xs text-muted-foreground mt-1">Total Distance Run</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["All", "In Use", "Not Yet Opened", "Retired"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              statusFilter === s
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/20"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Shoe cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((shoe, i) => {
          const name = shoe.Shoes || shoe["Shoes Name"] || "Unknown";
          const brand = shoe["Shoes Brand"] || "";
          const status = shoe.Status || "Unknown";
          const distPct = Math.min((shoe.totalDist / MAX_SHOE_DIST) * 100, 100);
          const isWarning = shoe.totalDist > MAX_SHOE_DIST * 0.8 && status === "In Use";
          const costPerKm = shoe.totalDist > 0 && shoe.parsedPrice > 0
            ? (shoe.parsedPrice / shoe.totalDist).toFixed(2)
            : "—";

          return (
            <div
              key={i}
              className={cn(
                "glass-card rounded-xl p-4 border transition-all hover:border-white/15",
                isWarning ? "border-orange-500/30" : "border-white/8"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-display font-600 text-white text-sm truncate">{name}</p>
                  <p className="text-[11px] text-muted-foreground">{brand}</p>
                </div>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border shrink-0", STATUS_COLORS[status] || "bg-slate-500/20 text-slate-300 border-slate-500/30")}>
                  {status}
                </span>
              </div>

              {/* Distance bar */}
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Distance</span>
                  <span className="font-mono-metric text-white">{shoe.totalDist.toFixed(1)} km</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", isWarning ? "bg-orange-400" : "bg-primary")}
                    style={{ width: `${distPct}%` }}
                  />
                </div>
                {isWarning && (
                  <p className="text-[10px] text-orange-400 mt-1">⚠ Approaching retirement ({MAX_SHOE_DIST} km)</p>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 text-center border-t border-white/8 pt-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Sessions</p>
                  <p className="font-mono-metric font-600 text-white text-sm">{shoe.usageCount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Price</p>
                  <p className="font-mono-metric font-600 text-white text-sm">
                    {shoe.parsedPrice > 0 ? `HK$${shoe.parsedPrice.toLocaleString()}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">$/km</p>
                  <p className="font-mono-metric font-600 text-emerald-400 text-sm">{costPerKm}</p>
                </div>
              </div>

              {/* Dates */}
              {(shoe["Purchase Date"] || shoe["First Use"] || shoe["Retired Date"]) && (
                <div className="mt-3 pt-3 border-t border-white/8 space-y-1">
                  {shoe["Purchase Date"] && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Purchased: {formatDateDisplay(shoe["Purchase Date"])}</span>
                    </div>
                  )}
                  {shoe["First Use"] && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Activity className="w-3 h-3" />
                      <span>First Use: {formatDateDisplay(shoe["First Use"])}</span>
                    </div>
                  )}
                  {shoe["Retired Date"] && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <ShoppingBag className="w-3 h-3" />
                      <span>Retired: {formatDateDisplay(shoe["Retired Date"])}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground text-sm">
          No shoes found.
        </div>
      )}
    </div>
  );
}
