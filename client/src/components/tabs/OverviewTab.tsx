// =============================================================
// Overview Tab — King's Running AI Analytics
// Design: Dark glassmorphism — stat cards, race countdown hero,
//         HR zones, PBs, 12-month activity trend.
// =============================================================
import { useMemo, useEffect, useState } from "react";
import {
  ShoppingBag, Trophy, Activity, Heart, Flame, TrendingUp,
  Calendar, MapPin, Clock, Zap, ChevronRight,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import {
  parseDate, secondsToHMS, paceToString, formatDateDisplay, logToSeconds,
} from "@/lib/runningData";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── HR Zone config ───────────────────────────────────────────

const ZONE_CONFIG = [
  { key: "Z1", label: "ZONE 1 (59–74%)", color: "#3b82f6", bg: "bg-blue-500/10 border-blue-500/30" },
  { key: "Z2", label: "ZONE 2 (74–84%)", color: "#10b981", bg: "bg-emerald-500/10 border-emerald-500/30" },
  { key: "Z3", label: "ZONE 3 (84–88%)", color: "#f59e0b", bg: "bg-amber-500/10 border-amber-500/30" },
  { key: "Z4", label: "ZONE 4 (88–95%)", color: "#f97316", bg: "bg-orange-500/10 border-orange-500/30" },
  { key: "Z5", label: "ZONE 5 (95–100%)", color: "#ef4444", bg: "bg-red-500/10 border-red-500/30" },
];

const PB_DISTANCES = [
  { key: "5K",           label: "5K" },
  { key: "10K",          label: "10K" },
  { key: "Half Marathon", label: "Half Marathon" },
  { key: "Marathon",     label: "Marathon" },
];

// ─── Distance label map ───────────────────────────────────────

const DIST_LABEL: Record<string, string> = {
  "5": "5K", "5.0": "5K",
  "10": "10K", "10.0": "10K",
  "21.0975": "Half Marathon", "21.1": "Half Marathon", "21": "Half Marathon",
  "42.195": "Full Marathon", "42.2": "Full Marathon", "42": "Full Marathon",
};

// ─── Countdown hook ───────────────────────────────────────────

function useCountdown(targetDate: Date | null) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!targetDate) return null;
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true };
  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, past: false };
}

// ─── Main Component ───────────────────────────────────────────

export default function OverviewTab() {
  const { logs, shoes, races, latestRestingHR, hrZones, raceStats } = useData();

  const activeShoes = shoes.filter((s) => s.Status === "In Use").length;
  const completedRaces = races.filter((r) => r.完成).length;

  // Next upcoming race
  const nextRace = useMemo(() => {
    const now = new Date();
    const upcoming = races
      .map((r) => ({ race: r, date: parseDate(r.日期) }))
      .filter(({ date, race }) => date && date >= now && !race.完成)
      .sort((a, b) => a.date!.getTime() - b.date!.getTime());
    return upcoming[0] || null;
  }, [races]);

  const countdown = useCountdown(nextRace?.date || null);

  // Activity trend last 12 months
  const trendData = useMemo(() => {
    const now = new Date();
    const months: { month: string; km: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ month: key, km: 0 });
    }
    logs.forEach((l) => {
      const d = parseDate(l.Date);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = months.find((m) => m.month === key);
      const raw = l as unknown as Record<string, unknown>;
      if (entry) entry.km += parseFloat(String(raw["Distance (km)"] ?? "0")) || 0;
    });
    return months.map((m) => ({ ...m, km: parseFloat(m.km.toFixed(1)) }));
  }, [logs]);

  const totalKm = useMemo(
    () => logs.reduce((s, l) => {
      const raw = l as unknown as Record<string, unknown>;
      return s + (parseFloat(String(raw["Distance (km)"] ?? "0")) || 0);
    }, 0),
    [logs]
  );

  return (
    <div className="space-y-6">
      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingBag}
          iconBg="bg-violet-500/20"
          iconColor="text-violet-400"
          value={activeShoes}
          label="Total Shoes Active"
          sub="Rotation"
          className="stagger-1"
        />
        <StatCard
          icon={Trophy}
          iconBg="bg-amber-500/20"
          iconColor="text-amber-400"
          value={completedRaces}
          label="Race Records"
          sub="Finished Events"
          className="stagger-2"
        />
        <StatCard
          icon={Activity}
          iconBg="bg-orange-500/20"
          iconColor="text-orange-400"
          value={logs.length}
          label="Total Activities"
          sub="All Time"
          className="stagger-3"
        />
        <StatCard
          icon={Heart}
          iconBg="bg-red-500/20"
          iconColor="text-red-400"
          value={`${latestRestingHR} bpm`}
          label="Resting HR"
          sub="Latest Record"
          className="stagger-4"
        />
      </div>

      {/* ── Race Countdown Hero ──────────────────────────────── */}
      {nextRace && countdown && (
        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
          {/* Background glow */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-blue-500/8 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Left: race info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] text-primary uppercase tracking-widest font-600">Next Race</span>
              </div>
              <h3 className="font-display font-700 text-white text-lg leading-snug truncate">
                {nextRace.race.賽事}
              </h3>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDateDisplay(nextRace.race.日期)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {parseFloat(String(nextRace.race["距離 (km)"] || "0")).toFixed(1)} km
                  {DIST_LABEL[String(nextRace.race["距離 (km)"]).trim()] && (
                    <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded ml-0.5">
                      {DIST_LABEL[String(nextRace.race["距離 (km)"]).trim()]}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: countdown tiles */}
            <div className="flex items-center gap-2 shrink-0">
              {countdown.past ? (
                <span className="text-emerald-400 text-sm font-display font-600">Race day is today! 🎉</span>
              ) : (
                <>
                  <CountdownUnit value={countdown.days}    label="Days" />
                  <CountdownSep />
                  <CountdownUnit value={countdown.hours}   label="Hrs" />
                  <CountdownSep />
                  <CountdownUnit value={countdown.minutes} label="Min" />
                  <CountdownSep />
                  <CountdownUnit value={countdown.seconds} label="Sec" live />
                </>
              )}
            </div>
          </div>

          {/* Upcoming races list (next 3 after the first) */}
          {races.filter((r) => {
            const d = parseDate(r.日期);
            return d && d >= new Date() && !r.完成 && r.賽事 !== nextRace.race.賽事;
          }).slice(0, 3).length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/8">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Also Coming Up</p>
              <div className="flex flex-wrap gap-2">
                {races
                  .filter((r) => {
                    const d = parseDate(r.日期);
                    return d && d >= new Date() && !r.完成 && r.賽事 !== nextRace.race.賽事;
                  })
                  .sort((a, b) => (parseDate(a.日期)?.getTime() || 0) - (parseDate(b.日期)?.getTime() || 0))
                  .slice(0, 3)
                  .map((r, i) => {
                    const d = parseDate(r.日期);
                    const daysAway = d ? Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
                    return (
                      <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/8">
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-white/80 truncate max-w-[160px]">{r.賽事}</span>
                        <span className="text-[10px] text-primary font-mono-metric shrink-0">{daysAway}d</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HR Zones ─────────────────────────────────────────── */}
      {hrZones && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-red-400" />
            <h2 className="font-display font-600 text-white text-sm">Current Heart Rate Zones (Karvonen)</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Based on Max HR: 202 bpm and latest Resting HR: {latestRestingHR} bpm
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {ZONE_CONFIG.map((z) => (
              <div key={z.key} className={cn("rounded-lg border p-3 text-center", z.bg)}>
                <p className="text-[10px] font-600 mb-1" style={{ color: z.color }}>{z.label}</p>
                <p className="font-mono-metric font-600 text-white text-sm">
                  {hrZones[z.key as keyof typeof hrZones]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Personal Bests ───────────────────────────────────── */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-amber-400" />
          <h2 className="font-display font-600 text-white text-sm">Personal Bests</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PB_DISTANCES.map((d) => {
            const pb = raceStats.bestTimes[d.key];
            const time  = pb ? secondsToHMS(pb.timeSec) : "--:--:--";
            const pace  = pb ? paceToString(pb.paceSec) : "-:--";
            const event = pb ? pb.race.賽事 : "No Record";
            const date  = pb ? formatDateDisplay(pb.race.日期) : "-";
            return (
              <div
                key={d.key}
                className="bg-slate-800/60 rounded-xl p-4 border border-white/5 relative overflow-hidden"
              >
                <span className="absolute top-2 left-2 text-[10px] font-700 bg-amber-500 text-black px-1.5 py-0.5 rounded font-display">
                  PB
                </span>
                <p className="text-xs text-muted-foreground mt-5 mb-1">{d.label}</p>
                <p className="font-mono-metric font-600 text-white text-lg leading-none">{time}</p>
                <p className="font-mono-metric text-xs text-muted-foreground mt-0.5">{pace} /km</p>
                <p className="text-xs text-slate-400 mt-2 truncate">{event}</p>
                <p className="text-[10px] text-muted-foreground">{date}</p>
                <Trophy className="absolute bottom-3 right-3 w-10 h-10 text-white/5" />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Activity Trend ───────────────────────────────────── */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="font-display font-600 text-white text-sm">Activity Trend (Last 12 Months)</h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono-metric">
            Total: {totalKm.toFixed(1)} km
          </span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="kmGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="month"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "#1e293b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#94a3b8" }}
              itemStyle={{ color: "#3b82f6" }}
            />
            <Area
              type="monotone"
              dataKey="km"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#kmGrad)"
              dot={{ fill: "#3b82f6", r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function StatCard({
  icon: Icon, iconBg, iconColor, value, label, sub, className,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  sub: string;
  className?: string;
}) {
  return (
    <div className={cn("glass-card rounded-xl p-4 flex items-center gap-4 animate-fade-up", className)}>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("w-6 h-6", iconColor)} />
      </div>
      <div>
        <p className="font-display font-700 text-2xl text-white leading-none">{value}</p>
        <p className="text-xs font-medium text-white/80 mt-0.5">{label}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function CountdownUnit({
  value, label, live,
}: {
  value: number;
  label: string;
  live?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center",
          "bg-slate-800/80 border border-white/10 backdrop-blur-sm",
          live && "border-primary/30 bg-primary/10"
        )}
      >
        <span className={cn(
          "font-display font-700 text-xl tabular-nums",
          live ? "text-primary" : "text-white"
        )}>
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function CountdownSep() {
  return (
    <span className="font-display font-700 text-white/30 text-xl pb-4 select-none">:</span>
  );
}
