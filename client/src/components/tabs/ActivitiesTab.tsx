// =============================================================
// Activities Tab — King's Running AI Analytics
// Light Running Theme — clickable rows open detail modal
// Edit (pencil) and Delete (trash) buttons per row
// =============================================================
import { useMemo, useState } from "react";
import {
  Search, ChevronUp, ChevronDown, Footprints, Timer, Zap, Heart,
  Flame, Wind, Thermometer, Droplets, MapPin, StickyNote, Activity,
  Pencil, Trash2,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import {
  parseDate, formatDateDisplay, secondsToHMS, paceToString,
  logToSeconds, getShoeName, getHRZone, RUN_TYPE_BADGE, RUN_TYPE_COLORS,
  RunLog,
} from "@/lib/runningData";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import EditRecordModal, { FieldDef } from "@/components/EditRecordModal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { updateRow, deleteRow } from "@/lib/sheetsApi";

type SortKey = "Date" | "Distance" | "Time" | "Pace" | "HR";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 30;

const RUN_TYPES = [
  "Easy", "Tempo", "Interval", "Long", "Race", "Recovery",
  "Fartlek", "Sprint", "Trail", "Time Trial", "Theadmill (Gym)",
];

const ACTIVITY_FIELDS: FieldDef[] = [
  { key: "Date", label: "Date", type: "date", required: true },
  { key: "Distance (km)", label: "Distance (km)", type: "number", placeholder: "e.g. 10.5" },
  { key: "Hour", label: "Hours", type: "number", placeholder: "0" },
  { key: "Minutes", label: "Minutes", type: "number", placeholder: "0" },
  { key: "Second", label: "Seconds", type: "number", placeholder: "0" },
  { key: "Running Type", label: "Run Type", type: "select", options: RUN_TYPES },
  { key: "Average Heart Rate", label: "Avg HR (bpm)", type: "number" },
  { key: "Maximum Heart Rate", label: "Max HR (bpm)", type: "number" },
  { key: "Running Shoes", label: "Shoe", type: "text" },
  { key: "Average Cadence", label: "Avg Cadence", type: "number" },
  { key: "Max Cadence", label: "Max Cadence", type: "number" },
  { key: "Avg Stride Length (m)", label: "Avg Stride Length (m)", type: "number" },
  { key: "Avg Vertical Ratio", label: "Avg Vertical Ratio", type: "number" },
  { key: "Vertical Oscillation (cm)", label: "Vertical Oscillation (cm)", type: "number" },
  { key: "Calories", label: "Calories", type: "number" },
  { key: "Temperature", label: "Temperature (°C)", type: "number" },
  { key: "Humidity", label: "Humidity (%)", type: "number" },
  { key: "Wind Speed", label: "Wind Speed (km/h)", type: "number" },
  { key: "Notes", label: "Notes", type: "textarea" },
];

// ─── Activity Detail Modal ────────────────────────────────────

function ActivityDetailModal({
  log, restingHR, onClose, onEdit, onDelete,
}: {
  log: Record<string, unknown> | null;
  restingHR: number;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!log) return null;

  const dist = parseFloat(String(log["Distance (km)"] ?? "0")) || 0;
  const timeSec = (() => {
    const h = parseInt(String(log["Hour"] ?? "0")) || 0;
    const m = parseInt(String(log["Minutes"] ?? "0")) || 0;
    const s = parseFloat(String(log["Second"] ?? "0")) || 0;
    return h * 3600 + m * 60 + s;
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

  // Weather data
  const temp = parseFloat(String(log["Temperature"] ?? "")) || null;
  const humidity = parseFloat(String(log["Humidity"] ?? "")) || null;
  const windSpeed = parseFloat(String(log["Wind Speed"] ?? "")) || null;
  const hasWeather = temp !== null || humidity !== null || windSpeed !== null;

  // Weather condition summary
  const weatherSummary = (() => {
    if (!hasWeather) return null;
    const parts: string[] = [];
    if (temp !== null) {
      if (temp >= 32) parts.push("Extreme heat — high dehydration risk");
      else if (temp >= 28) parts.push("Hot & challenging conditions");
      else if (temp >= 22) parts.push("Warm — expect elevated HR");
      else if (temp >= 15) parts.push("Ideal running temperature");
      else if (temp >= 8) parts.push("Cool — good for performance");
      else parts.push("Cold — warm-up thoroughly");
    }
    if (humidity !== null) {
      if (humidity >= 85) parts.push("very high humidity (sweat cooling impaired)");
      else if (humidity >= 70) parts.push("high humidity");
      else if (humidity >= 50) parts.push("moderate humidity");
      else parts.push("low humidity");
    }
    if (windSpeed !== null) {
      if (windSpeed >= 30) parts.push("strong headwind/tailwind effect");
      else if (windSpeed >= 15) parts.push("moderate wind");
      else if (windSpeed >= 5) parts.push("light breeze");
    }
    return parts.join(" · ");
  })();

  // Weather severity colour
  const weatherColor = (() => {
    if (temp === null) return "bg-sky-50 border-sky-200 text-sky-800";
    if (temp >= 32 || (temp >= 28 && (humidity ?? 0) >= 80)) return "bg-red-50 border-red-200 text-red-800";
    if (temp >= 28 || (humidity ?? 0) >= 75) return "bg-orange-50 border-orange-200 text-orange-800";
    if (temp >= 22) return "bg-amber-50 border-amber-200 text-amber-800";
    return "bg-sky-50 border-sky-200 text-sky-800";
  })();

  const metrics: { icon: React.ElementType; label: string; value: string; color?: string }[] = [
    { icon: Footprints, label: "Distance", value: dist > 0 ? `${dist.toFixed(2)} km` : "—" },
    { icon: Timer, label: "Time", value: timeSec > 0 ? secondsToHMS(timeSec) : "—" },
    { icon: Zap, label: "Avg Pace", value: paceSec > 0 ? `${paceToString(paceSec)} min/km` : "—" },
    { icon: Heart, label: "Avg HR", value: avgHR > 0 ? `${avgHR} bpm` : "—", color: zone.color },
    { icon: Heart, label: "Max HR", value: maxHR > 0 ? `${maxHR} bpm` : "—" },
    { icon: Activity, label: "HR Zone", value: zone.zone, color: zone.color },
    { icon: Zap, label: "Avg Cadence", value: log["Average Cadence"] ? `${log["Average Cadence"]} spm` : "—" },
    { icon: Flame, label: "Calories", value: log["Calories"] ? `${log["Calories"]} kcal` : "—" },
    { icon: MapPin, label: "Elevation Gain", value: log["Elevation Gain"] ? `${log["Elevation Gain"]} m` : "—" },
  ].filter((m) => m.value !== "—");

  return (
    <Dialog open={!!log} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-border">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: rtColor }}>
                  {rt || "Run"}
                </span>
                <span className="text-sm text-muted-foreground">{formatDateDisplay(date)}</span>
              </div>
              <DialogTitle className="font-display text-2xl text-foreground">
                {dist > 0 ? `${dist.toFixed(2)} km` : "Activity"} — {rt || "Run"}
              </DialogTitle>
            </div>
            {/* Edit / Delete action buttons */}
            <div className="flex gap-1 shrink-0 mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                title="Edit this activity"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                title="Delete this activity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
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
              <p className="font-mono-metric text-3xl font-bold text-foreground">
                {s.value}<span className="text-sm font-normal text-muted-foreground ml-1">{s.unit}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* HR zone banner */}
        {avgHR > 0 && (
          <div className={cn("rounded-xl p-3 flex items-center gap-3 mt-1", zone.bg)}>
            <Heart className={cn("w-5 h-5 shrink-0", zone.color)} />
            <div>
              <p className={cn("font-semibold text-sm", zone.color)}>{zone.zone}</p>
              <p className="text-sm text-muted-foreground">Avg HR: {avgHR} bpm · Max HR: {maxHR || "—"} bpm</p>
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

        {/* Weather Conditions Panel */}
        {hasWeather && (
          <div className={cn("rounded-xl border p-4 mt-1", weatherColor)}>
            <div className="flex items-center gap-2 mb-3">
              <Thermometer className="w-4 h-4 shrink-0" />
              <p className="text-base font-semibold uppercase tracking-wide">Weather Conditions</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-2">
              {temp !== null && (
                <div className="text-center">
                  <p className="font-mono-metric text-2xl font-bold">{temp}°C</p>
                  <p className="text-sm opacity-70 mt-0.5">Temperature</p>
                </div>
              )}
              {humidity !== null && (
                <div className="text-center">
                  <p className="font-mono-metric text-2xl font-bold">{humidity}%</p>
                  <p className="text-sm opacity-70 mt-0.5">Humidity</p>
                </div>
              )}
              {windSpeed !== null && (
                <div className="text-center">
                  <p className="font-mono-metric text-2xl font-bold">{windSpeed}</p>
                  <p className="text-sm opacity-70 mt-0.5">Wind km/h</p>
                </div>
              )}
            </div>
            {weatherSummary && (
              <p className="text-sm opacity-80 leading-relaxed border-t border-current/10 pt-2">{weatherSummary}</p>
            )}
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
                    <p className="text-sm text-muted-foreground truncate">{m.label}</p>
                    <p className={cn("text-sm font-mono-metric font-semibold", m.color || "text-foreground")}>{m.value}</p>
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
  const { logs, setLogs, latestRestingHR, fetchFromGoogle } = useData();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("Date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<Record<string, unknown> | null>(null);

  // Edit modal
  const [editLog, setEditLog] = useState<Record<string, unknown> | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Delete dialog
  const [deleteLog, setDeleteLog] = useState<Record<string, unknown> | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const runTypes = useMemo(() => [
    "All",
    ...Array.from(new Set(logs.map((l) => String((l as unknown as Record<string, unknown>)["Running Type"] || "")).filter(Boolean))),
  ], [logs]);

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
      let av = 0, bv = 0;
      const ra = a as unknown as Record<string, unknown>;
      const rb = b as unknown as Record<string, unknown>;
      if (sortKey === "Date") {
        av = parseDate(a.Date)?.getTime() || 0;
        bv = parseDate(b.Date)?.getTime() || 0;
      } else if (sortKey === "Distance") {
        av = parseFloat(String(ra["Distance (km)"] ?? "0")) || 0;
        bv = parseFloat(String(rb["Distance (km)"] ?? "0")) || 0;
      } else if (sortKey === "Time") {
        av = logToSeconds(a); bv = logToSeconds(b);
      } else if (sortKey === "Pace") {
        const dA = parseFloat(String(ra["Distance (km)"] ?? "0")) || 0;
        const dB = parseFloat(String(rb["Distance (km)"] ?? "0")) || 0;
        av = dA > 0 ? logToSeconds(a) / dA : 0;
        bv = dB > 0 ? logToSeconds(b) / dB : 0;
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
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />) : null;

  // ── Edit handler ──
  async function handleEditSave(data: Record<string, string>) {
    if (!editLog) return;
    const row = editLog["_row"] as number;
    setEditLoading(true);
    const result = await updateRow("Running Log", row, data);
    setEditLoading(false);
    if (result.success) {
      // Optimistic update in local state
      setLogs((prev) => prev.map((l) => {
        if ((l as unknown as Record<string, unknown>)["_row"] === row) {
          return { ...l, ...data } as unknown as RunLog;
        }
        return l;
      }));
      toast.success("Activity updated successfully");
      setEditLog(null);
      setSelectedLog(null);
      // Refresh from Google Sheets in background
      fetchFromGoogle();
    } else {
      toast.error(`Failed to update: ${result.error || "Unknown error"}`);
    }
  }

  // ── Delete handler ──
  async function handleDeleteConfirm() {
    if (!deleteLog) return;
    const row = deleteLog["_row"] as number;
    setDeleteLoading(true);
    const result = await deleteRow("Running Log", row);
    setDeleteLoading(false);
    if (result.success) {
      setLogs((prev) => prev.filter((l) => (l as unknown as Record<string, unknown>)["_row"] !== row));
      toast.success("Activity deleted");
      setDeleteLog(null);
      setSelectedLog(null);
      fetchFromGoogle();
    } else {
      toast.error(`Failed to delete: ${result.error || "Unknown error"}`);
    }
  }

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
            className="w-full bg-white border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {runTypes.map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1); }}
              className={cn(
                "text-sm px-2 py-1 rounded-md border transition-all",
                typeFilter === t
                  ? "bg-primary/15 border-primary/50 text-primary font-semibold"
                  : "bg-white border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground ml-auto">{sorted.length} activities</span>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
                <th className="text-center px-4 py-3 text-muted-foreground font-semibold">Actions</th>
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
                      <span className={cn("text-sm px-1.5 py-0.5 rounded border font-medium", rtBadge)}>
                        {rt || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-foreground font-semibold">{dist > 0 ? dist.toFixed(2) : "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-foreground">{timeSec > 0 ? secondsToHMS(timeSec) : "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-muted-foreground">{paceSec > 0 ? paceToString(paceSec) : "—"}</td>
                    <td className={cn("px-4 py-2.5 text-right font-mono-metric font-semibold", zone.color)}>{avgHR || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-muted-foreground">{String(raw["Maximum Heart Rate"] ?? "—")}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={cn("text-sm px-1.5 py-0.5 rounded-full font-medium", zone.bg, zone.color)}>
                        {zone.zone}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground max-w-[100px] truncate">{getShoeName(l) || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-muted-foreground">{String(raw["Average Cadence"] ?? "—")}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-orange-500 font-semibold">{String(raw["Calories"] ?? "—")}</td>
                    {/* Action buttons — stop propagation so row click doesn't fire */}
                    <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditLog(raw)}
                          className="p-1 rounded hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setDeleteLog(raw)}
                          className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
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
            className="px-3 py-1.5 rounded-lg text-sm bg-white border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-40 transition-colors"
          >
            Prev
          </button>
          <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm bg-white border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-40 transition-colors"
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
        onEdit={() => { setEditLog(selectedLog); setSelectedLog(null); }}
        onDelete={() => { setDeleteLog(selectedLog); setSelectedLog(null); }}
      />

      {/* Edit Modal */}
      <EditRecordModal
        open={!!editLog}
        onClose={() => setEditLog(null)}
        onSave={handleEditSave}
        loading={editLoading}
        title="Edit Activity"
        fields={ACTIVITY_FIELDS}
        initialValues={editLog || {}}
      />

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={!!deleteLog}
        onClose={() => setDeleteLog(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Delete Activity"
        recordLabel={deleteLog ? `${formatDateDisplay(String(deleteLog["Date"] || ""))} — ${String(deleteLog["Running Type"] || "Run")} ${String(deleteLog["Distance (km)"] || "")} km` : undefined}
      />
    </div>
  );
}
