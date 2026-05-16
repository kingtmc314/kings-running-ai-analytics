// =============================================================
// Race Record Tab — King's Running AI Analytics
// =============================================================
import { useMemo, useState } from "react";
import { Trophy, Medal, Calendar, MapPin, Clock, TrendingUp } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { parseDate, secondsToHMS, paceToString, formatDateDisplay, getShoeName } from "@/lib/runningData";
import { cn } from "@/lib/utils";

const DIST_KEYS: Record<string, string> = {
  "5": "5K", "5.0": "5K",
  "10": "10K", "10.0": "10K",
  "21.0975": "HM", "21.1": "HM", "21": "HM",
  "42.195": "FM", "42.2": "FM", "42": "FM",
};

export default function RaceRecordTab() {
  const { processedRacesList, raceStats } = useData();
  const [filter, setFilter] = useState<"all" | "completed" | "upcoming">("all");

  const now = new Date();

  const filtered = useMemo(() => {
    return processedRacesList.filter((r) => {
      const d = parseDate(r.日期);
      if (filter === "completed") return r.完成 || (d && d < now);
      if (filter === "upcoming") return !r.完成 && (!d || d >= now);
      return true;
    });
  }, [processedRacesList, filter, now]);

  const sortedRaces = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const da = parseDate(a.日期)?.getTime() || 0;
      const db = parseDate(b.日期)?.getTime() || 0;
      return db - da;
    });
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display font-700 text-2xl text-white">{raceStats.totalRaces}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Races</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display font-700 text-2xl text-amber-400">{Object.keys(raceStats.bestTimes).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Personal Bests</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display font-700 text-2xl text-emerald-400">
            {processedRacesList.filter((r) => {
              const d = parseDate(r.日期);
              return d && d >= now;
            }).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Upcoming</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "completed", "upcoming"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              filter === f
                ? "bg-primary/20 text-primary border border-primary/40"
                : "bg-white/5 text-muted-foreground border border-white/10 hover:border-white/20"
            )}
          >
            {f === "all" ? "All Races" : f === "completed" ? "Completed" : "Upcoming"}
          </button>
        ))}
      </div>

      {/* Race table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Race</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Dist</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Time</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Pace</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Avg HR</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Shoe</th>
                <th className="text-center px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Overall</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">AG</th>
              </tr>
            </thead>
            <tbody>
              {sortedRaces.map((race, i) => {
                const d = parseDate(race.日期);
                const isUpcoming = !race.完成 && (!d || d >= now);
                const isPB = Object.values(raceStats.bestTimes).some((pb) => pb.race.賽事 === race.賽事 && pb.race.日期 === race.日期);
                const distKey = DIST_KEYS[String(race["距離 (km)"]).trim()];
                const shoe = getShoeName(race.logData);
                return (
                  <tr
                    key={i}
                    className={cn(
                      "border-b border-white/5 transition-colors hover:bg-white/3",
                      isUpcoming && "opacity-70"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isPB && (
                          <span className="text-[9px] font-700 bg-amber-500 text-black px-1 py-0.5 rounded font-display shrink-0">PB</span>
                        )}
                        <span className="text-white font-medium">{race.賽事}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateDisplay(race.日期)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono-metric text-white">{race["距離 (km)"]} km</span>
                      {distKey && (
                        <span className="ml-1 text-[9px] text-muted-foreground">({distKey})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-metric text-white">
                      {race.timeSec > 0 ? secondsToHMS(race.timeSec) : (isUpcoming ? "—" : "—")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-metric text-muted-foreground">
                      {race.paceSec > 0 ? paceToString(race.paceSec) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono-metric text-red-400">
                      {race.logData["Average Heart Rate"] || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[120px] truncate">{shoe || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {isUpcoming ? (
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">Upcoming</span>
                      ) : race.完成 ? (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">Finished</span>
                      ) : (
                        <span className="text-[10px] bg-slate-500/20 text-slate-300 border border-slate-500/30 px-2 py-0.5 rounded-full">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{race["Overall Place"] || "—"}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{race["Age Group Place"] || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sortedRaces.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No races found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
