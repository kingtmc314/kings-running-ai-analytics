// =============================================================
// Analytics Tab — King's Running AI Analytics
// Design: Top-bar slicer row with dropdown-style filter groups,
//         full-width stacked bar chart with rich tooltip.
// =============================================================
import { useMemo, useState } from "react";
import { useData } from "@/contexts/DataContext";
import { parseDate, getShoeName, RUN_TYPE_COLORS } from "@/lib/runningData";
import { cn } from "@/lib/utils";
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import { ChevronDown, BarChart3, RotateCcw } from "lucide-react";

type AnalyticsView = "monthly" | "yearly" | "shoes" | "daily";

const RUN_TYPES = [
  "Easy", "Fartlek", "Interval", "Long", "Race",
  "Recovery", "Sprint", "Tempo", "Trail", "Theadmill (Gym)", "Time Trial", "Heart Rate",
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const VIEW_OPTIONS: { key: AnalyticsView; label: string }[] = [
  { key: "monthly", label: "Monthly" },
  { key: "yearly",  label: "Yearly" },
  { key: "shoes",   label: "By Shoe" },
  { key: "daily",   label: "Daily" },
];

// ─── Custom Tooltip ───────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="bg-slate-900/95 border border-white/15 rounded-xl p-3 shadow-2xl text-xs min-w-[160px]">
      <p className="text-white font-display font-600 mb-2 border-b border-white/10 pb-1.5">{label}</p>
      <div className="space-y-1">
        {[...payload].reverse().map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: p.fill }} />
              <span className="text-muted-foreground">{p.name}</span>
            </div>
            <span className="font-mono-metric text-white">{p.value.toFixed(1)} km</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-1.5 border-t border-white/10 flex justify-between">
        <span className="text-muted-foreground">Total</span>
        <span className="font-mono-metric text-primary font-600">{total.toFixed(1)} km</span>
      </div>
    </div>
  );
}

// ─── Dropdown Slicer ─────────────────────────────────────────

function DropdownSlicer({
  label,
  value,
  options,
  onChange,
  multiSelect,
  selected,
  onToggle,
}: {
  label: string;
  value?: string;
  options: string[];
  onChange?: (v: string) => void;
  multiSelect?: boolean;
  selected?: string[];
  onToggle?: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const displayLabel = multiSelect
    ? selected && selected.length === 0 ? `All ${label}` : `${selected?.length} selected`
    : value === "All" ? `All ${label}` : value;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all",
          open || (multiSelect ? (selected?.length ?? 0) > 0 : value !== "All")
            ? "bg-primary/15 border-primary/40 text-primary"
            : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20 hover:text-white"
        )}
      >
        <span className="font-medium">{displayLabel}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 z-20 bg-slate-900 border border-white/15 rounded-xl shadow-2xl p-2 min-w-[160px] max-h-64 overflow-y-auto">
            {options.map((opt) => {
              const isActive = multiSelect ? selected?.includes(opt) : value === opt;
              return (
                <button
                  key={opt}
                  onClick={() => {
                    if (multiSelect) onToggle?.(opt);
                    else { onChange?.(opt); setOpen(false); }
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  )}
                >
                  {multiSelect && (
                    <span className={cn(
                      "w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center text-[8px]",
                      isActive ? "bg-primary border-primary text-white" : "border-white/20"
                    )}>
                      {isActive && "✓"}
                    </span>
                  )}
                  {opt}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function AnalyticsTab() {
  const { logs, shoes } = useData();
  const [view, setView] = useState<AnalyticsView>("monthly");
  const [yearFilter, setYearFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);   // empty = all
  const [shoeStatusFilter, setShoeStatusFilter] = useState("All");

  const years = useMemo(() => {
    const ys = Array.from(
      new Set(logs.map((l) => parseDate(l.Date)?.getFullYear()).filter(Boolean))
    ).sort((a, b) => b! - a!);
    return ["All", ...ys.map(String)];
  }, [logs]);

  function toggleType(t: string) {
    setTypeFilters((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const d = parseDate(l.Date);
      if (!d) return false;
      if (yearFilter !== "All" && String(d.getFullYear()) !== yearFilter) return false;
      if (monthFilter !== "All") {
        const mIdx = MONTHS.indexOf(monthFilter);
        if (mIdx >= 0 && d.getMonth() !== mIdx) return false;
      }
      const raw = l as unknown as Record<string, unknown>;
      const rt = String(raw["Running Type"] || "");
      if (typeFilters.length > 0 && !typeFilters.includes(rt)) return false;
      if (shoeStatusFilter !== "All") {
        const sn = getShoeName(l);
        const shoe = shoes.find((s) => (s.Shoes || s["Shoes Name"]) === sn);
        if (!shoe || shoe.Status !== shoeStatusFilter) return false;
      }
      return true;
    });
  }, [logs, shoes, yearFilter, monthFilter, typeFilters, shoeStatusFilter]);

  const chartData = useMemo(() => {
    const grouped: Record<string, Record<string, number> & { total: number }> = {};
    filteredLogs.forEach((l) => {
      const d = parseDate(l.Date);
      if (!d) return;
      const raw = l as unknown as Record<string, unknown>;
      let key = "";
      if (view === "monthly")
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      else if (view === "yearly")
        key = String(d.getFullYear());
      else if (view === "shoes")
        key = getShoeName(l) || "Unknown";
      else
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!grouped[key]) grouped[key] = { total: 0 };
      const rt = String(raw["Running Type"] || "Easy");
      const dist = parseFloat(String(raw["Distance (km)"] ?? "0")) || 0;
      grouped[key][rt] = (grouped[key][rt] || 0) + dist;
      grouped[key].total += dist;
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, vals]) => ({
        key,
        ...Object.fromEntries(
          Object.entries(vals).map(([k, v]) => [k, typeof v === "number" ? parseFloat(v.toFixed(1)) : v])
        ),
      }));
  }, [filteredLogs, view]);

  const totalKm = useMemo(
    () => filteredLogs.reduce((s, l) => {
      const raw = l as unknown as Record<string, unknown>;
      return s + (parseFloat(String(raw["Distance (km)"] ?? "0")) || 0);
    }, 0),
    [filteredLogs]
  );

  const usedTypes = useMemo(
    () =>
      Array.from(
        new Set(
          filteredLogs
            .map((l) => String((l as unknown as Record<string, unknown>)["Running Type"] || ""))
            .filter(Boolean)
        )
      ),
    [filteredLogs]
  );

  // Summary stats
  const avgPerMonth = useMemo(() => {
    if (view !== "monthly" || chartData.length === 0) return 0;
    return totalKm / chartData.length;
  }, [view, totalKm, chartData]);

  const peakMonth = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((best, cur) => {
      const curTotal = (cur as Record<string, unknown>).total as number || 0;
      const bestTotal = (best as Record<string, unknown>).total as number || 0;
      return curTotal > bestTotal ? cur : best;
    }, chartData[0]);
  }, [chartData]);

  const hasFilters = yearFilter !== "All" || monthFilter !== "All" || typeFilters.length > 0 || shoeStatusFilter !== "All";

  function resetFilters() {
    setYearFilter("All");
    setMonthFilter("All");
    setTypeFilters([]);
    setShoeStatusFilter("All");
  }

  return (
    <div className="space-y-4">
      {/* ── Top control bar ─────────────────────────────────── */}
      <div className="glass-card rounded-xl p-3 flex flex-wrap items-center gap-2">
        {/* View toggle */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {VIEW_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                view === key
                  ? "bg-primary/25 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-white/10" />

        {/* Filter dropdowns */}
        <DropdownSlicer
          label="Year"
          value={yearFilter}
          options={years}
          onChange={setYearFilter}
        />
        <DropdownSlicer
          label="Month"
          value={monthFilter}
          options={["All", ...MONTHS]}
          onChange={setMonthFilter}
        />
        <DropdownSlicer
          label="Run Type"
          multiSelect
          selected={typeFilters}
          options={RUN_TYPES}
          onToggle={toggleType}
        />
        <DropdownSlicer
          label="Shoe Status"
          value={shoeStatusFilter}
          options={["All", "In Use", "Not Yet Opened", "Retired"]}
          onChange={setShoeStatusFilter}
        />

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground border border-white/10 hover:border-white/20 hover:text-white transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}

        {/* Summary metrics */}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="font-mono-metric text-primary text-sm font-600">{totalKm.toFixed(1)} km</p>
            <p className="text-[9px] text-muted-foreground">Total</p>
          </div>
          {view === "monthly" && avgPerMonth > 0 && (
            <div className="text-right">
              <p className="font-mono-metric text-emerald-400 text-sm font-600">{avgPerMonth.toFixed(1)} km</p>
              <p className="text-[9px] text-muted-foreground">Avg/Month</p>
            </div>
          )}
          {peakMonth && (
            <div className="text-right">
              <p className="font-mono-metric text-amber-400 text-sm font-600">{((peakMonth as Record<string, unknown>).total as number || 0).toFixed(1)} km</p>
              <p className="text-[9px] text-muted-foreground">Peak: {peakMonth.key}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Chart ───────────────────────────────────────────── */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h2 className="font-display font-600 text-white text-sm">
            {VIEW_OPTIONS.find((v) => v.key === view)?.label} Distance Analysis
          </h2>
          <span className="text-[10px] text-muted-foreground ml-1">
            ({filteredLogs.length} activities)
          </span>
        </div>

        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            No data for the selected filters.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={420}>
            <ComposedChart
              data={chartData}
              margin={{ top: 5, right: 15, left: -5, bottom: view === "shoes" ? 80 : 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="key"
                tick={{ fill: "#64748b", fontSize: 9 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                angle={view === "shoes" ? -45 : -35}
                textAnchor="end"
                interval={view === "daily" ? Math.floor(chartData.length / 20) : 0}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
                label={{ value: "km", angle: -90, position: "insideLeft", fill: "#475569", fontSize: 10, dy: 20 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Legend
                wrapperStyle={{ fontSize: 10, paddingTop: 12 }}
                formatter={(value) => (
                  <span style={{ color: "#94a3b8" }}>{value}</span>
                )}
              />
              {usedTypes.map((rt) => (
                <Bar
                  key={rt}
                  dataKey={rt}
                  stackId="dist"
                  fill={RUN_TYPE_COLORS[rt] || "#64748b"}
                  maxBarSize={view === "yearly" ? 80 : view === "shoes" ? 50 : 30}
                  radius={usedTypes[usedTypes.length - 1] === rt ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Run type breakdown mini-cards ───────────────────── */}
      {usedTypes.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {usedTypes.map((rt) => {
            const km = filteredLogs
              .filter((l) => String((l as unknown as Record<string, unknown>)["Running Type"] || "") === rt)
              .reduce((s, l) => s + (parseFloat(String((l as unknown as Record<string, unknown>)["Distance (km)"] ?? "0")) || 0), 0);
            const pct = totalKm > 0 ? (km / totalKm) * 100 : 0;
            return (
              <div key={rt} className="glass-card rounded-xl p-3 border border-white/8">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className="w-2 h-2 rounded-sm shrink-0"
                    style={{ background: RUN_TYPE_COLORS[rt] || "#64748b" }}
                  />
                  <span className="text-[10px] text-muted-foreground truncate">{rt}</span>
                </div>
                <p className="font-mono-metric text-white text-sm font-600">{km.toFixed(1)}</p>
                <p className="text-[9px] text-muted-foreground">{pct.toFixed(1)}%</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
