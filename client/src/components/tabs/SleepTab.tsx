// =============================================================
// Sleep Tab — King's Running AI Analytics
// =============================================================
import { useMemo } from "react";
import { Moon, Battery, Heart } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { parseDate, formatDateDisplay } from "@/lib/runningData";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export default function SleepTab() {
  const { sleeps } = useData();

  const sorted = useMemo(() =>
    [...sleeps].sort((a, b) => (parseDate(a.Date)?.getTime() || 0) - (parseDate(b.Date)?.getTime() || 0)),
    [sleeps]
  );

  const last30 = sorted.slice(-30);

  const chartData = useMemo(() =>
    last30.map((s) => ({
      date: formatDateDisplay(s.Date),
      Score: parseFloat(s.Score || "0") || null,
      "Resting HR": parseFloat(s["Resting Heart Rate"] || "0") || null,
      "Body Battery": parseFloat(s["Body Battery"] || "0") || null,
    })),
    [last30]
  );

  const latest = sorted[sorted.length - 1];

  const avgScore = useMemo(() => {
    const vals = sorted.map((s) => parseFloat(s.Score || "0")).filter(Boolean);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
  }, [sorted]);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SleepStatCard icon={Moon} label="Latest Score" value={latest.Score || "—"} color="text-blue-400" />
          <SleepStatCard icon={Battery} label="Body Battery" value={latest["Body Battery"] || "—"} color="text-emerald-400" />
          <SleepStatCard icon={Heart} label="Resting HR" value={`${latest["Resting Heart Rate"] || "—"} bpm`} color="text-red-400" />
          <SleepStatCard icon={Moon} label="Avg Score (All)" value={avgScore} color="text-purple-400" />
        </div>
      )}

      {/* Chart */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Moon className="w-4 h-4 text-blue-400" />
          <h2 className="font-display font-600 text-white text-sm">Sleep Score & Recovery (Last 30 Days)</h2>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 9 }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#94a3b8" }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="Score" fill="#3b82f6" opacity={0.7} maxBarSize={20} />
            <Line type="monotone" dataKey="Resting HR" stroke="#ef4444" strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="Body Battery" stroke="#10b981" strokeWidth={2} dot={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Score</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Resting HR</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Body Battery</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Pulse Ox</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Respiration</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Stress</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Quality</th>
              </tr>
            </thead>
            <tbody>
              {[...sorted].reverse().map((s, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDateDisplay(s.Date)}</td>
                  <td className="px-4 py-2.5 text-right font-mono-metric text-blue-400">{s.Score || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono-metric text-red-400">{s["Resting Heart Rate"] || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono-metric text-emerald-400">{s["Body Battery"] || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono-metric text-muted-foreground">{s["Pulse Ox"] || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono-metric text-muted-foreground">{s.Respiration || "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono-metric text-amber-400">{s.Stress || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{s.Quality || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SleepStatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
      <p className={`font-mono-metric font-600 text-xl ${color}`}>{value}</p>
    </div>
  );
}
