// =============================================================
// Log Data Tab — King's Running AI Analytics
// v1.1.0 — Supabase Integration
// Raw data viewer + Add Record forms for all six sheets
// =============================================================
import { useState } from "react";
import { RefreshCw, Database, Plus, X, Save, Loader2, Search } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { formatDateDisplay } from "@/lib/runningData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  SupabaseRunLog, SupabaseShoe, SupabaseRace,
  SupabaseBodyComposition, SupabaseSleepLog, SupabaseHeartRateLog,
} from "@/lib/supabase";

type Sheet = "running" | "shoes" | "races" | "body" | "sleep" | "hr";

// ─── FieldDef interface ───────────────────────────────────────
interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  hint?: string;
}

const SHEETS: { id: Sheet; label: string }[] = [
  { id: "running", label: "Running Log" },
  { id: "shoes",   label: "Shoes" },
  { id: "races",   label: "Races" },
  { id: "body",    label: "Body" },
  { id: "sleep",   label: "Sleep" },
  { id: "hr",      label: "Heart Rate" },
];

// ─── Field definitions — Supabase column names ────────────────
const RUNNING_FIELDS: FieldDef[] = [
  { key: "date", label: "Date", type: "date", required: true, hint: "Format: YYYY-MM-DD" },
  { key: "running_type", label: "Running Type", type: "select", required: true,
    options: ["Easy","Tempo","Interval","Long","Race","Recovery","Fartlek","Sprint","Trail","Time Trial","Treadmill (Gym)"], hint: "Select the run intensity/type" },
  { key: "distance_km", label: "Distance (km)", type: "number", required: true, placeholder: "e.g. 10.5", hint: "Total distance in kilometers" },
  { key: "hour", label: "Hours", type: "number", placeholder: "0", hint: "Hours of running time" },
  { key: "minutes", label: "Minutes", type: "number", placeholder: "0", hint: "Minutes (0-59)" },
  { key: "second", label: "Seconds", type: "number", placeholder: "0", hint: "Seconds (0-59)" },
  { key: "average_heart_rate", label: "Avg HR (bpm)", type: "number", placeholder: "e.g. 155", hint: "Average heart rate during run" },
  { key: "maximum_heart_rate", label: "Max HR (bpm)", type: "number", placeholder: "e.g. 175", hint: "Peak heart rate during run" },
  { key: "running_shoes", label: "Running Shoes", type: "text", placeholder: "Brand + Model name", hint: "Select from Shoe Locker" },
  { key: "calories", label: "Calories", type: "number", placeholder: "e.g. 650", hint: "Estimated calories burned" },
  { key: "average_cadence", label: "Avg Cadence (spm)", type: "number", placeholder: "e.g. 172", hint: "Steps per minute" },
  { key: "max_cadence", label: "Max Cadence (spm)", type: "number", placeholder: "e.g. 185", hint: "Maximum steps per minute" },
  { key: "avg_stride_length_m", label: "Avg Stride Length (m)", type: "number", placeholder: "e.g. 1.25", hint: "Average stride in meters" },
  { key: "avg_vertical_ratio", label: "Avg Vertical Ratio", type: "number", placeholder: "e.g. 8.5", hint: "Vertical oscillation ratio" },
  { key: "vertical_oscillation_cm", label: "Vertical Oscillation (cm)", type: "number", placeholder: "e.g. 9.2", hint: "Vertical bounce in centimeters" },
  { key: "avg_ground_contact_time_ms", label: "Ground Contact Time (ms)", type: "number", placeholder: "e.g. 220", hint: "Time foot contacts ground (milliseconds)" },
  { key: "average_pace", label: "Avg Pace (min/km)", type: "text", placeholder: "e.g. 5:30", hint: "Format: MM:SS" },
  { key: "best_pace", label: "Best Pace (min/km)", type: "text", placeholder: "e.g. 4:45", hint: "Format: MM:SS" },
  { key: "temperature", label: "Temperature (°C)", type: "number", placeholder: "e.g. 28", hint: "Ambient temperature" },
  { key: "apparent_temp", label: "Apparent Temp (°C)", type: "number", placeholder: "e.g. 32", hint: "Feels-like temperature" },
  { key: "humidity", label: "Humidity (%)", type: "number", placeholder: "e.g. 80", hint: "Relative humidity (0-100)" },
  { key: "wind_speed", label: "Wind Speed (km/h)", type: "number", placeholder: "e.g. 12", hint: "Wind speed in km/h" },
  { key: "status", label: "Status", type: "select", options: ["Completed", "Abandoned", "Paused"], hint: "Run completion status" },
  { key: "notes", label: "Notes", type: "text", placeholder: "Optional notes" },
];

const SHOES_FIELDS: FieldDef[] = [
  { key: "shoes_name", label: "Shoes Name (Brand + Model)", type: "text", required: true, placeholder: "e.g. Adidas Adizero Adios Pro 4 White" },
  { key: "brand", label: "Brand", type: "text", required: true, placeholder: "e.g. Adidas" },
  { key: "model", label: "Model", type: "text", placeholder: "e.g. Adizero Adios Pro 4" },
  { key: "status", label: "Status", type: "select", required: true, options: ["In Use", "Not Yet Opened", "Retired"] },
  { key: "purchase_date", label: "Purchase Date", type: "date" },
  { key: "retirement_date", label: "Retired Date", type: "date" },
  { key: "initial_km", label: "Initial KM", type: "number", placeholder: "e.g. 0", hint: "KM on shoes before tracking" },
  { key: "notes", label: "Notes", type: "text", placeholder: "Optional notes" },
];

const RACES_FIELDS: FieldDef[] = [
  { key: "race_name", label: "Race Name", type: "text", required: true, placeholder: "e.g. HK 10K 2026" },
  { key: "date", label: "Date", type: "date", required: true },
  { key: "distance_km", label: "Distance (km)", type: "number", required: true, placeholder: "e.g. 10" },
  { key: "location", label: "Location", type: "text", placeholder: "e.g. Hong Kong" },
  { key: "registration", label: "Registration", type: "text", placeholder: "e.g. Registered" },
  { key: "bib_no", label: "BIB No", type: "text", placeholder: "e.g. 12345" },
  { key: "finish_time", label: "Finish Time (HH:MM:SS)", type: "text", placeholder: "e.g. 00:55:30" },
  { key: "is_pb", label: "Is PB?", type: "select", options: ["false", "true"] },
  { key: "overall_place", label: "Overall Place", type: "number", placeholder: "e.g. 150" },
  { key: "gender_group_place", label: "Gender Group Place", type: "number", placeholder: "e.g. 80" },
  { key: "age_group_place", label: "Age Group Place", type: "number", placeholder: "e.g. 20" },
  { key: "running_shoes", label: "Running Shoes", type: "text", placeholder: "Brand + Model name" },
  { key: "notes", label: "Notes", type: "text", placeholder: "Optional notes" },
];

const BODY_FIELDS: FieldDef[] = [
  { key: "date", label: "Date", type: "date", required: true },
  { key: "weight", label: "Weight (kg)", type: "number", required: true, placeholder: "e.g. 72.5" },
  { key: "bmi", label: "BMI", type: "number", placeholder: "e.g. 22.4" },
  { key: "bodyFatPct", label: "Body Fat (%)", type: "number", placeholder: "e.g. 18.5" },
  { key: "fatMass", label: "Fat Mass (kg)", type: "number", placeholder: "e.g. 13.2" },
  { key: "muscleMass", label: "Muscle Mass (kg)", type: "number", placeholder: "e.g. 55.3" },
  { key: "bmr", label: "BMR (kcal)", type: "number", placeholder: "e.g. 1750" },
  { key: "visceralFat", label: "Visceral Fat", type: "number", placeholder: "e.g. 8" },
  { key: "notes", label: "Notes", type: "text", placeholder: "Optional notes" },
];

const SLEEP_FIELDS: FieldDef[] = [
  { key: "date", label: "Date", type: "date", required: true },
  { key: "score", label: "Sleep Score", type: "number", required: true, placeholder: "0–100" },
  { key: "resting_heart_rate", label: "Resting HR (bpm)", type: "number", placeholder: "e.g. 48" },
  { key: "body_battery_max", label: "Body Battery Max", type: "number", placeholder: "0–100" },
  { key: "body_battery_min", label: "Body Battery Min", type: "number", placeholder: "0–100" },
  { key: "stress_average", label: "Stress Average", type: "number", placeholder: "e.g. 25" },
  { key: "notes", label: "Notes", type: "text", placeholder: "Optional notes" },
];

const HR_FIELDS: FieldDef[] = [
  { key: "date", label: "Date", type: "date", required: true },
  { key: "resting_heart_rate", label: "Resting HR (bpm)", type: "number", required: true, placeholder: "e.g. 48" },
  { key: "max_heart_rate", label: "High HR (bpm)", type: "number", placeholder: "e.g. 185" },
  { key: "source", label: "Source", type: "text", placeholder: "e.g. Garmin" },
];

const SHEET_FIELDS: Record<Sheet, FieldDef[]> = {
  running: RUNNING_FIELDS,
  shoes: SHOES_FIELDS,
  races: RACES_FIELDS,
  body: BODY_FIELDS,
  sleep: SLEEP_FIELDS,
  hr: HR_FIELDS,
};

const SHEET_LABELS: Record<Sheet, string> = {
  running: "Running Log",
  shoes: "Running Shoes",
  races: "Race",
  body: "Body Composition",
  sleep: "Sleep Log",
  hr: "Heart Rate Log",
};

// ─── Add Record Modal ─────────────────────────────────────────
function AddRecordModal({
  sheet,
  onClose,
  onSaved,
}: {
  sheet: Sheet;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    shoes,
    addLog, addShoe, addRaceEntry, addBodyEntry, addSleepEntry, addHREntry,
  } = useData();
  const fields = SHEET_FIELDS[sheet];

  // Get non-retired shoes for Running Shoes dropdown
  const availableShoes = sheet === "running"
    ? shoes
        .filter((s) => String(s["Status"] ?? "") !== "Retired")
        .map((s) => String(s["Shoes Name"] ?? s["Shoes"] ?? ""))
        .filter(Boolean)
    : [];

  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.type === "date") init[f.key] = new Date().toISOString().split("T")[0];
      else if (f.type === "select" && f.options) init[f.key] = f.options[0];
      else init[f.key] = "";
    });
    return init;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const missing = fields.filter((f) => f.required && !form[f.key]?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    setSaving(true);
    try {
      // Build typed data object
      const data: Record<string, unknown> = {};
      fields.forEach((f) => {
        const val = form[f.key];
        if (val === "" || val === undefined) return;
        if (f.type === "number") {
          const num = parseFloat(val);
          if (!isNaN(num)) data[f.key] = num;
        } else if (f.key === "is_pb") {
          data[f.key] = val === "true";
        } else {
          data[f.key] = val;
        }
      });

      if (sheet === "running") {
        await addLog(data as Omit<SupabaseRunLog, "id" | "created_at" | "updated_at">);
      } else if (sheet === "shoes") {
        await addShoe(data as Omit<SupabaseShoe, "id" | "created_at" | "updated_at">);
      } else if (sheet === "races") {
        await addRaceEntry(data as Omit<SupabaseRace, "id" | "created_at" | "updated_at">);
      } else if (sheet === "body") {
        await addBodyEntry(data as Omit<SupabaseBodyComposition, "id" | "createdAt" | "updatedAt">);
      } else if (sheet === "sleep") {
        await addSleepEntry(data as Omit<SupabaseSleepLog, "id" | "createdAt" | "updatedAt">);
      } else if (sheet === "hr") {
        await addHREntry(data as Omit<SupabaseHeartRateLog, "id" | "createdAt" | "updatedAt">);
      }

      toast.success("Record saved to Supabase!");
      onSaved();
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      toast.error(`Failed to save: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            <h3 className="font-display font-700 text-slate-800 text-lg">
              Add {SHEET_LABELS[sheet]} Record
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  {f.label}
                  {f.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {f.key === "running_shoes" && sheet === "running" ? (
                  <select
                    value={form[f.key] || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  >
                    <option value="">Select a shoe...</option>
                    {availableShoes.map((shoe) => (
                      <option key={shoe} value={shoe}>{shoe}</option>
                    ))}
                  </select>
                ) : f.type === "select" && f.options ? (
                  <select
                    value={form[f.key] || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  >
                    {f.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    value={form[f.key] || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder ?? ""}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  />
                )}
                {f.hint && (
                  <p className="text-xs text-slate-500 mt-1">{f.hint}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Record"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function LogDataTab() {
  const { logs, shoes, races, bodyStats, sleeps, heartRates, syncStatus, refreshData } = useData();
  const [sheet, setSheet] = useState<Sheet>("running");
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filterRecords = (records: Record<string, unknown>[], query: string): Record<string, unknown>[] => {
    if (!query.trim()) return records;
    const q = query.toLowerCase();
    return records.filter((r) =>
      Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  };

  const filteredLogs = filterRecords(logs as unknown as Record<string, unknown>[], searchQuery);
  const filteredShoes = filterRecords(shoes as unknown as Record<string, unknown>[], searchQuery);
  const filteredRaces = filterRecords(races as unknown as Record<string, unknown>[], searchQuery);
  const filteredBody = filterRecords(bodyStats as unknown as Record<string, unknown>[], searchQuery);
  const filteredSleep = filterRecords(sleeps as unknown as Record<string, unknown>[], searchQuery);
  const filteredHR = filterRecords(heartRates as unknown as Record<string, unknown>[], searchQuery);

  const handleSaved = () => {
    setTimeout(() => refreshData(), 500);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="font-display font-600 text-slate-800 text-base">Data from Supabase</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
          <button
            onClick={() => refreshData()}
            disabled={syncStatus === "loading"}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors disabled:opacity-60"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", syncStatus === "loading" && "animate-spin")} />
            {syncStatus === "loading" ? "Syncing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Sheet tabs */}
      <div className="flex gap-2 flex-wrap">
        {SHEETS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSheet(s.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
              sheet === s.id
                ? "bg-primary/15 text-primary border-primary/40 font-semibold"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search records..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
        />
      </div>

      {/* Record count */}
      <div className="text-sm text-slate-500">
        {sheet === "running" && `${filteredLogs.length} of ${logs.length} records`}
        {sheet === "shoes" && `${filteredShoes.length} of ${shoes.length} records`}
        {sheet === "races" && `${filteredRaces.length} of ${races.length} records`}
        {sheet === "body" && `${filteredBody.length} of ${bodyStats.length} records`}
        {sheet === "sleep" && `${filteredSleep.length} of ${sleeps.length} records`}
        {sheet === "hr" && `${filteredHR.length} of ${heartRates.length} records`}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[60vh]">
          {sheet === "running" && <RunningTable logs={[...filteredLogs].reverse()} />}
          {sheet === "shoes" && <ShoesTable shoes={[...filteredShoes].reverse()} />}
          {sheet === "races" && <RacesTable races={[...filteredRaces].reverse()} />}
          {sheet === "body" && <BodyTable body={[...filteredBody].reverse()} />}
          {sheet === "sleep" && <SleepTable sleeps={[...filteredSleep].reverse()} />}
          {sheet === "hr" && <HRTable hrs={[...filteredHR].reverse()} />}
        </div>
      </div>

      {/* Add Record Modal */}
      {showAdd && (
        <AddRecordModal
          sheet={sheet}
          onClose={() => setShowAdd(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ─── Table Components ─────────────────────────────────────────

function RunningTable({ logs }: { logs: Record<string, unknown>[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-white z-10 shadow-sm">
        <tr className="border-b border-slate-200">
          {["Date", "Type", "Dist (km)", "H", "M", "S", "Avg HR", "Max HR", "Shoe", "Calories", "Avg Cadence", "Max Cadence", "Stride (m)", "V. Ratio", "V. Osc (cm)"].map((h) => (
            <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {logs.map((r, i) => (
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{formatDateDisplay(String(r["Date"] ?? ""))}</td>
            <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{String(r["Running Type"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-700">{String(r["Distance (km)"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Hour"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Minutes"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Second"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-700">{String(r["Average Heart Rate"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-700">{String(r["Maximum Heart Rate"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-600 whitespace-nowrap max-w-[120px] truncate">{String(r["Running Shoes"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Calories"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Average Cadence"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Max Cadence"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Avg Stride Length (m)"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Avg Vertical Ratio"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Vertical Oscillation (cm)"] ?? "")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ShoesTable({ shoes }: { shoes: Record<string, unknown>[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-white z-10 shadow-sm">
        <tr className="border-b border-slate-200">
          {["Shoes Name", "Brand", "Model", "Status", "Purchase Date", "Retired Date", "Initial KM"].map((h) => (
            <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {shoes.map((r, i) => (
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{String(r["Shoes Name"] ?? r["Shoes"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Shoes Brand"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Shoes Model"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-700">{String(r["Status"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{formatDateDisplay(String(r["Purchase Date"] ?? ""))}</td>
            <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{formatDateDisplay(String(r["Retired Date"] ?? ""))}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["initial_km"] ?? "")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RacesTable({ races }: { races: Record<string, unknown>[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-white z-10 shadow-sm">
        <tr className="border-b border-slate-200">
          {["Race Name", "Date", "Distance (km)", "Finish Time", "Overall Place", "Age Group Place"].map((h) => (
            <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {races.map((r, i) => (
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{String(r["賽事"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{formatDateDisplay(String(r["日期"] ?? ""))}</td>
            <td className="px-3 py-2 text-slate-700">{String(r["距離 (km)"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Finish Time"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Overall Place"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Age Group Place"] ?? "")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BodyTable({ body }: { body: Record<string, unknown>[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-white z-10 shadow-sm">
        <tr className="border-b border-slate-200">
          {["Date", "Weight (kg)", "BMI", "Body Fat (%)", "Fat Mass (kg)", "Muscle Mass (kg)", "BMR", "Visceral Fat"].map((h) => (
            <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map((r, i) => (
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{formatDateDisplay(String(r["Date"] ?? ""))}</td>
            <td className="px-3 py-2 text-slate-700">{String(r["Weight"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["BMI"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["BodyFat"] ?? r["Body Fat"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["FatMass"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["MuscleMass"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["BMR"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["VisceralFat"] ?? "")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SleepTable({ sleeps }: { sleeps: Record<string, unknown>[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-white z-10 shadow-sm">
        <tr className="border-b border-slate-200">
          {["Date", "Score", "Resting HR", "Body Battery Max", "Body Battery Min", "Stress Avg"].map((h) => (
            <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sleeps.map((r, i) => (
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{formatDateDisplay(String(r["Date"] ?? ""))}</td>
            <td className="px-3 py-2 text-slate-700">{String(r["Score"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Resting Heart Rate"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Body Battery"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["body_battery_min"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["stress_average"] ?? "")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HRTable({ hrs }: { hrs: Record<string, unknown>[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-white z-10 shadow-sm">
        <tr className="border-b border-slate-200">
          {["Date", "Resting HR (bpm)", "High HR (bpm)", "Source"].map((h) => (
            <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {hrs.map((r, i) => (
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{formatDateDisplay(String(r["Date"] ?? ""))}</td>
            <td className="px-3 py-2 text-slate-700">{String(r["Resting"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["High"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["source"] ?? "")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
