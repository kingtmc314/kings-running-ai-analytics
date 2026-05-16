// =============================================================
// Log Data Tab — King's Running AI Analytics
// =============================================================
import { useState } from "react";
import { RefreshCw, Database } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { formatDateDisplay } from "@/lib/runningData";
import { cn } from "@/lib/utils";

type Sheet = "running" | "shoes" | "races" | "body" | "sleep" | "hr";

const SHEETS: { id: Sheet; label: string }[] = [
  { id: "running", label: "Running Log" },
  { id: "shoes",   label: "Shoes" },
  { id: "races",   label: "Races" },
  { id: "body",    label: "Body" },
  { id: "sleep",   label: "Sleep" },
  { id: "hr",      label: "Heart Rate" },
];

export default function LogDataTab() {
  const { logs, shoes, races, bodyStats, sleeps, heartRates, syncStatus, fetchFromGoogle } = useData();
  const [sheet, setSheet] = useState<Sheet>("running");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <h2 className="font-display font-600 text-slate-800 text-sm">Raw Data from Google Sheets</h2>
        </div>
        <button
          onClick={() => fetchFromGoogle()}
          disabled={syncStatus === "loading"}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs transition-colors disabled:opacity-60"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", syncStatus === "loading" && "animate-spin")} />
          {syncStatus === "loading" ? "Syncing…" : "Sync Now"}
        </button>
      </div>

      {/* Sheet tabs */}
      <div className="flex gap-2 flex-wrap">
        {SHEETS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSheet(s.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              sheet === s.id
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-slate-50 text-muted-foreground border-slate-200 hover:border-slate-300"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh]">
          {sheet === "running" && <RunningTable logs={logs} />}
          {sheet === "shoes" && <ShoesTable shoes={shoes} />}
          {sheet === "races" && <RacesTable races={races} />}
          {sheet === "body" && <BodyTable body={bodyStats} />}
          {sheet === "sleep" && <SleepTable sleeps={sleeps} />}
          {sheet === "hr" && <HRTable hrs={heartRates} />}
        </div>
      </div>
    </div>
  );
}

function RunningTable({ logs }: { logs: ReturnType<typeof useData>["logs"] }) {
  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-white">
        <tr className="border-b border-slate-200">
          {["Date", "Type", "Dist (km)", "H", "M", "S", "Avg HR", "Max HR", "Shoe", "Calories", "Avg Cadence"].map((h) => (
            <th key={h} className="text-left px-3 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...logs].reverse().map((l, i) => (
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDateDisplay(l.Date)}</td>
            <td className="px-3 py-2 text-slate-800">{l["Running Type"] || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-slate-800">{l["Distance (km)"] || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-muted-foreground">{l.Hour || "0"}</td>
            <td className="px-3 py-2 font-mono-metric text-muted-foreground">{l.Minutes || "0"}</td>
            <td className="px-3 py-2 font-mono-metric text-muted-foreground">{l.Second || "0"}</td>
            <td className="px-3 py-2 font-mono-metric text-red-400">{l["Average Heart Rate"] || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-orange-400">{l["Maximum Heart Rate"] || "—"}</td>
            <td className="px-3 py-2 text-muted-foreground max-w-[120px] truncate">{l["Running_Shoes"] || l["Running Shoes"] || l["Shoes Name"] || l["Shoes"] || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-amber-400">{l.Calories || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-muted-foreground">{l["Average Cadence"] || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ShoesTable({ shoes }: { shoes: ReturnType<typeof useData>["shoes"] }) {
  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-white">
        <tr className="border-b border-slate-200">
          {["Name", "Brand", "Status", "Price", "Purchase Date", "First Use", "Retired Date"].map((h) => (
            <th key={h} className="text-left px-3 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {shoes.map((s, i) => (
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="px-3 py-2 text-slate-800">{s.Shoes || s["Shoes Name"] || "—"}</td>
            <td className="px-3 py-2 text-muted-foreground">{s["Shoes Brand"] || "—"}</td>
            <td className="px-3 py-2 text-muted-foreground">{s.Status || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-emerald-400">{s["Shoes Price"] || "—"}</td>
            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDateDisplay(s["Purchase Date"])}</td>
            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDateDisplay(s["First Use"])}</td>
            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDateDisplay(s["Retired Date"])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RacesTable({ races }: { races: ReturnType<typeof useData>["races"] }) {
  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-white">
        <tr className="border-b border-slate-200">
          {["Race", "Date", "Distance (km)", "Completed", "Overall Place", "AG Place"].map((h) => (
            <th key={h} className="text-left px-3 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {races.map((r, i) => (
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="px-3 py-2 text-slate-800">{r.賽事 || "—"}</td>
            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDateDisplay(r.日期)}</td>
            <td className="px-3 py-2 font-mono-metric text-slate-800">{r["距離 (km)"] || "—"}</td>
            <td className="px-3 py-2">{r.完成 ? <span className="text-emerald-400">✓</span> : <span className="text-muted-foreground">—</span>}</td>
            <td className="px-3 py-2 text-muted-foreground">{r["Overall Place"] || "—"}</td>
            <td className="px-3 py-2 text-muted-foreground">{r["Age Group Place"] || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BodyTable({ body }: { body: ReturnType<typeof useData>["bodyStats"] }) {
  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-white">
        <tr className="border-b border-slate-200">
          {["Date", "Weight", "BMI", "Body Fat %", "Fat Mass", "Muscle", "BMR", "Visceral Fat"].map((h) => (
            <th key={h} className="text-left px-3 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...body].reverse().map((b, i) => (
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDateDisplay(b.Date)}</td>
            <td className="px-3 py-2 font-mono-metric text-slate-800">{b.Weight || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-muted-foreground">{b.BMI || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-orange-400">{b.BodyFat || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-muted-foreground">{b.FatMass || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-purple-400">{b.MuscleMass || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-amber-400">{b.BMR || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-muted-foreground">{b.VisceralFat || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SleepTable({ sleeps }: { sleeps: ReturnType<typeof useData>["sleeps"] }) {
  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-white">
        <tr className="border-b border-slate-200">
          {["Date", "Score", "Resting HR", "Body Battery", "Pulse Ox", "Respiration", "Stress", "Quality"].map((h) => (
            <th key={h} className="text-left px-3 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...sleeps].reverse().map((s, i) => (
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDateDisplay(s.Date)}</td>
            <td className="px-3 py-2 font-mono-metric text-blue-400">{s.Score || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-red-400">{s["Resting Heart Rate"] || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-emerald-400">{s["Body Battery"] || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-muted-foreground">{s["Pulse Ox"] || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-muted-foreground">{s.Respiration || "—"}</td>
            <td className="px-3 py-2 font-mono-metric text-amber-400">{s.Stress || "—"}</td>
            <td className="px-3 py-2 text-muted-foreground">{s.Quality || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HRTable({ hrs }: { hrs: ReturnType<typeof useData>["heartRates"] }) {
  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-white">
        <tr className="border-b border-slate-200">
          {["Date", "Resting HR", "High HR"].map((h) => (
            <th key={h} className="text-left px-3 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...hrs].reverse().map((h, i) => (
          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDateDisplay(h.Date)}</td>
            <td className="px-3 py-2 font-mono-metric text-red-400">{h.Resting || "—"} bpm</td>
            <td className="px-3 py-2 font-mono-metric text-orange-400">{h.High || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
