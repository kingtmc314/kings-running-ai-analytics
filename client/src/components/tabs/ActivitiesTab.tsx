// =============================================================
// Activities Tab — King's Running AI Analytics
// Light Running Theme — clickable rows open full detail modal
// =============================================================
import { useMemo, useState } from "react";
import { Search, ChevronUp, ChevronDown, X, Footprints, Timer, Zap, Heart, Flame, Wind, Thermometer, Droplets, MapPin, StickyNote, Activity } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { parseDate, formatDateDisplay, secondsToHMS, paceToString, logToSeconds, getShoeName, getHRZone, RUN_TYPE_BADGE, RUN_TYPE_COLORS } from "@/lib/runningData";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type SortKey = "Date" | "Distance" | "Time" | "Pace" | "HR";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 30;

// ─── Activity Detail Modal ────────────────────────────────────

function ActivityDetailModal({ log, restingHR, onClose }: {
  log: Record<string, unknown> | null;
  restingHR: number;
  onClose: () => void;
}) {
  if (!log) return null;

  const dist = parseFloat(String(log["Distance (km)"] ?? "0")) || 0;
  const timeSec = (() => {
    const t = String(log["Time"] || log["Duration"] || "");
    if (!t) return 0;
    const parts = t.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  })();
  const paceSec = dist > 0 && timeSec > 0 ? (timeSec / 60) / dist * 60 : 0;
  const avgHR = parseFloat(String(log["Average Heart Rate"] ?? "0")) || 0;
  const maxHR = parseFloat(String(log["Maximum Heart Rate"] ?? "0")) || 0;
  const zone = getHRZone(avgHR, restingHR);
  const rt = String(log["Running Type"] || "");
  const rtColor = RUN_TYPE_COLORS[rt] || "#64748b";
  const shoe = String(log["Running Shoes"] || log["Running_Shoes"] || log["Shoes Name"] || log["Shoes"] || "—");
  const notes = String(log["Notes"] || "");
  const date = String(log["Date"] || "");

  const metrics: { icon: React.ElementType; label: string; value: string; color?: string }[] = [
    { icon: Footprints, label: "Distance", value: dist > 0 ? `${dist.toFixed(2)} km` : "—" },
    { icon: Timer, label: "Time", value: timeSec > 0 ? secondsToHMS(timeSec) : "—" },
    { icon: Zap, label: "Avg Pace", value: paceSec > 0 ? `${paceToString(paceSec)} /km` : "—" },
    { icon: Heart, label: "Avg HR", value: avgHR > 0 ? `${avgHR} bpm` : "—", color: zone.color },
    { icon: Heart, label: "Max HR", value: maxHR > 0 ? `${maxHR} bpm` : "—" },
    { icon: Activity, label: "HR Zone", value: zone.zone, color: zone.color },
    { icon: Zap, label: "Avg Cadence", value: String(log["Average Cadence"] || "—") },
    { icon: Zap, label: "Max Cadence", value: String(log["Max Cadence"] || "—") },
    { icon: Flame, label: "Calories", value: String(log["Calories"] || "—") },
    { icon: MapPin, label: "Elevation Gain", value: log["Elevation Gain"] ? `${log["Elevation Gain"]} m` : "—" },
    { icon: Thermometer, label: "Temperature", value: log["Temperature"] ? `${log["Temperature"]}°C` : "—" },
    { icon: Droplets, label: "Humidity", value: log["Humidity"] ? `${log["Humidity"]}%` : "—" },
    { icon: Wind, label: "Wind Speed", value: log["Wind Speed"] ? `${log["Wind Speed"]} km/h` : "—" },
    { icon: Zap, label: "Ground Contact", value: String(log["Ground Contact Time"] || "—") },
    { icon: Zap, label: "Stride Length", value: String(log["Stride Length"] || "—") },
    { icon: Zap, label: "Vertical Ratio", value: String(log["Vertical Ratio"] || "—") },
  ].filter((m) => m.value !== "—");

  return (
    <Dialog open={!!log} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-border">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                  style={{ background: rtColor }}
                >
                  {rt || "Run"}
                </span>
                <span className="text-xs text-muted-foreground">{formatDateDisplay(date)}</span>
              </div>
              <DialogTitle className="font-display text-xl text-foreground">
                {dist > 0 ? `${dist.toFixed(2)} km` : "Activity"} — {rt || "Run"}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Hero stats */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          {[
            { label: "Distance", value: dist > 0 ? `${dist.toFixed(2)}` : "—", unit: "km" },
            { label: "Time", value: timeSec > 0 ? secondsToHMS(timeSec) : "—", unit: "" },
            { label: "Avg Pace", value: paceSec > 0 ? paceToString(paceSec) : "—", unit: "/km" },
          ].map((s) => (
            <div key={s.label} className="bg-secondary rounded-xl p-3 text-center">
              <p className="font-mono-metric text-2xl font-bold text-foreground">{s.value}<span className="text-sm font-normal text-muted-foreground ml-1">{s.unit}</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* HR zone banner */}
        {avgHR > 0 && (
          <div className={cn("rounded-xl p-3 flex items-center gap-3 mt-1", zone.bg)}>
            <Heart className={cn("w-5 h-5 shrink-0", zone.color)} />
            <div>
              <p className={cn("font-semibold text-sm", zone.color)}>{zone.zone}</p>
              <p className="text-xs text-muted-foreground">Avg HR: {avgHR} bpm · Max HR: {maxHR || "—"} bpm</p>
            </div>
          </div>
        )}

        {/* Shoe */}
        {shoe !== "—" && (
          <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-2.5 mt-1">
            <Footprints className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm text-foreground font-medium">{shoe}</span>
          </div>
        )}

        {/* All metrics grid */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="bg-secondary rounded-lg px-3 py-2 flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground truncate">{m.label}</p>
                    <p className={cn("text-xs font-mono-metric font-semibold", m.color || "text-foreground")}>{m.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Notes */}
        {notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 mt-1">
            <StickyNote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">{notes}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function ActivitiesTab() {
  const { logs, latestRestingHR } = useData();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("Date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<Record<string, unknown> | null>(null);

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
            className="w-full bg-white border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
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
                  ? "bg-primary/15 border-primary/50 text-primary font-semibold"
                  : "bg-white border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
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
              <tr className="border-b border-border bg-secondary/60">
                <th className="text-left px-4 py-3 text-muted-foreground font-semibold cursor-pointer hover:text-foreground" onClick={() => handleSort("Date")}>
                  Date <SortIcon k="Date" />
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-semibold">Type</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold cursor-pointer hover:text-foreground" onClick={() => handleSort("Distance")}>
                  Dist <SortIcon k="Distance" />
                </th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold cursor-pointer hover:text-foreground" onClick={() => handleSort("Time")}>
                  Time <SortIcon k="Time" />
                </th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold cursor-pointer hover:text-foreground" onClick={() => handleSort("Pace")}>
                  Pace <SortIcon k="Pace" />
                </th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold cursor-pointer hover:text-foreground" onClick={() => handleSort("HR")}>
                  Avg HR <SortIcon k="HR" />
                </th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">Max HR</th>
                <th className="text-center px-4 py-3 text-muted-foreground font-semibold">Zone</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-semibold">Shoe</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">Cadence</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">Cal</th>
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
                const rtBadge = RUN_TYPE_BADGE[rt] || "bg-slate-100 text-slate-600 border-slate-200";
                return (
                  <tr
                    key={i}
                    className="border-b border-border hover:bg-primary/5 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLog(raw)}
                    title="Click to view full details"
                  >
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap group-hover:text-foreground transition-colors">{formatDateDisplay(l.Date)}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", rtBadge)}>
                        {rt || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-foreground font-semibold">{dist > 0 ? dist.toFixed(2) : "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-foreground">{timeSec > 0 ? secondsToHMS(timeSec) : "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-muted-foreground">{paceSec > 0 ? paceToString(paceSec) : "—"}</td>
                    <td className={cn("px-4 py-2.5 text-right font-mono-metric font-semibold", zone.color)}>{avgHR || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-muted-foreground">{String(raw["Maximum Heart Rate"] ?? "—")}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", zone.bg, zone.color)}>
                        {zone.zone}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground max-w-[100px] truncate">{getShoeName(l) || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-muted-foreground">{String(raw["Average Cadence"] ?? "—")}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-orange-500 font-semibold">{String(raw["Calories"] ?? "—")}</td>
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
            className="px-3 py-1.5 rounded-lg text-xs bg-white border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-40 transition-colors"
          >
            Prev
          </button>
          <span className="text-xs text-muted-foreground">Page {page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-xs bg-white border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        log={selectedLog}
        restingHR={latestRestingHR}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
