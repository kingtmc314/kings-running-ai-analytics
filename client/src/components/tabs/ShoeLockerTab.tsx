// =============================================================
// Shoe Locker Tab — King's Running AI Analytics
// Design: Photo cards with brand+name distance matching,
//         sort controls, and status filters.
// =============================================================
import { useMemo, useState } from "react";
import {
  ShoppingBag, Activity, Calendar, ChevronUp, ChevronDown,
  ChevronsUpDown, DollarSign, Ruler, Hash, ExternalLink,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { formatDateDisplay } from "@/lib/runningData";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  "In Use":          "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Not Yet Opened":  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Retired":         "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const MAX_SHOE_DIST = 800; // km before retirement warning

type SortKey = "status" | "dist" | "sessions" | "price" | "costperkm" | "purchase";
type SortDir = "asc" | "desc";

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ElementType }[] = [
  { key: "status",    label: "Status",     icon: Activity },
  { key: "dist",      label: "Distance",   icon: Ruler },
  { key: "sessions",  label: "Sessions",   icon: Hash },
  { key: "price",     label: "Price",      icon: DollarSign },
  { key: "costperkm", label: "$/km",       icon: DollarSign },
  { key: "purchase",  label: "Purchased",  icon: Calendar },
];

// ─── Component ────────────────────────────────────────────────

export default function ShoeLockerTab() {
  const { processedShoes } = useData();
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const totalSpend = useMemo(
    () => processedShoes.reduce((acc, s) => acc + s.parsedPrice, 0),
    [processedShoes]
  );
  const totalDist = useMemo(
    () => processedShoes.reduce((acc, s) => acc + s.totalDist, 0),
    [processedShoes]
  );
  const inUseCount = useMemo(
    () => processedShoes.filter((s) => (s as unknown as Record<string, unknown>)["Status"] === "In Use").length,
    [processedShoes]
  );

  const filtered = useMemo(() => {
    const base = statusFilter === "All"
      ? processedShoes
      : processedShoes.filter((s) => {
          const raw = s as unknown as Record<string, unknown>;
          return String(raw["Status"] || "") === statusFilter;
        });

    return [...base].sort((a, b) => {
      let av = 0, bv = 0;
      const ra = a as unknown as Record<string, unknown>;
      const rb = b as unknown as Record<string, unknown>;
      if (sortKey === "status") {
        const order: Record<string, number> = { "In Use": 1, "Not Yet Opened": 2, "Retired": 3 };
        av = order[String(ra["Status"] || "")] || 9;
        bv = order[String(rb["Status"] || "")] || 9;
      } else if (sortKey === "dist") {
        av = a.totalDist; bv = b.totalDist;
      } else if (sortKey === "sessions") {
        av = a.usageCount; bv = b.usageCount;
      } else if (sortKey === "price") {
        av = a.parsedPrice; bv = b.parsedPrice;
      } else if (sortKey === "costperkm") {
        av = a.costPerKm || 0; bv = b.costPerKm || 0;
      } else if (sortKey === "purchase") {
        const da = String(ra["Purchase Date"] || "");
        const db = String(rb["Purchase Date"] || "");
        av = da ? new Date(da).getTime() : 0;
        bv = db ? new Date(db).getTime() : 0;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [processedShoes, statusFilter, sortKey, sortDir]);

  return (
    <div className="space-y-5">
      {/* ── Summary stats ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display font-700 text-2xl text-white">{processedShoes.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Shoes</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display font-700 text-2xl text-emerald-400">{inUseCount}</p>
          <p className="text-xs text-muted-foreground mt-1">In Rotation</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display font-700 text-2xl text-amber-400">HK${totalSpend.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Investment</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display font-700 text-2xl text-primary">{totalDist.toFixed(0)} km</p>
          <p className="text-xs text-muted-foreground mt-1">Total Distance Run</p>
        </div>
      </div>

      {/* ── Controls bar ────────────────────────────────────── */}
      <div className="glass-card rounded-xl p-3 flex flex-wrap items-center gap-2">
        {/* Status filter */}
        <div className="flex gap-1.5 shrink-0">
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

        <div className="w-px h-5 bg-white/10 hidden sm:block" />

        {/* Sort chips */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mr-1">Sort:</span>
          {SORT_OPTIONS.map(({ key, label, icon: Icon }) => {
            const active = sortKey === key;
            return (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border",
                  active
                    ? "bg-primary/20 text-primary border-primary/40"
                    : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/20 hover:text-white"
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
                {active
                  ? sortDir === "asc"
                    ? <ChevronUp className="w-3 h-3" />
                    : <ChevronDown className="w-3 h-3" />
                  : <ChevronsUpDown className="w-3 h-3 opacity-40" />}
              </button>
            );
          })}
        </div>

        <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
          {filtered.length} shoe{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Shoe cards grid ─────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground text-sm">
          No shoes found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((shoe, i) => {
            const raw = shoe as unknown as Record<string, unknown>;
            // Use Shoes Name (full brand+name) as the canonical display name
            const fullName = String(raw["Shoes Name"] || raw["Shoes"] || "Unknown");
            const brand = String(raw["Shoes Brand"] || "");
            // Short name = remove brand prefix for cleaner display
            const shortName = brand && fullName.startsWith(brand)
              ? fullName.slice(brand.length).trim()
              : fullName;
            const status = String(raw["Status"] || "Unknown");
            const photoUrl = String(raw["ItemPhoto"] || "");
            const distPct = Math.min((shoe.totalDist / MAX_SHOE_DIST) * 100, 100);
            const isWarning = shoe.totalDist > MAX_SHOE_DIST * 0.8 && status === "In Use";

            return (
              <div
                key={i}
                className={cn(
                  "glass-card rounded-xl border overflow-hidden transition-all hover:border-white/20 hover:-translate-y-0.5",
                  isWarning ? "border-orange-500/30" : "border-white/8"
                )}
              >
                {/* ── Photo section ─────────────────────────── */}
                <div className="relative h-44 bg-white/5 overflow-hidden">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={fullName}
                      className="w-full h-full object-contain p-3 transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-white/20" />
                    </div>
                  )}

                  {/* Status badge overlay */}
                  <div className="absolute top-2 right-2">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border backdrop-blur-sm",
                      STATUS_COLORS[status] || "bg-slate-500/20 text-slate-300 border-slate-500/30"
                    )}>
                      {status}
                    </span>
                  </div>

                  {/* Photo link */}
                  {photoUrl && (
                    <a
                      href={photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/40 text-white/60 hover:text-white hover:bg-black/60 transition-all"
                      title="View full photo"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {/* Warning overlay */}
                  {isWarning && (
                    <div className="absolute bottom-0 left-0 right-0 bg-orange-500/20 backdrop-blur-sm px-3 py-1.5 text-[10px] text-orange-300 text-center">
                      ⚠ Approaching {MAX_SHOE_DIST} km retirement
                    </div>
                  )}
                </div>

                {/* ── Card body ─────────────────────────────── */}
                <div className="p-4 space-y-3">
                  {/* Name + brand */}
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{brand}</p>
                    <p className="font-display font-600 text-white text-sm leading-snug mt-0.5">{shortName}</p>
                  </div>

                  {/* Distance progress bar */}
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">Distance used</span>
                      <span className={cn("font-mono-metric font-600", isWarning ? "text-orange-400" : "text-white")}>
                        {shoe.totalDist.toFixed(1)} km
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          distPct > 80 ? "bg-orange-400" : distPct > 50 ? "bg-amber-400" : "bg-primary"
                        )}
                        style={{ width: `${distPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                      <span>0 km</span>
                      <span>{MAX_SHOE_DIST} km</span>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <StatCell label="Sessions" value={String(shoe.usageCount)} />
                    <StatCell
                      label="Price"
                      value={shoe.parsedPrice > 0 ? `HK$${shoe.parsedPrice.toLocaleString()}` : "—"}
                      color="text-amber-400"
                    />
                    <StatCell
                      label="$/km"
                      value={shoe.costPerKm > 0 ? `$${shoe.costPerKm.toFixed(2)}` : "—"}
                      color="text-emerald-400"
                    />
                  </div>

                  {/* Dates */}
                  <div className="pt-2 border-t border-white/8 space-y-1">
                    {!!raw["Purchase Date"] && (
                      <DateRow icon={Calendar} label="Purchased" value={formatDateDisplay(String(raw["Purchase Date"]))} />
                    )}
                    {!!raw["First Use"] && (
                      <DateRow icon={Activity} label="First Use" value={formatDateDisplay(String(raw["First Use"]))} />
                    )}
                    {!!raw["Retired Date"] && (
                      <DateRow icon={ShoppingBag} label="Retired" value={formatDateDisplay(String(raw["Retired Date"]))} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white/4 rounded-lg px-2 py-2 text-center">
      <p className="text-[9px] text-muted-foreground mb-0.5">{label}</p>
      <p className={cn("font-mono-metric text-xs font-600", color || "text-white")}>{value}</p>
    </div>
  );
}

function DateRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <Icon className="w-3 h-3 shrink-0" />
      <span>{label}:</span>
      <span className="text-white/70">{value}</span>
    </div>
  );
}
