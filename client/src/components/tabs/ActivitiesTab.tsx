// Activities Tab — King's Running AI Analytics
// Light Running Theme — clickable rows open detail modal
// Edit (pencil) and Delete (trash) buttons per row
// =============================================================
import { useMemo, useState } from "react";
import {
  Search, ChevronUp, ChevronDown, Footprints, Timer, Zap, Heart,
  Flame, Wind, Thermometer, Droplets, MapPin, StickyNote, Activity,
  Pencil, Trash2, TrendingUp,
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

type SortKey = "Date" | "Distance" | "Time" | "Pace" | "HR" | "Cadence" | "StrideLength" | "VerticalOscillation" | "FormScore";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 30;

const RUN_TYPES = [
  "Easy", "Tempo", "Interval", "Long", "Race", "Recovery",
  "Fartlek", "Sprint", "Trail", "Time Trial", "Treadmill (Gym)",
];

const ACTIVITY_FIELDS: FieldDef[] = [
  { key: "Date", label: "Date", type: "date", required: true },
  { key: "Running Type", label: "Run Type", type: "select", options: RUN_TYPES, required: true },
  { key: "Running Shoes", label: "Shoe", type: "text" },
  { key: "Distance (km)", label: "Distance (km)", type: "number", placeholder: "e.g. 10.5" },
  { key: "Hour", label: "Hours", type: "number", placeholder: "0" },
  { key: "Minutes", label: "Minutes", type: "number", placeholder: "0" },
  { key: "Second", label: "Seconds", type: "number", placeholder: "0" },
  { key: "Average Pace", label: "Average Pace (min/km)", type: "number" },
  { key: "Best Pace", label: "Best Pace (min/km)", type: "number" },
  { key: "Average Heart Rate", label: "Avg HR (bpm)", type: "number" },
  { key: "Maximum Heart Rate", label: "Max HR (bpm)", type: "number" },
  { key: "Average Cadence", label: "Avg Cadence", type: "number" },
  { key: "Max Cadence", label: "Max Cadence", type: "number" },
  { key: "Avg Stride Length (m)", label: "Avg Stride Length (m)", type: "number" },
  { key: "Avg Vertical Ratio", label: "Avg Vertical Ratio", type: "number" },
  { key: "Vertical Oscillation (cm)", label: "Vertical Oscillation (cm)", type: "number" },
  { key: "Avg Ground Contact Time (ms)", label: "Avg Ground Contact Time (ms)", type: "number" },
  { key: "Calories", label: "Calories", type: "number" },
  { key: "Temperature", label: "Temperature (°C)", type: "number" },
  { key: "Humidity", label: "Humidity (%)", type: "number" },
  { key: "Wind Speed", label: "Wind Speed (km/h)", type: "number" },
  { key: "Apparent Temp", label: "Apparent Temp (°C)", type: "number" },
  { key: "Status", label: "Status", type: "text" },
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
  const apparentTemp = parseFloat(String(log["Apparent Temp"] ?? "")) || null;
  const hasWeather = temp !== null || humidity !== null || windSpeed !== null || apparentTemp !== null;

  // Weather condition summary
  const weatherSummary = (() => {
    if (!hasWeather) return null;
    const parts: string[] = [];
    if (temp !== null) {
      if (temp >= 32) parts.push("Extreme heat — high dehydration risk");
      else if (temp >= 28) parts.push("Hot & challenging conditions");
      else if (temp >= 22) parts.push("Warm — expect elevated HR");
      else if (temp >= 15) parts.push("Ideal running conditions");
      else if (temp >= 10) parts.push("Cool — dress in layers");
      else parts.push("Cold — watch for hypothermia risk");
    }
    if (windSpeed !== null && windSpeed > 15) parts.push("Strong wind — impacts pace");
    return parts.join(" • ");
  })();

  const weatherColor = (() => {
    if (!temp) return "border-slate-200 bg-slate-50";
    if (temp >= 28) return "border-red-200 bg-red-50";
    if (temp >= 22) return "border-orange-200 bg-orange-50";
    if (temp >= 15) return "border-green-200 bg-green-50";
    if (temp >= 10) return "border-blue-200 bg-blue-50";
    return "border-cyan-200 bg-cyan-50";
  })();

  // Metrics grid
  const metrics: { label: string; value: string; icon: React.ElementType; color?: string }[] = [];
  if (dist > 0) metrics.push({ label: "Distance", value: `${dist.toFixed(2)} km`, icon: MapPin });
  if (timeSec > 0) metrics.push({ label: "Time", value: secondsToHMS(timeSec), icon: Timer });
  if (paceSec > 0) metrics.push({ label: "Avg Pace", value: paceToString(paceSec), icon: Footprints });
  if (avgHR > 0) metrics.push({ label: "Avg HR", value: `${Math.round(avgHR)} bpm`, icon: Heart, color: zone?.color });
  if (maxHR > 0) metrics.push({ label: "Max HR", value: `${Math.round(maxHR)} bpm`, icon: Zap });
  if (zone) metrics.push({ label: "HR Zone", value: zone.zone, icon: Activity, color: zone.color });
  const avgCadence = parseFloat(String(log["Average Cadence"] ?? "0")) || 0;
  if (avgCadence > 0) metrics.push({ label: "Avg Cadence", value: `${Math.round(avgCadence)} spm`, icon: Footprints });
  const calories = parseFloat(String(log["Calories"] ?? "0")) || 0;
  if (calories > 0) metrics.push({ label: "Calories", value: `${Math.round(calories)}`, icon: Flame });

  return (
    <Dialog open={!!log} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 w-full">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">{formatDateDisplay(date)}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{rt}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={onEdit}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Shoe */}
        {shoe !== "—" && (
          <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-2.5 mt-1">
            <Footprints className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm text-foreground font-medium">{shoe}</span>
          </div>
        )}

        {/* Weather Conditions Panel */}
        {hasWeather && weatherColor && (
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
              {apparentTemp !== null && (
                <div className="text-center">
                  <p className="font-mono-metric text-2xl font-bold">{apparentTemp}°C</p>
                  <p className="text-sm opacity-70 mt-0.5">Feels Like</p>
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
        {metrics.length > 0 && metrics && (
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

        {/* Advanced Metrics */}
        {Boolean(log["Max Cadence"] || log["Avg Stride Length (m)"] || log["Avg Vertical Ratio"] || log["Vertical Oscillation (cm)"] || log["Avg Ground Contact Time (ms)"]) && (
          <div className="bg-slate-50 rounded-xl p-4 mt-4 border border-slate-200">
            <p className="text-sm font-semibold text-foreground mb-3">Advanced Metrics</p>
            <div className="grid grid-cols-2 gap-3">
              {Boolean(log["Max Cadence"]) && (
                <div>
                  <p className="text-xs text-muted-foreground">Max Cadence</p>
                  <p className="text-sm font-semibold">{String(log["Max Cadence"])} spm</p>
                </div>
              )}
              {Boolean(log["Avg Stride Length (m)"]) && (
                <div>
                  <p className="text-xs text-muted-foreground">Avg Stride Length</p>
                  <p className="text-sm font-semibold">{String(log["Avg Stride Length (m)"])} m</p>
                </div>
              )}
              {Boolean(log["Avg Vertical Ratio"]) && (
                <div>
                  <p className="text-xs text-muted-foreground">Avg Vertical Ratio</p>
                  <p className="text-sm font-semibold">{String(log["Avg Vertical Ratio"])}</p>
                </div>
              )}
              {Boolean(log["Vertical Oscillation (cm)"]) && (
                <div>
                  <p className="text-xs text-muted-foreground">Vertical Oscillation</p>
                  <p className="text-sm font-semibold">{String(log["Vertical Oscillation (cm)"])} cm</p>
                </div>
              )}
              {Boolean(log["Avg Ground Contact Time (ms)"]) && (
                <div>
                  <p className="text-xs text-muted-foreground">Avg Ground Contact Time</p>
                  <p className="text-sm font-semibold">{String(log["Avg Ground Contact Time (ms)"])} ms</p>
                </div>
              )}
              {Boolean(log["Best Pace"]) && (
                <div>
                  <p className="text-xs text-muted-foreground">Best Pace</p>
                  <p className="text-sm font-semibold">{paceToString(parseFloat(String(log["Best Pace"])) * 60)} min/km</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {notes && notes.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 mt-1">
            <StickyNote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">{notes}</p>
          </div>
        )}

        {/* Status */}
        {Boolean(log["Status"]) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-1">
            <p className="text-xs text-blue-600 font-medium">Status: {String(log["Status"])}</p>
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

  // Calculate running form score (0-100)
  const getFormScore = (log: RunLog): number => {
    const raw = log as unknown as Record<string, unknown>;
    const cadence = parseFloat(String(raw["Average Cadence"] ?? "0")) || 0;
    const strideLength = parseFloat(String(raw["Avg Stride Length (m)"] ?? "0")) || 0;
    const verticalRatio = parseFloat(String(raw["Avg Vertical Ratio"] ?? "0")) || 0;
    // Ideal ranges: cadence 170-180, stride 1.2-1.4m, vertical ratio 8-10%
    let score = 50;
    if (cadence >= 170 && cadence <= 180) score += 20; else if (cadence > 160 && cadence < 190) score += 10;
    if (strideLength >= 1.2 && strideLength <= 1.4) score += 20; else if (strideLength > 1.0 && strideLength < 1.6) score += 10;
    if (verticalRatio >= 8 && verticalRatio <= 10) score += 10; else if (verticalRatio > 6 && verticalRatio < 12) score += 5;
    return Math.min(100, score);
  };

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
      } else if (sortKey === "Cadence") {
        av = parseFloat(String(ra["Average Cadence"] ?? "0")) || 0;
        bv = parseFloat(String(rb["Average Cadence"] ?? "0")) || 0;
      } else if (sortKey === "StrideLength") {
        av = parseFloat(String(ra["Avg Stride Length (m)"] ?? "0")) || 0;
        bv = parseFloat(String(rb["Avg Stride Length (m)"] ?? "0")) || 0;
      } else if (sortKey === "VerticalOscillation") {
        av = parseFloat(String(ra["Vertical Oscillation (cm)"] ?? "0")) || 0;
        bv = parseFloat(String(rb["Vertical Oscillation (cm)"] ?? "0")) || 0;
      } else if (sortKey === "FormScore") {
        av = getFormScore(a);
        bv = getFormScore(b);
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

  const handleEdit = async (updatedData: Record<string, unknown>) => {
    if (!editLog || !("_row" in editLog)) return;
    setEditLoading(true);
    try {
      await updateRow("Running Log", editLog._row as number, updatedData);
      setLogs((prev) =>
        prev.map((log) =>
          log._row === editLog._row ? { ...log, ...updatedData } as RunLog : log
        )
      );
      setEditLog(null);
      toast.success("Activity updated successfully");
    } catch (err) {
      console.error("Edit error:", err);
      toast.error("Failed to update activity");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteLog || !("_row" in deleteLog)) return;
    setDeleteLoading(true);
    try {
      await deleteRow("Running Log", deleteLog._row as number);
      setLogs((prev) => prev.filter((log) => log._row !== deleteLog._row));
      setDeleteLog(null);
      setSelectedLog(null);
      toast.success("Activity deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete activity");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">Activities</h2>
        <button
          onClick={fetchFromGoogle}
          className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
        >
          Sync
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search activities..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {runTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Table Header (Desktop) */}
      <div className="hidden sm:grid grid-cols-7 gap-3 px-4 py-2 bg-secondary rounded-lg text-sm font-semibold text-muted-foreground">
        <button onClick={() => handleSort("Date")} className="flex items-center gap-1 hover:text-foreground">
          Date {sortKey === "Date" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
        </button>
        <button onClick={() => handleSort("Distance")} className="flex items-center gap-1 hover:text-foreground">
          Dist {sortKey === "Distance" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
        </button>
        <button onClick={() => handleSort("Time")} className="flex items-center gap-1 hover:text-foreground">
          Time {sortKey === "Time" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
        </button>
        <button onClick={() => handleSort("Pace")} className="flex items-center gap-1 hover:text-foreground">
          Pace {sortKey === "Pace" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
        </button>
        <button onClick={() => handleSort("HR")} className="flex items-center gap-1 hover:text-foreground">
          HR {sortKey === "HR" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
        </button>
        <button onClick={() => handleSort("Cadence")} className="flex items-center gap-1 hover:text-foreground">
          Cadence {sortKey === "Cadence" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
        </button>
        <button onClick={() => handleSort("FormScore")} className="flex items-center gap-1 hover:text-foreground">
          Form {sortKey === "FormScore" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-2">
        {paginated.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {logs.length === 0 ? "No activities yet" : "No activities match your filters"}
          </div>
        ) : (
          paginated.map((log) => {
            const raw = log as unknown as Record<string, unknown>;
            const date = formatDateDisplay(log.Date);
            const dist = parseFloat(String(raw["Distance (km)"] ?? "0")) || 0;
            const timeSec = logToSeconds(log);
            const time = secondsToHMS(timeSec);
            const pace = dist > 0 && timeSec > 0 ? paceToString((timeSec / 60) / dist * 60) : "—";
            const avgHR = parseFloat(String(raw["Average Heart Rate"] ?? "0")) || 0;
            const rt = String(raw["Running Type"] || "");
            const shoe = getShoeName(log);
            const cadence = parseFloat(String(raw["Average Cadence"] ?? "0")) || 0;
            const formScore = getFormScore(log);

            return (
              <div
                key={log._row}
                onClick={() => setSelectedLog(log)}
                className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <div className="hidden sm:grid grid-cols-7 gap-3 text-sm items-center">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", RUN_TYPE_BADGE[rt] || "bg-slate-500/20 text-slate-300 border-slate-500/30")}>{rt}</span>
                    <span className="truncate">{date}</span>
                  </div>
                  <div className="font-mono-metric font-semibold">{dist.toFixed(2)} km</div>
                  <div className="font-mono-metric font-semibold">{time}</div>
                  <div className="font-mono-metric font-semibold">{pace}</div>
                  <div className="font-mono-metric font-semibold">{avgHR > 0 ? `${Math.round(avgHR)} bpm` : "—"}</div>
                  <div className="font-mono-metric font-semibold">{cadence > 0 ? `${Math.round(cadence)}` : "—"}</div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span className="font-mono-metric font-semibold">{Math.round(formScore)}</span>
                  </div>
                </div>
                <div className="sm:hidden space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate">{date}</span>
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium border shrink-0", RUN_TYPE_BADGE[rt] || "bg-slate-500/20 text-slate-300 border-slate-500/30")}>{rt}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-xs text-muted-foreground">Distance</p><p className="font-mono-metric font-semibold">{dist.toFixed(2)} km</p></div>
                    <div><p className="text-xs text-muted-foreground">Time</p><p className="font-mono-metric font-semibold">{time}</p></div>
                    <div><p className="text-xs text-muted-foreground">Pace</p><p className="font-mono-metric font-semibold">{pace}</p></div>
                    <div><p className="text-xs text-muted-foreground">HR</p><p className="font-mono-metric font-semibold">{avgHR > 0 ? `${Math.round(avgHR)} bpm` : "—"}</p></div>
                  </div>
                  {shoe !== "—" && <p className="text-xs text-muted-foreground">Shoe: {shoe}</p>}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">Form Score</span>
                    <span className="flex items-center gap-1 font-mono-metric font-semibold">
                      <TrendingUp className="w-3 h-3 text-primary" />
                      {Math.round(formScore)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Prev
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      <ActivityDetailModal
        log={selectedLog}
        restingHR={latestRestingHR}
        onClose={() => setSelectedLog(null)}
        onEdit={() => { setEditLog(selectedLog); setSelectedLog(null); }}
        onDelete={() => { setDeleteLog(selectedLog); setSelectedLog(null); }}
      />

      {editLog && (
        <EditRecordModal
          open={!!editLog}
          title="Edit Activity"
          fields={ACTIVITY_FIELDS}
          initialValues={editLog}
          onSave={handleEdit}
          onClose={() => setEditLog(null)}
          loading={editLoading}
        />
      )}

      {deleteLog && (
        <DeleteConfirmDialog
          open={!!deleteLog}
          title="Delete Activity"
          description={`Are you sure you want to delete the activity on ${formatDateDisplay(String(deleteLog.Date || ""))}?`}
          onConfirm={handleDelete}
          onClose={() => setDeleteLog(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
