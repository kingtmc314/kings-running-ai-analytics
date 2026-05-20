// =============================================================
// Log Data Tab — King's Running AI Analytics
// Raw data viewer + Add Record forms for all six sheets
// Field keys MUST match exact Google Sheet column names from API
// =============================================================
import { useState } from "react";
import { RefreshCw, Database, Plus, X, Save, Loader2, Search } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { formatDateDisplay } from "@/lib/runningData";
import { addRow } from "@/lib/sheetsApi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

// ─── Field definitions — EXACT Google Sheet column names ──────
// Running Log: Date, Running Type, Running Shoes, Distance (km), Hour, Minutes, Second, Average Pace, Best Pace, Average Heart Rate, Maximum Heart Rate, Average Cadence, Max Cadence, Avg Stride Length (m), Avg Vertical Ratio, Vertical Oscillation (cm), Avg Ground Contact Time (ms), Calories, Temperature, Humidity, Wind Speed, Apparent Temp, Status
const RUNNING_FIELDS: FieldDef[] = [
  { key: "Date", label: "Date", type: "date", required: true, hint: "Format: YYYY-MM-DD" },
  { key: "Running Type", label: "Running Type", type: "select", required: true,
    options: ["Easy","Tempo","Interval","Long","Race","Recovery","Fartlek","Sprint","Trail","Time Trial","Treadmill (Gym)"], hint: "Select the run intensity/type" },
  { key: "Distance (km)", label: "Distance (km)", type: "number", required: true, placeholder: "e.g. 10.5", hint: "Total distance in kilometers" },
  { key: "Hour", label: "Hours", type: "number", placeholder: "0", hint: "Hours of running time" },
  { key: "Minutes", label: "Minutes", type: "number", placeholder: "0", hint: "Minutes (0-59)" },
  { key: "Second", label: "Seconds", type: "number", placeholder: "0", hint: "Seconds (0-59)" },
  { key: "Average Heart Rate", label: "Avg HR (bpm)", type: "number", placeholder: "e.g. 155", hint: "Average heart rate during run" },
  { key: "Maximum Heart Rate", label: "Max HR (bpm)", type: "number", placeholder: "e.g. 175", hint: "Peak heart rate during run" },
  { key: "Running Shoes", label: "Running Shoes", type: "text", placeholder: "Brand + Model name", hint: "Select from Shoe Locker" },
  { key: "Calories", label: "Calories", type: "number", placeholder: "e.g. 650", hint: "Estimated calories burned" },
  { key: "Average Cadence", label: "Avg Cadence (spm)", type: "number", placeholder: "e.g. 172", hint: "Steps per minute" },
  { key: "Max Cadence", label: "Max Cadence (spm)", type: "number", placeholder: "e.g. 185", hint: "Maximum steps per minute" },
  { key: "Avg Stride Length (m)", label: "Avg Stride Length (m)", type: "number", placeholder: "e.g. 1.25", hint: "Average stride in meters" },
  { key: "Avg Vertical Ratio", label: "Avg Vertical Ratio", type: "number", placeholder: "e.g. 8.5", hint: "Vertical oscillation ratio" },
  { key: "Vertical Oscillation (cm)", label: "Vertical Oscillation (cm)", type: "number", placeholder: "e.g. 9.2", hint: "Vertical bounce in centimeters" },
  { key: "Avg Ground Contact Time (ms)", label: "Ground Contact Time (ms)", type: "number", placeholder: "e.g. 220", hint: "Time foot contacts ground (milliseconds)" },
  { key: "Average Pace", label: "Avg Pace (min/km)", type: "text", placeholder: "e.g. 5:30", hint: "Format: MM:SS" },
  { key: "Best Pace", label: "Best Pace (min/km)", type: "text", placeholder: "e.g. 4:45", hint: "Format: MM:SS" },
  { key: "Temperature", label: "Temperature (°C)", type: "number", placeholder: "e.g. 28", hint: "Ambient temperature" },
  { key: "Apparent Temp", label: "Apparent Temp (°C)", type: "number", placeholder: "e.g. 32", hint: "Feels-like temperature" },
  { key: "Humidity", label: "Humidity (%)", type: "number", placeholder: "e.g. 80", hint: "Relative humidity (0-100)" },
  { key: "Wind Speed", label: "Wind Speed (km/h)", type: "number", placeholder: "e.g. 12", hint: "Wind speed in km/h" },
  { key: "Status", label: "Status", type: "select", options: ["Completed", "Abandoned", "Paused"], hint: "Run completion status" },
];

// Shoes: Shoes, Shoes Brand, Shoes Price, Purchase Date, First Use, Retired Date, ItemPhoto, Shoes Name, Status, TOTAL, COST
const SHOES_FIELDS: FieldDef[] = [
  { key: "Shoes", label: "Shoes Name (Brand + Model)", type: "text", required: true, placeholder: "e.g. Adidas Adizero Adios Pro 4 White" },
  { key: "Shoes Brand", label: "Brand", type: "text", required: true, placeholder: "e.g. Adidas" },
  { key: "Status", label: "Status", type: "select", required: true, options: ["In Use", "Not Yet Opened", "Retired"] },
  { key: "Shoes Price", label: "Price (HKD)", type: "number", placeholder: "e.g. 1800" },
  { key: "Purchase Date", label: "Purchase Date", type: "date" },
  { key: "First Use", label: "First Use Date", type: "date" },
  { key: "Retired Date", label: "Retired Date", type: "date" },
  { key: "ItemPhoto", label: "Photo URL", type: "text", placeholder: "https://..." },
];

// Race: 賽事, 日期, 距離 (km), Reg, BIB No, 完成, PB?, Overall Place, Gender Group Place, Age Group Place
const RACES_FIELDS: FieldDef[] = [
  { key: "賽事", label: "Race Name", type: "text", required: true, placeholder: "e.g. HK 10K 2026" },
  { key: "日期", label: "Date", type: "date", required: true },
  { key: "距離 (km)", label: "Distance (km)", type: "number", required: true, placeholder: "e.g. 10" },
  { key: "完成", label: "Completed?", type: "select", options: ["true", "false"] },
  { key: "Reg", label: "Registration", type: "text", placeholder: "e.g. Registered" },
  { key: "BIB No", label: "BIB Number", type: "text", placeholder: "e.g. 12345" },
  { key: "PB?", label: "Personal Best?", type: "select", options: ["true", "false"] },
  { key: "Overall Place", label: "Overall Place", type: "text", placeholder: "e.g. 45" },
  { key: "Gender Group Place", label: "Gender Group Place", type: "text", placeholder: "e.g. 8" },
  { key: "Age Group Place", label: "Age Group Place", type: "text", placeholder: "e.g. 12" },
];

// Body: Date, Height, Weight, BMI, BodyFat, FatMass, FFM, MuscleMass, SMM, Protein, BoneMass, BodyWater, BodyWaterPercent, BMR, VisceralFat
const BODY_FIELDS: FieldDef[] = [
  { key: "Date", label: "Date", type: "date", required: true },
  { key: "Weight", label: "Weight (kg)", type: "number", required: true, placeholder: "e.g. 72.5" },
  { key: "Height", label: "Height (cm)", type: "number", placeholder: "e.g. 180" },
  { key: "BMI", label: "BMI", type: "number", placeholder: "e.g. 22.4" },
  { key: "BodyFat", label: "Body Fat (%)", type: "number", placeholder: "e.g. 18.5" },
  { key: "FatMass", label: "Fat Mass (kg)", type: "number", placeholder: "e.g. 13.2" },
  { key: "MuscleMass", label: "Muscle Mass (kg)", type: "number", placeholder: "e.g. 55.3" },
  { key: "BMR", label: "BMR (kcal)", type: "number", placeholder: "e.g. 1750" },
  { key: "VisceralFat", label: "Visceral Fat", type: "number", placeholder: "e.g. 8" },
  { key: "FFM", label: "FFM (kg)", type: "number", placeholder: "e.g. 60" },
  { key: "SMM", label: "SMM (kg)", type: "number", placeholder: "e.g. 30" },
  { key: "Protein", label: "Protein (kg)", type: "number", placeholder: "e.g. 12" },
  { key: "BoneMass", label: "Bone Mass (kg)", type: "number", placeholder: "e.g. 3.5" },
  { key: "BodyWater", label: "Body Water (kg)", type: "number", placeholder: "e.g. 42" },
  { key: "BodyWaterPercent", label: "Body Water (%)", type: "number", placeholder: "e.g. 60" },
];

// Sleep: Date, Score, Resting Heart Rate, Body Battery, Pulse Ox, Respiration, Skin Temp Change, HRV Status, Quality, Duration, Sleep Need, Bedtime, Wake Time
const SLEEP_FIELDS: FieldDef[] = [
  { key: "Date", label: "Date", type: "date", required: true },
  { key: "Score", label: "Sleep Score", type: "number", required: true, placeholder: "0–100" },
  { key: "Resting Heart Rate", label: "Resting HR (bpm)", type: "number", placeholder: "e.g. 48" },
  { key: "Body Battery", label: "Body Battery", type: "number", placeholder: "0–100" },
  { key: "Pulse Ox", label: "Pulse Ox (%)", type: "text", placeholder: "e.g. 97" },
  { key: "Respiration", label: "Respiration (brpm)", type: "number", placeholder: "e.g. 14" },
  { key: "Skin Temp Change", label: "Skin Temp Change (°C)", type: "number", placeholder: "e.g. 0.5" },
  { key: "HRV Status", label: "HRV Status", type: "select", options: ["Balanced", "Low", "High"] },
  { key: "Quality", label: "Quality", type: "select", options: ["Excellent","Good","Fair","Poor"] },
  { key: "Duration", label: "Duration (hours)", type: "number", placeholder: "e.g. 7.5" },
  { key: "Sleep Need", label: "Sleep Need (hours)", type: "number", placeholder: "e.g. 8" },
  { key: "Bedtime", label: "Bedtime (HH:MM)", type: "text", placeholder: "e.g. 23:00" },
  { key: "Wake Time", label: "Wake Time (HH:MM)", type: "text", placeholder: "e.g. 06:30" },
];

// Heart Rate: Date, Resting, High
const HR_FIELDS: FieldDef[] = [
  { key: "Date", label: "Date", type: "date", required: true },
  { key: "Resting", label: "Resting HR (bpm)", type: "number", required: true, placeholder: "e.g. 48" },
  { key: "High", label: "High HR (bpm)", type: "number", placeholder: "e.g. 185" },
];

const SHEET_FIELDS: Record<Sheet, FieldDef[]> = {
  running: RUNNING_FIELDS,
  shoes: SHOES_FIELDS,
  races: RACES_FIELDS,
  body: BODY_FIELDS,
  sleep: SLEEP_FIELDS,
  hr: HR_FIELDS,
};

const SHEET_NAMES: Record<Sheet, string> = {
  running: "Running Log",
  shoes: "Running Shoes",
  races: "Race",
  body: "Body",
  sleep: "Sleep",
  hr: "Heart Rate",
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
  const { shoes } = useData();
  const fields = SHEET_FIELDS[sheet];
  
  // Get non-retired shoes for Running Shoes dropdown (only for running sheet)
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
    // Validate required fields
    const missing = fields.filter((f) => f.required && !form[f.key]?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    setSaving(true);
    const data: Record<string, unknown> = {};
    fields.forEach((f) => {
      if (form[f.key] !== "") {
        // Convert number fields to numbers
        if (f.type === "number") {
          const num = parseFloat(form[f.key]);
          data[f.key] = isNaN(num) ? form[f.key] : num;
        } else {
          data[f.key] = form[f.key];
        }
      }
    });
    const result = await addRow(SHEET_NAMES[sheet], data);
    setSaving(false);
    if (result.success) {
      toast.success("Record added successfully! Syncing data…");
      onSaved();
      onClose();
    } else {
      toast.error(`Failed to add record: ${result.error || "Unknown error"}`);
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
              Add {SHEET_NAMES[sheet]} Record
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
              <div key={f.key} className={cn("flex flex-col gap-1.5")}>
                <label className="text-sm font-medium text-slate-700">
                  {f.label}
                  {f.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {f.key === "Running Shoes" && sheet === "running" ? (
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
  const { logs, shoes, races, bodyStats, sleeps, heartRates, syncStatus, fetchFromGoogle } = useData();
  const [sheet, setSheet] = useState<Sheet>("running");
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter records based on search query
  const filterRecords = (records: Record<string, unknown>[], query: string): Record<string, unknown>[] => {
    if (!query.trim()) return records;
    const q = query.toLowerCase();
    return records.filter((r) =>
      Object.values(r).some((v) =>
        String(v ?? "").toLowerCase().includes(q)
      )
    );
  };
  
  const filteredLogs = filterRecords(logs, searchQuery);
  const filteredShoes = filterRecords(shoes, searchQuery);
  const filteredRaces = filterRecords(races, searchQuery);
  const filteredBody = filterRecords(bodyStats, searchQuery);
  const filteredSleep = filterRecords(sleeps, searchQuery);
  const filteredHR = filterRecords(heartRates, searchQuery);

  const handleSaved = () => {
    setTimeout(() => fetchFromGoogle(), 800);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="font-display font-600 text-slate-800 text-base">Raw Data from Google Sheets</h2>
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
            onClick={() => fetchFromGoogle()}
            disabled={syncStatus === "loading"}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors disabled:opacity-60"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", syncStatus === "loading" && "animate-spin")} />
            {syncStatus === "loading" ? "Syncing…" : "Sync"}
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
          {["Name", "Brand", "Status", "Price", "Purchase Date", "First Use", "Retired Date"].map((h) => (
            <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {shoes.map((r, i) => (
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td className="px-3 py-2 text-slate-700 whitespace-nowrap max-w-[180px] truncate">{String(r["Shoes"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-700">{String(r["Shoes Brand"] ?? "")}</td>
            <td className="px-3 py-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                String(r["Status"]) === "In Use" ? "bg-green-100 text-green-700" :
                String(r["Status"]) === "Retired" ? "bg-red-100 text-red-700" :
                "bg-slate-100 text-slate-600"
              )}>
                {String(r["Status"] ?? "")}
              </span>
            </td>
            <td className="px-3 py-2 text-slate-500">{String(r["Shoes Price"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{formatDateDisplay(String(r["Purchase Date"] ?? ""))}</td>
            <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{formatDateDisplay(String(r["First Use"] ?? ""))}</td>
            <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{formatDateDisplay(String(r["Retired Date"] ?? ""))}</td>
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
          {["Race Name", "Date", "Distance (km)", "Completed", "Overall Place", "Age Group Place"].map((h) => (
            <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {races.map((r, i) => (
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{String((r as Record<string, unknown>)["賽事"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{formatDateDisplay(String((r as Record<string, unknown>)["日期"] ?? ""))}</td>
            <td className="px-3 py-2 text-slate-700">{String((r as Record<string, unknown>)["距離 (km)"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String((r as Record<string, unknown>)["完成"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String((r as Record<string, unknown>)["Overall Place"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String((r as Record<string, unknown>)["Age Group Place"] ?? "")}</td>
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
          {["Date", "Weight (kg)", "Height (cm)", "BMI", "Body Fat (%)", "Fat Mass (kg)", "Muscle Mass (kg)", "BMR", "Visceral Fat"].map((h) => (
            <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map((r, i) => (
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{formatDateDisplay(String(r["Date"] ?? ""))}</td>
            <td className="px-3 py-2 text-slate-700">{String(r["Weight"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Height"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["BMI"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["BodyFat"] ?? "")}</td>
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
          {["Date", "Score", "Resting HR", "Body Battery", "Pulse Ox", "Respiration", "Quality"].map((h) => (
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
            <td className="px-3 py-2 text-slate-500">{String(r["Pulse Ox"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Respiration"] ?? "")}</td>
            <td className="px-3 py-2 text-slate-500">{String(r["Quality"] ?? "")}</td>
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
          {["Date", "Resting HR (bpm)", "High HR (bpm)"].map((h) => (
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
          </tr>
        ))}
      </tbody>
    </table>
  );
}
