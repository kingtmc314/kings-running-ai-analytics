// =============================================================
// Activities Tab — King's Running AI Analytics
// =============================================================
import { useMemo, useState } from "react";
import { Search, ChevronUp, ChevronDown } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { parseDate, formatDateDisplay, secondsToHMS, paceToString, logToSeconds, getShoeName, getHRZone, RUN_TYPE_BADGE } from "@/lib/runningData";
import { cn } from "@/lib/utils";

type SortKey = "Date" | "Distance" | "Time" | "Pace" | "HR";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 30;

export default function ActivitiesTab() {
  const { logs, latestRestingHR } = useData();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("Date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const runTypes = useMemo(() => ["All", ...Array.from(new Set(logs.map((l) => String((l as unknown as Record<string, unknown>)["Running Type"] || "")).filter(Boolean)))], [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const raw = l as unknown as Record<string, unknown>;
      const rt = String(raw["Running Type"] || "");
      if (typeFilter !== "All" && rt !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (l.Date || "").toLowerCase().includes(q) ||
          rt.toLowerCase().includes(q) ||
          getShoeName(l).toLowerCase().includes(q) ||
          String(raw["Notes"] || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, typeFilter, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: number = 0, bv: number = 0;
      const ra = a as unknown as Record<string, unknown>;
      const rb = b as unknown as Record<string, unknown>;
      if (sortKey === "Date") {
        av = parseDate(a.Date)?.getTime() || 0;
        bv = parseDate(b.Date)?.getTime() || 0;
      } else if (sortKey === "Distance") {
        av = parseFloat(String(ra["Distance (km)"] ?? "0")) || 0;
        bv = parseFloat(String(rb["Distance (km)"] ?? "0")) || 0;
      } else if (sortKey === "Time") {
        av = logToSeconds(a);
        bv = logToSeconds(b);
      } else if (sortKey === "Pace") {
        const distA = parseFloat(String(ra["Distance (km)"] ?? "0")) || 0;
        const distB = parseFloat(String(rb["Distance (km)"] ?? "0")) || 0;
        av = distA > 0 ? logToSeconds(a) / distA : 0;
        bv = distB > 0 ? logToSeconds(b) / distB : 0;
      } else if (sortKey === "HR") {
        av = parseFloat(String(ra["Average Heart Rate"] ?? "0")) || 0;
        bv = parseFloat(String(rb["Average Heart Rate"] ?? "0")) || 0;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [filtered, sortKey, sortDir]);

  const paginated = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />) : null;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search activities…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {runTypes.map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1); }}
              className={cn(
                "text-[10px] px-2 py-1 rounded-md border transition-all",
                typeFilter === t
                  ? "bg-primary/20 border-primary/50 text-primary"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{sorted.length} activities</span>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/8 bg-white/3">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium cursor-pointer hover:text-white" onClick={() => handleSort("Date")}>
                  Date <SortIcon k="Date" />
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Type</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium cursor-pointer hover:text-white" onClick={() => handleSort("Distance")}>
                  Dist <SortIcon k="Distance" />
                </th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium cursor-pointer hover:text-white" onClick={() => handleSort("Time")}>
                  Time <SortIcon k="Time" />
                </th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium cursor-pointer hover:text-white" onClick={() => handleSort("Pace")}>
                  Pace <SortIcon k="Pace" />
                </th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium cursor-pointer hover:text-white" onClick={() => handleSort("HR")}>
                  Avg HR <SortIcon k="HR" />
                </th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Max HR</th>
                <th className="text-center px-4 py-3 text-muted-foreground font-medium">Zone</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Shoe</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Cadence</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Calories</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((l, i) => {
                    const raw = l as unknown as Record<string, unknown>;
                    const dist = parseFloat(String(raw["Distance (km)"] ?? "0")) || 0;
                    const timeSec = logToSeconds(l);
                    const paceSec = dist > 0 && timeSec > 0 ? (timeSec / 60) / dist * 60 : 0;
                    const avgHR = parseFloat(String(raw["Average Heart Rate"] ?? "0")) || 0;
                const zone = getHRZone(avgHR, latestRestingHR);
                const rt = String(raw["Running Type"] || "");
                const rtBadge = RUN_TYPE_BADGE[rt] || "bg-slate-500/20 text-slate-300 border-slate-500/30";
                return (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{formatDateDisplay(l.Date)}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", rtBadge)}>
                        {rt || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-white">{dist > 0 ? dist.toFixed(2) : "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-white">{timeSec > 0 ? secondsToHMS(timeSec) : "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-muted-foreground">{paceSec > 0 ? paceToString(paceSec) : "—"}</td>
                    <td className={cn("px-4 py-2.5 text-right font-mono-metric", zone.color)}>{avgHR || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-muted-foreground">{String(raw["Maximum Heart Rate"] ?? "—")}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", zone.bg, zone.color)}>
                        {zone.zone}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground max-w-[100px] truncate">{getShoeName(l) || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-muted-foreground">{String(raw["Average Cadence"] ?? "—")}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-amber-400">{String(raw["Calories"] ?? "—")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {paginated.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No activities found.</div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-muted-foreground hover:text-white disabled:opacity-40 transition-colors"
          >
            Prev
          </button>
          <span className="text-xs text-muted-foreground">Page {page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-muted-foreground hover:text-white disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
