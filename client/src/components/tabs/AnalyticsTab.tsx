// =============================================================
// Analytics Tab — King's Running AI Analytics
// =============================================================
import { useMemo, useState } from "react";
import { useData } from "@/contexts/DataContext";
import { parseDate, getShoeName, RUN_TYPE_COLORS } from "@/lib/runningData";
import { cn } from "@/lib/utils";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

type AnalyticsView = "monthly" | "yearly" | "shoes" | "daily";

const RUN_TYPES = ["Easy", "Fartlek", "Interval", "Long", "Race", "Recovery", "Sprint", "Tempo", "Trail", "Theadmill (Gym)", "Time Trial", "Heart Rate"];
const ALL_MONTHS = ["All", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

export default function AnalyticsTab() {
  const { logs, shoes } = useData();
  const [view, setView] = useState<AnalyticsView>("monthly");
  const [yearFilter, setYearFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [shoeStatusFilter, setShoeStatusFilter] = useState("All");

  const years = useMemo(() => {
    const ys = Array.from(new Set(logs.map((l) => parseDate(l.Date)?.getFullYear()).filter(Boolean))).sort((a, b) => b! - a!);
    return ["All", ...ys.map(String)];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const d = parseDate(l.Date);
      if (!d) return false;
      if (yearFilter !== "All" && String(d.getFullYear()) !== yearFilter) return false;
      if (monthFilter !== "All") {
        const mIdx = ALL_MONTHS.indexOf(monthFilter);
        if (mIdx > 0 && d.getMonth() + 1 !== mIdx) return false;
      }
      if (typeFilter !== "All" && l["Running Type"] !== typeFilter) return false;
      if (shoeStatusFilter !== "All") {
        const sn = getShoeName(l);
        const shoe = shoes.find((s) => (s.Shoes || s["Shoes Name"]) === sn);
        if (!shoe || shoe.Status !== shoeStatusFilter) return false;
      }
      return true;
    });
  }, [logs, shoes, yearFilter, monthFilter, typeFilter, shoeStatusFilter]);

  const chartData = useMemo(() => {
    const grouped: Record<string, Record<string, number> & { total: number }> = {};
    filteredLogs.forEach((l) => {
      const d = parseDate(l.Date);
      if (!d) return;
      const raw = l as unknown as Record<string, unknown>;
      let key = "";
      if (view === "monthly") key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      else if (view === "yearly") key = String(d.getFullYear());
      else if (view === "shoes") key = getShoeName(l);
      else key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!grouped[key]) { grouped[key] = { total: 0 }; }
      const rt = String(raw["Running Type"] || "Easy");
      const dist = parseFloat(String(raw["Distance (km)"] ?? "0")) || 0;
      grouped[key][rt] = (grouped[key][rt] || 0) + dist;
      grouped[key].total += dist;
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, vals]) => ({
        key,
        ...Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, typeof v === "number" ? parseFloat(v.toFixed(1)) : v])),
      }));
  }, [filteredLogs, view]);

  const totalKm = useMemo(() => filteredLogs.reduce((s, l) => {
    const raw = l as unknown as Record<string, unknown>;
    return s + (parseFloat(String(raw["Distance (km)"] ?? "0")) || 0);
  }, 0), [filteredLogs]);
  const usedTypes = useMemo(() => Array.from(new Set(filteredLogs.map((l) => String((l as unknown as Record<string, unknown>)["Running Type"] || "")).filter(Boolean))), [filteredLogs]);

  return (
    <div className="flex gap-5">
      {/* Slicers sidebar */}
      <div className="w-44 shrink-0 space-y-4">
        <SlicerGroup label="View">
          {(["monthly", "yearly", "shoes", "daily"] as AnalyticsView[]).map((v) => (
            <SlicerBtn key={v} active={view === v} onClick={() => setView(v)}>
              {v === "monthly" ? "Monthly" : v === "yearly" ? "Yearly" : v === "shoes" ? "By Shoe" : "Daily"}
            </SlicerBtn>
          ))}
        </SlicerGroup>

        <SlicerGroup label="Year">
          {years.map((y) => (
            <SlicerBtn key={y} active={yearFilter === y} onClick={() => setYearFilter(y)}>{y}</SlicerBtn>
          ))}
        </SlicerGroup>

        <SlicerGroup label="Month">
          {ALL_MONTHS.map((m) => (
            <SlicerBtn key={m} active={monthFilter === m} onClick={() => setMonthFilter(m)}>{m}</SlicerBtn>
          ))}
        </SlicerGroup>

        <SlicerGroup label="Run Type">
          {["All", ...RUN_TYPES].map((t) => (
            <SlicerBtn key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>{t}</SlicerBtn>
          ))}
        </SlicerGroup>

        <SlicerGroup label="Shoe Status">
          {["All", "In Use", "Not Yet Opened", "Retired"].map((s) => (
            <SlicerBtn key={s} active={shoeStatusFilter === s} onClick={() => setShoeStatusFilter(s)}>{s}</SlicerBtn>
          ))}
        </SlicerGroup>
      </div>

      {/* Chart area */}
      <div className="flex-1 glass-card rounded-xl p-5 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-600 text-white text-sm">
            {view === "monthly" ? "Monthly" : view === "yearly" ? "Yearly" : view === "shoes" ? "Distance by Shoe" : "Daily"} Analysis
          </h2>
          <span className="font-mono-metric text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
            Total: {totalKm.toFixed(1)} km
          </span>
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="key"
              tick={{ fill: "#64748b", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              interval={view === "daily" ? 6 : 0}
            />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
            {usedTypes.map((rt) => (
              <Bar
                key={rt}
                dataKey={rt}
                stackId="dist"
                fill={RUN_TYPE_COLORS[rt] || "#64748b"}
                maxBarSize={40}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SlicerGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-600 text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function SlicerBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-[10px] px-2 py-1 rounded-md border transition-all duration-150",
        active
          ? "bg-primary/20 border-primary/50 text-primary"
          : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
