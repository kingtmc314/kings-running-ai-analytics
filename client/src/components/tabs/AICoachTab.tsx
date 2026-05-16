// =============================================================
// AI Coach Tab — King's Running AI Analytics
// =============================================================
import { Brain, Sparkles, Footprints, BarChart2, Map, Clock, RefreshCw } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { formatDateDisplay, RacePrediction } from "@/lib/runningData";
import { cn } from "@/lib/utils";

export default function AICoachTab() {
  const { aiAnalysis, syncStatus, generateAI } = useData();

  if (syncStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Brain className="w-10 h-10 text-primary animate-pulse" />
        <p className="text-muted-foreground text-sm">Analysing your training data…</p>
      </div>
    );
  }

  if (!aiAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Brain className="w-10 h-10 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">No AI analysis yet.</p>
        <button
          onClick={generateAI}
          className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Generate Analysis
        </button>
      </div>
    );
  }

  const { intro, predictions } = aiAnalysis;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro block */}
      <div className="glass-card-elevated rounded-2xl p-6 border border-primary/20">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-display font-700 text-white text-lg leading-snug">{intro.title}</h2>
        </div>
        <div className="space-y-2 text-sm text-slate-300 leading-relaxed pl-13">
          <p dangerouslySetInnerHTML={{ __html: intro.p1.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
          <p>{intro.p2}</p>
          <p dangerouslySetInnerHTML={{ __html: intro.p3.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={generateAI}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh Analysis
          </button>
        </div>
      </div>

      {/* Predictions */}
      {predictions.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground text-sm">
          No upcoming races found. Add a future race in the Race Record tab to get AI predictions!
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.map((pred, i) => (
            <PredictionCard key={i} index={i + 1} pred={pred} />
          ))}
        </div>
      )}
    </div>
  );
}

function PredictionCard({ index, pred }: { index: number; pred: RacePrediction }) {
  const dist = parseFloat(pred.race["距離 (km)"] || "0");
  const isLong = dist > 21;
  const isMid = dist > 10 && dist <= 21;

  return (
    <div className={cn(
      "glass-card rounded-2xl overflow-hidden border transition-all duration-200 hover:border-primary/30",
      "border-white/8"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 bg-white/3">
        <span className="w-7 h-7 rounded-full bg-primary/20 text-primary text-xs font-display font-700 flex items-center justify-center shrink-0">
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-600 text-white text-sm truncate">{pred.race.賽事}</h3>
          <p className="text-[11px] text-muted-foreground">{formatDateDisplay(pred.race.日期)} · {dist} km</p>
        </div>
        {/* Predicted time badge */}
        <div className="text-right shrink-0">
          <p className="font-mono-metric font-600 text-primary text-sm">{pred.predictedMin} – {pred.predictedMax}</p>
          <p className="text-[10px] text-muted-foreground">{pred.paceMin} – {pred.paceMax} /km</p>
        </div>
      </div>

      {/* Body */}
      <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/8">
        <div className="p-5 space-y-3">
          <InfoRow icon={Footprints} label="Selected Shoe" value={pred.selectedShoe} valueClass="text-primary" />
          {pred.alternatives.length > 0 && (
            <InfoRow icon={Footprints} label="Alternatives" value={pred.alternatives.join(", ")} />
          )}
          <InfoRow icon={Sparkles} label="Why" value={pred.why} />
        </div>
        <div className="p-5 space-y-3">
          <InfoRow icon={BarChart2} label="Data Analysis" value={pred.dataAnalysis} />
          <InfoRow icon={Map} label="Race Strategy" value={pred.raceStrategy} />
          <div className="flex items-center gap-2 pt-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">Predicted Time</p>
              <p className="font-mono-metric font-600 text-white text-sm">
                {pred.predictedMin} – {pred.predictedMax}
                <span className="text-muted-foreground font-400 text-[10px] ml-2">
                  (Avg Pace: {pred.paceMin} – {pred.paceMax})
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, valueClass }: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex gap-2.5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
        <p className={cn("text-xs text-slate-300 leading-relaxed", valueClass)}>{value}</p>
      </div>
    </div>
  );
}
