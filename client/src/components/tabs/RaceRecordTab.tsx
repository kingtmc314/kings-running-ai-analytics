// =============================================================
// Race Record Tab — King's Running AI Analytics
// Design: Dark glassmorphism, sortable card grid with column-sort chips
// =============================================================
import { useMemo, useState } from "react";
import {
  Trophy, Calendar, MapPin, Clock, TrendingUp, ChevronUp, ChevronDown,
  ChevronsUpDown, Footprints, Heart, Star,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import {
  parseDate, secondsToHMS, paceToString, formatDateDisplay, getShoeName,
} from "@/lib/runningData";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────

const DIST_LABEL: Record<string, string> = {
  "5": "5K", "5.0": "5K",
  "10": "10K", "10.0": "10K",
  "21.0975": "HM", "21.1": "HM", "21": "HM",
  "42.195": "FM", "42.2": "FM", "42": "FM",
};

type SortKey = "date" | "dist" | "time" | "pace" | "hr" | "overall" | "ag";
type SortDir = "asc" | "desc";

const SORT_COLUMNS: { key: SortKey; label: string; icon: React.ElementType }[] = [
  { key: "date",    label: "Date",      icon: Calendar },
  { key: "dist",    label: "Distance",  icon: MapPin },
  { key: "time",    label: "Time",      icon: Clock },
  { key: "pace",    label: "Pace",      icon: TrendingUp },
  { key: "hr",      label: "Avg HR",    icon: Heart },
  { key: "overall", label: "Overall",   icon: Trophy },
  { key: "ag",      label: "Age Group", icon: Star },
];

// ─── Component ────────────────────────────────────────────────

export default function RaceRecordTab() {
  const { processedRacesList, raceStats } = useData();
  const [filter, setFilter] = useState<"all" | "completed" | "upcoming">("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const now = new Date();

  // Toggle sort: same key → flip dir; new key → desc
  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = useMemo(() => {
    return processedRacesList.filter((r) => {
      const d = parseDate(r.日期);
      if (filter === "completed") return r.完成 || (d && d < now);
      if (filter === "upcoming")  return !r.完成 && (!d || d >= now);
      return true;
    });
  }, [processedRacesList, filter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = 0, bv = 0;
      if (sortKey === "date") {
        av = parseDate(a.日期)?.getTime() || 0;
        bv = parseDate(b.日期)?.getTime() || 0;
      } else if (sortKey === "dist") {
        av = parseFloat(String(a["距離 (km)"] || "0")) || 0;
        bv = parseFloat(String(b["距離 (km)"] || "0")) || 0;
      } else if (sortKey === "time") {
        av = a.timeSec; bv = b.timeSec;
      } else if (sortKey === "pace") {
        av = a.paceSec; bv = b.paceSec;
      } else if (sortKey === "hr") {
        av = parseFloat(String((a.logData as Record<string, unknown>)?.["Average Heart Rate"] ?? "0")) || 0;
        bv = parseFloat(String((b.logData as Record<string, unknown>)?.["Average Heart Rate"] ?? "0")) || 0;
      } else if (sortKey === "overall") {
        av = parseInt(String(a["Overall Place"] || "9999")) || 9999;
        bv = parseInt(String(b["Overall Place"] || "9999")) || 9999;
      } else if (sortKey === "ag") {
        av = parseInt(String(a["Age Group Place"] || "9999")) || 9999;
        bv = parseInt(String(b["Age Group Place"] || "9999")) || 9999;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [filtered, sortKey, sortDir]);

  const upcomingCount = processedRacesList.filter((r) => {
    const d = parseDate(r.日期);
    return !r.完成 && (!d || d >= now);
  }).length;

  return (
    <div className="space-y-5">
      {/* ── Summary stat cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard value={raceStats.totalRaces} label="Total Races" color="text-white" />
        <StatCard value={Object.keys(raceStats.bestTimes).length} label="Personal Bests" color="text-amber-400" />
        <StatCard value={upcomingCount} label="Upcoming" color="text-emerald-400" />
        <StatCard
          value={processedRacesList.filter((r) => r.完成).length}
          label="Completed"
          color="text-blue-400"
        />
      </div>

      {/* ── Controls row: filter + sort chips ──────────────── */}
      <div className="glass-card rounded-xl p-3 flex flex-wrap items-center gap-3">
        {/* Filter */}
        <div className="flex gap-1.5 shrink-0">
          {(["all", "completed", "upcoming"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                filter === f
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/20"
              )}
            >
              {f === "all" ? "All" : f === "completed" ? "Completed" : "Upcoming"}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-white/10 hidden sm:block" />

        {/* Sort chips */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mr-1">Sort:</span>
          {SORT_COLUMNS.map(({ key, label, icon: Icon }) => {
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
          {sorted.length} race{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Race cards grid ─────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground text-sm">
          No races found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((race, i) => {
            const d = parseDate(race.日期);
            const isUpcoming = !race.完成 && (!d || d >= now);
            const isPB = Object.values(raceStats.bestTimes).some(
              (pb) => pb.race.賽事 === race.賽事 && pb.race.日期 === race.日期
            );
            const distLabel = DIST_LABEL[String(race["距離 (km)"]).trim()];
            const distKm = parseFloat(String(race["距離 (km)"] || "0")) || 0;
            const shoe = getShoeName(race.logData);
            const avgHR = parseFloat(
              String((race.logData as Record<string, unknown>)?.["Average Heart Rate"] ?? "0")
            ) || 0;
            const overallPlace = String(race["Overall Place"] || "");
            const agPlace = String(race["Age Group Place"] || "");

            return (
              <div
                key={i}
                className={cn(
                  "glass-card rounded-xl border transition-all hover:border-white/20 hover:-translate-y-0.5 overflow-hidden",
                  isUpcoming
                    ? "border-blue-500/20 opacity-80"
                    : isPB
                    ? "border-amber-500/25"
                    : "border-white/8"
                )}
              >
                {/* Card header band */}
                <div
                  className={cn(
                    "px-4 py-2.5 flex items-center justify-between gap-2",
                    isUpcoming
                      ? "bg-blue-500/10"
                      : isPB
                      ? "bg-amber-500/10"
                      : "bg-white/4"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isPB && (
                      <span className="text-[9px] font-700 bg-amber-500 text-black px-1.5 py-0.5 rounded font-display shrink-0">
                        PB
                      </span>
                    )}
                    <span className="text-white font-display font-600 text-sm truncate">
                      {race.賽事}
                    </span>
                  </div>
                  <StatusBadge isUpcoming={isUpcoming} completed={!!race.完成} />
                </div>

                {/* Card body */}
                <div className="px-4 py-3 space-y-3">
                  {/* Date + distance row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {formatDateDisplay(race.日期)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-metric text-white text-sm font-600">
                        {distKm > 0 ? `${distKm} km` : "—"}
                      </span>
                      {distLabel && (
                        <span className="text-[9px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded">
                          {distLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time + Pace */}
                  <div className="grid grid-cols-2 gap-2">
                    <MetricCell
                      icon={Clock}
                      label="Time"
                      value={race.timeSec > 0 ? secondsToHMS(race.timeSec) : "—"}
                      color="text-white"
                    />
                    <MetricCell
                      icon={TrendingUp}
                      label="Pace"
                      value={race.paceSec > 0 ? paceToString(race.paceSec) : "—"}
                      color="text-muted-foreground"
                    />
                  </div>

                  {/* HR + Shoe */}
                  <div className="grid grid-cols-2 gap-2">
                    <MetricCell
                      icon={Heart}
                      label="Avg HR"
                      value={avgHR > 0 ? `${avgHR} bpm` : "—"}
                      color="text-red-400"
                    />
                    <MetricCell
                      icon={Footprints}
                      label="Shoe"
                      value={shoe || "—"}
                      color="text-muted-foreground"
                      truncate
                    />
                  </div>

                  {/* Placement row */}
                  {(overallPlace || agPlace) && (
                    <div className="flex items-center gap-3 pt-2 border-t border-white/8">
                      {overallPlace && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-muted-foreground">Overall:</span>
                          <span className="font-mono-metric text-white">{overallPlace}</span>
                        </div>
                      )}
                      {agPlace && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Star className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-muted-foreground">AG:</span>
                          <span className="font-mono-metric text-white">{agPlace}</span>
                        </div>
                      )}
                    </div>
                  )}
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

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="glass-card rounded-xl p-4 text-center">
      <p className={cn("font-display font-700 text-2xl", color)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function StatusBadge({ isUpcoming, completed }: { isUpcoming: boolean; completed: boolean }) {
  if (isUpcoming)
    return (
      <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full shrink-0">
        Upcoming
      </span>
    );
  if (completed)
    return (
      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
        Finished
      </span>
    );
  return (
    <span className="text-[10px] bg-slate-500/20 text-slate-300 border border-slate-500/30 px-2 py-0.5 rounded-full shrink-0">
      —
    </span>
  );
}

function MetricCell({
  icon: Icon,
  label,
  value,
  color,
  truncate,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  truncate?: boolean;
}) {
  return (
    <div className="bg-white/4 rounded-lg px-2.5 py-2">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("font-mono-metric text-xs font-600", color, truncate && "truncate")}>{value}</p>
    </div>
  );
}
