// =============================================================
// Body Fitness Tab — King's Running AI Analytics
// =============================================================
import { useMemo } from "react";
import { Scale, TrendingDown, TrendingUp } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { parseDate, formatDateDisplay } from "@/lib/runningData";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const BODY_FIELDS = [
  { key: "Weight", label: "Weight (kg)", color: "#3b82f6" },
  { key: "BMI", label: "BMI", color: "#10b981" },
  { key: "BodyFat", label: "Body Fat (%)", color: "#f97316" },
  { key: "MuscleMass", label: "Muscle Mass (kg)", color: "#a855f7" },
  { key: "BMR", label: "BMR (kcal)", color: "#f59e0b" },
];

export default function BodyFitnessTab() {
  const { bodyStats } = useData();

  const sorted = useMemo(() =>
    [...bodyStats].sort((a, b) => (parseDate(a.Date)?.getTime() || 0) - (parseDate(b.Date)?.getTime() || 0)),
    [bodyStats]
  );

  const chartData = useMemo(() =>
    sorted.map((b) => ({
      date: formatDateDisplay(b.Date),
      Weight: parseFloat(b.Weight || "0") || null,
      BMI: parseFloat(b.BMI || "0") || null,
      BodyFat: parseFloat(b.BodyFat || "0") || null,
      MuscleMass: parseFloat(b.MuscleMass || "0") || null,
      BMR: parseFloat(b.BMR || "0") || null,
    })),
    [sorted]
  );

  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];

  const delta = (key: string) => {
    if (!latest || !prev) return null;
    const a = parseFloat((latest as Record<string, string>)[key] || "0");
    const b = parseFloat((prev as Record<string, string>)[key] || "0");
    if (!a || !b) return null;
    return parseFloat((a - b).toFixed(2));
  };

  return (
    <div className="space-y-5">
      {/* Latest stats */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {BODY_FIELDS.map((f) => {
            const val = parseFloat((latest as Record<string, string>)[f.key] || "0");
            const d = delta(f.key);
            return (
              <div key={f.key} className="glass-card rounded-xl p-4">
                <p className="text-[10px] text-muted-foreground mb-1">{f.label}</p>
                <p className="font-mono-metric font-600 text-white text-xl">{val || "—"}</p>
                {d !== null && (
                  <p className={`text-[10px] flex items-center gap-0.5 mt-1 ${d < 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {d < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {d > 0 ? "+" : ""}{d}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Weight trend chart */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-4 h-4 text-primary" />
          <h2 className="font-display font-600 text-white text-sm">Body Composition Trend</h2>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 9 }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 8)} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {BODY_FIELDS.slice(0, 4).map((f) => (
              <Line
                key={f.key}
                type="monotone"
                dataKey={f.key}
                name={f.label}
                stroke={f.color}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* History table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Weight</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">BMI</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Body Fat %</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Fat Mass</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Muscle</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">BMR</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Visceral Fat</th>
              </tr>
            </thead>
            <tbody>
              {[...sorted].reverse().map((b, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDateDisplay(b.Date)}</td>
                  <td className="px-4 py-2.5 text-right font-mono-metric text-white">{b.Weight || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono-metric text-muted-foreground">{b.BMI || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono-metric text-orange-400">{b.BodyFat || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono-metric text-muted-foreground">{b.FatMass || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono-metric text-purple-400">{b.MuscleMass || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono-metric text-amber-400">{b.BMR || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono-metric text-muted-foreground">{b.VisceralFat || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
