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
  ResponsiveContainer, Legend, Cell, LineChart, Line, ReferenceLine,
} from "recharts";
import { ChevronDown, BarChart3, RotateCcw, TrendingUp, Activity } from "lucide-react";

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
    <div className="bg-slate-900/95 border border-white/15 rounded-xl p-3 shadow-2xl text-sm min-w-[160px]">
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
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all",
            open || (multiSelect ? (selected?.length ?? 0) > 0 : value !== "All")
            ? "bg-primary/15 border-primary/40 text-primary"
            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
        )}
      >
        <span className="font-medium">{displayLabel}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 min-w-[160px] max-h-64 overflow-y-auto">
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
                    "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
        const shoe = shoes.find((s) => {
          const sr = s as unknown as Record<string, unknown>;
          return String(sr["Shoes Name"] || sr["Shoes"] || "") === sn;
        });
        if (!shoe) return false;
        const shoeRaw = shoe as unknown as Record<string, unknown>;
        const shoeStatus = String(shoeRaw["Status"] || shoe.Status || "");
        if (shoeStatus !== shoeStatusFilter) return false;
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
      <div className="glass-card rounded-xl p-3 flex flex-wrap items-center gap-2" style={{overflow:'visible', position:'relative', zIndex:10}}>
        {/* View toggle */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          {VIEW_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                view === key
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-slate-200" />

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
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-900 transition-all bg-white"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}

        {/* Summary metrics */}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="font-mono-metric text-primary text-sm font-600">{totalKm.toFixed(1)} km</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          {view === "monthly" && avgPerMonth > 0 && (
            <div className="text-right">
              <p className="font-mono-metric text-emerald-600 text-sm font-600">{avgPerMonth.toFixed(1)} km</p>
              <p className="text-sm text-muted-foreground">Avg/Month</p>
            </div>
          )}
          {peakMonth && (
            <div className="text-right">
              <p className="font-mono-metric text-amber-600 text-sm font-600">{((peakMonth as Record<string, unknown>).total as number || 0).toFixed(1)} km</p>
              <p className="text-sm text-muted-foreground">Peak: {peakMonth.key}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Chart ───────────────────────────────────────────── */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h2 className="font-display font-600 text-slate-800 text-sm">
            {VIEW_OPTIONS.find((v) => v.key === view)?.label} Distance Analysis
          </h2>
          <span className="text-sm text-muted-foreground ml-1">
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

      {/* ── Training Load: Weekly Volume + 4-week Rolling Avg ── */}
      <TrainingLoadChart logs={filteredLogs} />

      {/* ── Metrics Analysis: HR, Cadence, GCT, Step Length ── */}
      <MetricsChart logs={filteredLogs} />

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
                  <span className="text-sm text-muted-foreground truncate">{rt}</span>
                </div>
                <p className="font-mono-metric text-slate-800 text-sm font-600">{km.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">{pct.toFixed(1)}%</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Training Load Chart ──────────────────────────────────────

type RunLog = { Date: string; [key: string]: unknown };

function TrainingLoadChart({ logs }: { logs: RunLog[] }) {
  const weeklyData = useMemo(() => {
    if (logs.length === 0) return [];

    const weekMap: Record<string, number> = {};
    logs.forEach((l) => {
      const d = parseDate(l.Date);
      if (!d) return;
      const raw = l as unknown as Record<string, unknown>;
      const dist = parseFloat(String(raw["Distance (km)"] ?? "0")) || 0;
      const day = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((day + 6) % 7));
      const yr = monday.getFullYear();
      const startOfYear = new Date(yr, 0, 1);
      const weekNum = Math.ceil(
        ((monday.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
      );
      const key = `${yr}-W${String(weekNum).padStart(2, "0")}`;
      weekMap[key] = (weekMap[key] || 0) + dist;
    });

    const sorted = Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, km]) => ({ week, km: parseFloat(km.toFixed(1)), avg4: 0 }));

    for (let i = 0; i < sorted.length; i++) {
      const slice = sorted.slice(Math.max(0, i - 3), i + 1);
      sorted[i].avg4 = parseFloat(
        (slice.reduce((s, x) => s + x.km, 0) / slice.length).toFixed(1)
      );
    }

    return sorted.slice(-52);
  }, [logs]);

  if (weeklyData.length === 0) return null;

  const maxKm = Math.max(...weeklyData.map((w) => w.km));
  const avgKm = weeklyData.reduce((s, w) => s + w.km, 0) / weeklyData.length;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h2 className="font-display font-600 text-slate-800 text-base">Training Load — Weekly Volume</h2>
          <span className="text-sm text-muted-foreground ml-1">(last 52 weeks)</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="font-mono-metric text-emerald-600 text-sm font-600">{avgKm.toFixed(1)} km</p>
            <p className="text-sm text-muted-foreground">Avg/Week</p>
          </div>
          <div className="text-right">
            <p className="font-mono-metric text-amber-600 text-sm font-600">{maxKm.toFixed(1)} km</p>
            <p className="text-sm text-muted-foreground">Peak Week</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-blue-500/60 inline-block" />
          <span className="text-slate-600">Weekly km</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-0 border-t-2 border-dashed border-amber-400 inline-block" />
          <span className="text-slate-600">4-week rolling avg</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-0 border-t border-dashed border-slate-500/50 inline-block" />
          <span className="text-slate-600">Overall avg ({avgKm.toFixed(0)} km)</span>
        </span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={weeklyData} margin={{ top: 5, right: 30, left: -5, bottom: 30 }}>
          <defs>
            <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: "#64748b", fontSize: 9 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            angle={-35}
            textAnchor="end"
            interval={Math.floor(weeklyData.length / 12)}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            label={{ value: "km", angle: -90, position: "insideLeft", fill: "#475569", fontSize: 10, dy: 20 }}
          />
          <Tooltip
            contentStyle={{
              background: "#1e293b",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)} km`,
              name === "km" ? "Weekly Volume" : "4-wk Rolling Avg",
            ]}
          />
          <ReferenceLine
            y={avgKm}
            stroke="rgba(100,116,139,0.4)"
            strokeDasharray="4 4"
            label={{ value: `Avg ${avgKm.toFixed(0)}`, fill: "#64748b", fontSize: 9, position: "right" }}
          />
          <Bar
            dataKey="km"
            fill="url(#weekGrad)"
            stroke="#3b82f6"
            strokeWidth={0.5}
            maxBarSize={18}
            radius={[3, 3, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="avg4"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 3"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Metrics Analysis Chart ───────────────────────────────────
// Shows monthly averages for: Avg HR, Cadence, Ground Contact Time, Step Length

type MetricKey = "avgHR" | "cadence" | "gct" | "stepLength";

const METRIC_CONFIG: Record<MetricKey, { label: string; unit: string; color: string; field: string; scale?: number }> = {
  avgHR:      { label: "Avg Heart Rate",        unit: "bpm",  color: "#ef4444", field: "Average Heart Rate" },
  cadence:    { label: "Avg Cadence",            unit: "spm",  color: "#3b82f6", field: "Average Cadence" },
  gct:        { label: "Ground Contact Time",    unit: "ms",   color: "#f59e0b", field: "Ground Contact Time" },
  stepLength: { label: "Step Length",            unit: "m",    color: "#10b981", field: "Step Length" },
};

function MetricsChart({ logs }: { logs: RunLog[] }) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("avgHR");

  const chartData = useMemo(() => {
    const cfg = METRIC_CONFIG[activeMetric];
    const grouped: Record<string, { sum: number; count: number }> = {};

    logs.forEach((l) => {
      const d = parseDate(l.Date);
      if (!d) return;
      const raw = l as unknown as Record<string, unknown>;
      const val = parseFloat(String(raw[cfg.field] ?? ""));
      if (isNaN(val) || val <= 0) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped[key]) grouped[key] = { sum: 0, count: 0 };
      grouped[key].sum += val;
      grouped[key].count += 1;
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { sum, count }]) => ({
        month,
        value: parseFloat((sum / count).toFixed(2)),
      }));
  }, [logs, activeMetric]);

  const cfg = METRIC_CONFIG[activeMetric];

  // Summary stats
  const avgVal = chartData.length > 0
    ? chartData.reduce((s, d) => s + d.value, 0) / chartData.length
    : 0;
  const minVal = chartData.length > 0 ? Math.min(...chartData.map((d) => d.value)) : 0;
  const maxVal = chartData.length > 0 ? Math.max(...chartData.map((d) => d.value)) : 0;
  const latest = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const trend = chartData.length >= 2
    ? chartData[chartData.length - 1].value - chartData[chartData.length - 2].value
    : 0;

  if (chartData.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="font-display font-semibold text-slate-800 text-base">Metrics Analysis</h2>
          <span className="text-sm text-muted-foreground ml-1">Monthly averages</span>
        </div>
        {/* Summary stats */}
        <div className="flex items-center gap-4 shrink-0 flex-wrap">
          <div className="text-right">
            <p className="font-mono-metric text-sm font-semibold" style={{ color: cfg.color }}>
              {latest.toFixed(activeMetric === "stepLength" ? 2 : 0)} {cfg.unit}
            </p>
            <p className="text-sm text-muted-foreground">Latest</p>
          </div>
          <div className="text-right">
            <p className="font-mono-metric text-sm font-semibold text-slate-700">
              {avgVal.toFixed(activeMetric === "stepLength" ? 2 : 0)} {cfg.unit}
            </p>
            <p className="text-sm text-muted-foreground">Avg</p>
          </div>
          <div className="text-right">
            <p className={`font-mono-metric text-sm font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {trend >= 0 ? "+" : ""}{trend.toFixed(activeMetric === "stepLength" ? 2 : 1)} {cfg.unit}
            </p>
            <p className="text-sm text-muted-foreground">vs prev month</p>
          </div>
          <div className="text-right">
            <p className="font-mono-metric text-sm font-semibold text-slate-500">
              {minVal.toFixed(activeMetric === "stepLength" ? 2 : 0)} – {maxVal.toFixed(activeMetric === "stepLength" ? 2 : 0)}
            </p>
            <p className="text-sm text-muted-foreground">Range</p>
          </div>
        </div>
      </div>

      {/* Metric selector tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 mb-4 w-fit flex-wrap">
        {(Object.entries(METRIC_CONFIG) as [MetricKey, typeof METRIC_CONFIG[MetricKey]][]).map(([key, c]) => (
          <button
            key={key}
            onClick={() => setActiveMetric(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeMetric === key
                ? "bg-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
            style={activeMetric === key ? { color: c.color } : {}}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
          <defs>
            <linearGradient id={`metricGrad-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={cfg.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={cfg.color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(148,163,184,0.3)" }}
            angle={-35}
            textAnchor="end"
            interval={Math.max(0, Math.floor(chartData.length / 18))}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) =>
              activeMetric === "stepLength" ? v.toFixed(2) : Math.round(v).toString()
            }
            label={{
              value: cfg.unit,
              angle: -90,
              position: "insideLeft",
              fill: "#475569",
              fontSize: 11,
              dy: 30,
            }}
          />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              fontSize: 13,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
            labelStyle={{ color: "#475569", fontWeight: 600, marginBottom: 4 }}
            formatter={(value: number) => [
              `${activeMetric === "stepLength" ? value.toFixed(2) : value.toFixed(1)} ${cfg.unit}`,
              cfg.label,
            ]}
          />
          <ReferenceLine
            y={avgVal}
            stroke={cfg.color}
            strokeDasharray="5 3"
            strokeOpacity={0.5}
            label={{
              value: `Avg ${avgVal.toFixed(activeMetric === "stepLength" ? 2 : 0)}`,
              fill: cfg.color,
              fontSize: 10,
              position: "right",
            }}
          />
          <Bar
            dataKey="value"
            fill={`url(#metricGrad-${activeMetric})`}
            stroke={cfg.color}
            strokeWidth={1.5}
            maxBarSize={28}
            radius={[4, 4, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={cfg.color}
            strokeWidth={2.5}
            dot={{ fill: cfg.color, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: cfg.color }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Insight note */}
      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-600">
          {activeMetric === "avgHR" && (
            <>A <strong>lower average HR</strong> at the same pace indicates improved aerobic efficiency. Track this alongside pace to measure fitness gains.</>
          )}
          {activeMetric === "cadence" && (
            <>Optimal running cadence is typically <strong>170–180 spm</strong>. Higher cadence reduces ground impact and injury risk. Aim to gradually increase if below 165 spm.</>
          )}
          {activeMetric === "gct" && (
            <>Shorter <strong>ground contact time (GCT)</strong> indicates better running economy and faster leg turnover. Elite runners typically achieve under 200ms.</>
          )}
          {activeMetric === "stepLength" && (
            <>Longer <strong>step length</strong> at the same cadence means more speed. Improving step length through strength and flexibility training is key for race performance.</>
          )}
        </p>
      </div>
    </div>
  );
}
