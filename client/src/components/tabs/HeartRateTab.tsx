// =============================================================
// Heart Rate Tab — King's Running AI Analytics
// =============================================================
import { useMemo } from "react";
import { Heart } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { parseDate, formatDateDisplay, getHRZone } from "@/lib/runningData";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const ZONE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#f97316", "#ef4444"];

export default function HeartRateTab() {
  const { heartRates, logs, latestRestingHR } = useData();

  const sorted = useMemo(() =>
    [...heartRates].sort((a, b) => (parseDate(a.Date)?.getTime() || 0) - (parseDate(b.Date)?.getTime() || 0)),
    [heartRates]
  );

  const chartData = useMemo(() =>
    sorted.map((h) => ({
      date: formatDateDisplay(h.Date),
      Resting: parseFloat(h.Resting || "0") || null,
      High: parseFloat(h.High || "0") || null,
    })),
    [sorted]
  );

  // Zone distribution from run logs
  const zoneDistribution = useMemo(() => {
    const counts: Record<string, number> = { "Z1": 0, "Z2": 0, "Z3": 0, "Z4": 0, "Z5": 0, "< Z1": 0 };
    logs.forEach((l) => {
      const avg = parseFloat(l["Average Heart Rate"] || "0");
      if (!avg) return;
      const z = getHRZone(avg, latestRestingHR);
      counts[z.zone] = (counts[z.zone] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [logs, latestRestingHR]);

  return (
    <div className="space-y-5">
      {/* Latest HR */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Latest Resting HR</p>
            <p className="font-mono-metric font-700 text-2xl text-red-400">{sorted[sorted.length - 1].Resting} bpm</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Latest High HR</p>
            <p className="font-mono-metric font-700 text-2xl text-orange-400">{sorted[sorted.length - 1].High || "—"} bpm</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Max HR (configured)</p>
            <p className="font-mono-metric font-700 text-2xl text-white">202 bpm</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Trend chart */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-red-400" />
            <h2 className="font-display font-600 text-white text-sm">Resting HR Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 9 }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" interval={Math.floor(chartData.length / 6)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#94a3b8" }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="Resting" stroke="#ef4444" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="High" stroke="#f97316" strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 2" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Zone pie */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-primary" />
            <h2 className="font-display font-600 text-slate-800 text-sm">Training Zone Distribution</h2>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={zoneDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {zoneDistribution.map((_, i) => (
                    <Cell key={i} fill={ZONE_COLORS[i % ZONE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {zoneDistribution.map((z, i) => (
                <div key={z.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ZONE_COLORS[i % ZONE_COLORS.length] }} />
                  <span className="text-muted-foreground">{z.name}</span>
                  <span className="font-mono-metric text-slate-800 ml-auto">{z.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Resting HR</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">High HR</th>
              </tr>
            </thead>
            <tbody>
              {[...sorted].reverse().map((h, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDateDisplay(h.Date)}</td>
                  <td className="px-4 py-2.5 text-right font-mono-metric text-red-400">{h.Resting} bpm</td>
                  <td className="px-4 py-2.5 text-right font-mono-metric text-orange-400">{h.High || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
