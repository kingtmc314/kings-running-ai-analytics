// AI Coach Tab — King's Running AI Analytics
// Light theme: slate-800/700/600 text on white cards
// Features: shoe recommendation table, weather note, body note, enhanced strategy
// =============================================================
import { useState } from "react";
import {
  Brain, Sparkles, Footprints, BarChart2, Map, Clock,
  RefreshCw, Thermometer, Activity, ChevronDown, ChevronUp,
  Trophy, Wind, Droplets
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { formatDateDisplay, RacePrediction, ShoeTableRow } from "@/lib/runningData";
import { cn } from "@/lib/utils";

export default function AICoachTab() {
  const { aiAnalysis, syncStatus, generateAI } = useData();

  if (syncStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Brain className="w-10 h-10 text-primary animate-pulse" />
        <p className="text-slate-500 text-sm">Analysing your training data…</p>
      </div>
    );
  }

  if (!aiAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Brain className="w-10 h-10 text-slate-400" />
        <p className="text-slate-500 text-sm">No AI analysis yet.</p>
        <button
          onClick={generateAI}
          className="flex items-center gap-2 px-4 py-2 bg-primary/15 hover:bg-primary/25 text-primary rounded-lg text-sm transition-colors font-medium"
        >
          <RefreshCw className="w-4 h-4" /> Generate Analysis
        </button>
      </div>
    );
  }

  const { intro, predictions } = aiAnalysis;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Intro block */}
      <div className="bg-white rounded-2xl p-6 border border-primary/20 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-display font-bold text-slate-800 text-xl leading-snug">{intro.title}</h2>
        </div>
        <div className="space-y-2 text-sm text-slate-700 leading-relaxed pl-13">
          <p dangerouslySetInnerHTML={{ __html: intro.p1.replace(/\*\*(.*?)\*\*/g, "<strong class='text-slate-900'>$1</strong>") }} />
          <p className="text-slate-700">{intro.p2}</p>
          <p dangerouslySetInnerHTML={{ __html: intro.p3.replace(/\*\*(.*?)\*\*/g, "<strong class='text-slate-900'>$1</strong>") }} />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={generateAI}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh Analysis
          </button>
        </div>
      </div>

      {/* Predictions */}
      {predictions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-600 text-sm border border-slate-200">
          No upcoming races found. Add a future race in the Race Record tab to get AI predictions!
        </div>
      ) : (
        <div className="space-y-6">
          {predictions.map((pred, i) => (
            <PredictionCard key={i} index={i + 1} pred={pred} />
          ))}
        </div>
      )}
    </div>
  );
}

function PredictionCard({ index, pred }: { index: number; pred: RacePrediction }) {
  const [showShoeTable, setShowShoeTable] = useState(false);
  const dist = parseFloat(pred.race["距離 (km)"] || "0");

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-orange-50/30">
        <span className="w-8 h-8 rounded-full bg-primary/15 text-primary text-base font-bold flex items-center justify-center shrink-0">
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 text-sm truncate">{pred.race.賽事}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{formatDateDisplay(pred.race.日期)} · {dist} km</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-primary font-bold text-base">{pred.predictedMin} – {pred.predictedMax}</p>
          <p className="text-sm text-slate-500">{pred.paceMin} – {pred.paceMax} min/km</p>
        </div>
      </div>

      {/* Main body: 2-column grid */}
      <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Left column */}
        <div className="p-5 space-y-4">
          <InfoRow icon={Footprints} label="Selected Shoe" value={pred.selectedShoe} valueClass="text-primary font-semibold" />
          {pred.alternatives.length > 0 && (
            <InfoRow icon={Footprints} label="Alternatives" value={pred.alternatives.join(", ")} />
          )}
          <InfoRow icon={Sparkles} label="Why This Shoe" value={pred.why} />
          <InfoRow icon={BarChart2} label="Data Analysis" value={pred.dataAnalysis} />
        </div>

        {/* Right column */}
        <div className="p-5 space-y-4">
          <InfoRow icon={Map} label="Race Strategy" value={pred.raceStrategy} />
          {pred.weatherNote && (
            <InfoRow icon={Thermometer} label="Weather Conditions" value={pred.weatherNote} iconClass="text-amber-500" />
          )}
          {pred.bodyNote && (
            <InfoRow icon={Activity} label="Body & Fitness" value={pred.bodyNote} iconClass="text-emerald-500" />
          )}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">Predicted Time</p>
              <p className="font-mono font-bold text-slate-800 text-sm">
                {pred.predictedMin} – {pred.predictedMax}
                <span className="text-slate-400 font-normal text-sm ml-2">
                  ({pred.paceMin} – {pred.paceMax} min/km)
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shoe Recommendation Table toggle */}
      {pred.shoeTable && pred.shoeTable.length > 0 && (
        <div className="border-t border-slate-100">
          <button
            onClick={() => setShowShoeTable((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-base font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Shoe Recommendation Table ({pred.shoeTable.length} shoes ranked)
            </div>
            {showShoeTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showShoeTable && (
            <div className="px-4 pb-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600">
                    <th className="text-left px-3 py-2 font-semibold rounded-tl-lg">#</th>
                    <th className="text-left px-3 py-2 font-semibold">Shoe</th>
                    <th className="text-left px-3 py-2 font-semibold">Status</th>
                    <th className="text-right px-3 py-2 font-semibold">Total km</th>
                    <th className="text-right px-3 py-2 font-semibold">Score</th>
                    <th className="text-left px-3 py-2 font-semibold rounded-tr-lg">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {pred.shoeTable.map((row, idx) => (
                    <ShoeTableRowComponent key={idx} row={row} isTop={idx === 0 && row.status === "In Use"} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ShoeTableRowComponent({ row, isTop }: { row: ShoeTableRow; isTop: boolean }) {
  const isInUse = row.status === "In Use";
  const isHighMileage = row.totalKm > 600;
  return (
    <tr className={cn(
      "border-b border-slate-100 transition-colors",
      isTop ? "bg-orange-50/60" : "hover:bg-slate-50/60",
      !isInUse && "opacity-60"
    )}>
      <td className="px-3 py-2 font-bold text-slate-700">
        {isTop ? <span className="text-amber-500">★</span> : row.rank}
      </td>
      <td className="px-3 py-2 text-slate-800 font-medium max-w-[180px] truncate" title={row.name}>
        {row.name}
      </td>
      <td className="px-3 py-2">
        <span className={cn(
          "px-1.5 py-0.5 rounded text-base font-semibold",
          isInUse ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
        )}>
          {row.status || "Retired"}
        </span>
      </td>
      <td className={cn("px-3 py-2 text-right font-mono", isHighMileage ? "text-orange-600 font-bold" : "text-slate-700")}>
        {row.totalKm > 0 ? row.totalKm.toFixed(0) : "—"}
      </td>
      <td className="px-3 py-2 text-right">
        <span className={cn(
          "font-bold",
          row.score >= 80 ? "text-emerald-600" :
          row.score >= 50 ? "text-amber-600" :
          "text-slate-400"
        )}>
          {row.score}
        </span>
      </td>
      <td className="px-3 py-2 text-slate-600 max-w-[220px]">{row.reason}</td>
    </tr>
  );
}

function InfoRow({ icon: Icon, label, value, valueClass, iconClass }: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
  iconClass?: string;
}) {
  return (
    <div className="flex gap-2.5">
      <Icon className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", iconClass || "text-slate-400")} />
      <div>
        <p className="text-sm text-slate-500 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
        <p className={cn("text-sm text-slate-700 leading-relaxed", valueClass)}>{value}</p>
      </div>
    </div>
  );
}
