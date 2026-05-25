// Activities Tab — Table View
// Comprehensive table with Date, Type, Dist, Time, Pace, Avg HR, Max HR, Zone, Shoe, Cadence, Calories, Actions
// =============================================================
import { useMemo, useState } from "react";
import {
  Search, ChevronUp, ChevronDown, Pencil, Trash2,
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

type SortKey = "Date" | "Distance" | "Time" | "Pace" | "HR" | "MaxHR" | "Cadence" | "Calories";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 50;

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
      const searchLower = search.toLowerCase();
      const date = String(raw["Date"] || "");
      const shoe = String(raw["Running Shoes"] || "");
      return date.toLowerCase().includes(searchLower) || rt.toLowerCase().includes(searchLower) || shoe.toLowerCase().includes(searchLower);
    });
  }, [logs, search, typeFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const ra = a as unknown as Record<string, unknown>;
      const rb = b as unknown as Record<string, unknown>;
      let av = 0, bv = 0;

      if (sortKey === "Date") {
        const da = parseDate(String(ra["Date"] || ""));
        const db = parseDate(String(rb["Date"] || ""));
        av = da ? da.getTime() : 0;
        bv = db ? db.getTime() : 0;
      } else if (sortKey === "Distance") {
        av = parseFloat(String(ra["Distance (km)"] ?? "0")) || 0;
        bv = parseFloat(String(rb["Distance (km)"] ?? "0")) || 0;
      } else if (sortKey === "Time") {
        av = logToSeconds(a);
        bv = logToSeconds(b);
      } else if (sortKey === "Pace") {
        const dA = parseFloat(String(ra["Distance (km)"] ?? "0")) || 0;
        const dB = parseFloat(String(rb["Distance (km)"] ?? "0")) || 0;
        av = dA > 0 ? logToSeconds(a) / dA : 0;
        bv = dB > 0 ? logToSeconds(b) / dB : 0;
      } else if (sortKey === "HR") {
        av = parseFloat(String(ra["Average Heart Rate"] ?? "0")) || 0;
        bv = parseFloat(String(rb["Average Heart Rate"] ?? "0")) || 0;
      } else if (sortKey === "MaxHR") {
        av = parseFloat(String(ra["Maximum Heart Rate"] ?? "0")) || 0;
        bv = parseFloat(String(rb["Maximum Heart Rate"] ?? "0")) || 0;
      } else if (sortKey === "Cadence") {
        av = parseFloat(String(ra["Average Cadence"] ?? "0")) || 0;
        bv = parseFloat(String(rb["Average Cadence"] ?? "0")) || 0;
      } else if (sortKey === "Calories") {
        av = parseFloat(String(ra["Calories"] ?? "0")) || 0;
        bv = parseFloat(String(rb["Calories"] ?? "0")) || 0;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [filtered, sortKey, sortDir]);

  const paginated = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  // ── Edit handler ──
  async function handleEditSave(data: Record<string, string>) {
    if (!editLog) return;
    const row = editLog["_row"] as number;
    setEditLoading(true);
    const result = await updateRow("Running Log", row, data);
    setEditLoading(false);
    if (result.success) {
      setLogs((prev) => prev.map((l) => {
        if ((l as unknown as Record<string, unknown>)["_row"] === row) {
          return { ...l, ...data } as unknown as RunLog;
        }
        return l;
      }));
      toast.success("Activity updated");
      setEditLog(null);
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
      fetchFromGoogle();
    } else {
      toast.error(`Failed to delete: ${result.error || "Unknown error"}`);
    }
  }

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

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                <button onClick={() => handleSort("Date")} className="flex items-center gap-1 hover:text-foreground">
                  Date {sortKey === "Date" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
              </th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Type</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                <button onClick={() => handleSort("Distance")} className="flex items-center gap-1 hover:text-foreground">
                  Dist {sortKey === "Distance" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
              </th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                <button onClick={() => handleSort("Time")} className="flex items-center gap-1 hover:text-foreground">
                  Time {sortKey === "Time" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
              </th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                <button onClick={() => handleSort("Pace")} className="flex items-center gap-1 hover:text-foreground">
                  Pace {sortKey === "Pace" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
              </th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                <button onClick={() => handleSort("HR")} className="flex items-center gap-1 hover:text-foreground">
                  Avg HR {sortKey === "HR" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
              </th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                <button onClick={() => handleSort("MaxHR")} className="flex items-center gap-1 hover:text-foreground">
                  Max HR {sortKey === "MaxHR" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
              </th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Zone</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Shoe</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                <button onClick={() => handleSort("Cadence")} className="flex items-center gap-1 hover:text-foreground">
                  Cadence {sortKey === "Cadence" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
              </th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                <button onClick={() => handleSort("Calories")} className="flex items-center gap-1 hover:text-foreground">
                  Cal {sortKey === "Calories" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
              </th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-muted-foreground">
                  {logs.length === 0 ? "No activities yet" : "No activities match your filters"}
                </td>
              </tr>
            ) : (
              paginated.map((log) => {
                const raw = log as unknown as Record<string, unknown>;
                const date = formatDateDisplay(String(raw["Date"] || ""));
                const dist = parseFloat(String(raw["Distance (km)"] ?? "0")) || 0;
                const timeSec = logToSeconds(log);
                const time = secondsToHMS(timeSec);
                const pace = dist > 0 && timeSec > 0 ? paceToString((timeSec / 60) / dist * 60) : "—";
                const avgHR = parseFloat(String(raw["Average Heart Rate"] ?? "0")) || 0;
                const maxHR = parseFloat(String(raw["Maximum Heart Rate"] ?? "0")) || 0;
                const zone = getHRZone(avgHR, latestRestingHR);
                const rt = String(raw["Running Type"] || "");
                const shoe = getShoeName(log);
                const cadence = parseFloat(String(raw["Average Cadence"] ?? "0")) || 0;
                const calories = parseFloat(String(raw["Calories"] ?? "0")) || 0;

                return (
                  <tr key={log._row} className="hover:bg-accent/50 transition-colors">
                    <td className="px-3 py-2 text-sm text-foreground">{date}</td>
                    <td className="px-3 py-2">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", RUN_TYPE_BADGE[rt] || "bg-slate-500/20 text-slate-300 border-slate-500/30")}>
                        {rt}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm font-mono-metric font-semibold">{dist.toFixed(2)}</td>
                    <td className="px-3 py-2 text-sm font-mono-metric font-semibold">{time}</td>
                    <td className="px-3 py-2 text-sm font-mono-metric font-semibold">{pace}</td>
                    <td className="px-3 py-2 text-sm font-mono-metric font-semibold text-blue-600">{avgHR > 0 ? Math.round(avgHR) : "—"}</td>
                    <td className="px-3 py-2 text-sm font-mono-metric font-semibold text-red-600">{maxHR > 0 ? Math.round(maxHR) : "—"}</td>
                    <td className="px-3 py-2 text-sm font-semibold">{zone.zone}</td>
                    <td className="px-3 py-2 text-sm text-muted-foreground truncate">{shoe}</td>
                    <td className="px-3 py-2 text-sm font-mono-metric font-semibold">{cadence > 0 ? Math.round(cadence) : "—"}</td>
                    <td className="px-3 py-2 text-sm font-mono-metric font-semibold text-orange-600">{calories > 0 ? Math.round(calories) : "—"}</td>
                    <td className="px-3 py-2 flex items-center gap-1">
                      <button
                        onClick={() => setEditLog(raw)}
                        className="p-1 rounded hover:bg-blue-100 text-blue-500 hover:text-blue-700 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteLog(raw)}
                        className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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

      {/* Edit Modal */}
      {editLog && (
        <EditRecordModal
          open={true}
          title="Edit Activity"
          fields={ACTIVITY_FIELDS}
          initialValues={editLog}
          onSave={handleEditSave}
          onClose={() => setEditLog(null)}
          loading={editLoading}
        />
      )}

      {/* Delete Dialog */}
      {deleteLog && (
        <DeleteConfirmDialog
          open={true}
          title="Delete Activity"
          description="Are you sure you want to delete this activity?"
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteLog(null)}
          loading={deleteLoading}
        />
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Activity Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold">{formatDateDisplay(String(selectedLog["Date"] || ""))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-semibold">{String(selectedLog["Running Type"] || "")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="font-mono-metric font-semibold">{parseFloat(String(selectedLog["Distance (km)"] ?? "0")).toFixed(2)} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-mono-metric font-semibold">{secondsToHMS(logToSeconds(selectedLog as RunLog))}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
