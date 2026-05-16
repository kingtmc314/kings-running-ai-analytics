// =============================================================
// Body Fitness Tab — King's Running AI Analytics
// Light theme with Edit and Delete per row
// =============================================================
import { useMemo, useState } from "react";
import { Scale, TrendingDown, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { parseDate, formatDateDisplay, BodyStat } from "@/lib/runningData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import EditRecordModal, { FieldDef } from "@/components/EditRecordModal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { updateRow, deleteRow } from "@/lib/sheetsApi";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const BODY_FIELDS_CHART = [
  { key: "Weight",     label: "Weight (kg)",      color: "#3b82f6" },
  { key: "BMI",        label: "BMI",              color: "#10b981" },
  { key: "BodyFat",    label: "Body Fat (%)",      color: "#f97316" },
  { key: "MuscleMass", label: "Muscle Mass (kg)",  color: "#a855f7" },
  { key: "BMR",        label: "BMR (kcal)",        color: "#f59e0b" },
];

const BODY_EDIT_FIELDS: FieldDef[] = [
  { key: "Date",        label: "Date",              type: "date",   required: true },
  { key: "Weight",      label: "Weight (kg)",       type: "number" },
  { key: "BMI",         label: "BMI",               type: "number" },
  { key: "BodyFat",     label: "Body Fat (%)",       type: "number" },
  { key: "FatMass",     label: "Fat Mass (kg)",      type: "number" },
  { key: "MuscleMass",  label: "Muscle Mass (kg)",   type: "number" },
  { key: "BMR",         label: "BMR (kcal)",         type: "number" },
  { key: "VisceralFat", label: "Visceral Fat",       type: "number" },
];

export default function BodyFitnessTab() {
  const { bodyStats, setBodyStats, fetchFromGoogle } = useData();

  // Edit state
  const [editRecord, setEditRecord] = useState<Record<string, unknown> | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Delete state
  const [deleteRecord, setDeleteRecord] = useState<Record<string, unknown> | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const sorted = useMemo(() =>
    [...bodyStats].sort((a, b) => (parseDate(a.Date)?.getTime() || 0) - (parseDate(b.Date)?.getTime() || 0)),
    [bodyStats]
  );

  const chartData = useMemo(() =>
    sorted.map((b) => ({
      date: formatDateDisplay(b.Date),
      Weight:     parseFloat(b.Weight     || "0") || null,
      BMI:        parseFloat(b.BMI        || "0") || null,
      BodyFat:    parseFloat(b.BodyFat    || "0") || null,
      MuscleMass: parseFloat(b.MuscleMass || "0") || null,
      BMR:        parseFloat(b.BMR        || "0") || null,
    })),
    [sorted]
  );

  const latest = sorted[sorted.length - 1];
  const prev   = sorted[sorted.length - 2];

  const delta = (key: string) => {
    if (!latest || !prev) return null;
    const a = parseFloat((latest as Record<string, string>)[key] || "0");
    const b = parseFloat((prev  as Record<string, string>)[key] || "0");
    if (!a || !b) return null;
    return parseFloat((a - b).toFixed(2));
  };

  async function handleEditSave(data: Record<string, string>) {
    if (!editRecord) return;
    const row = editRecord["_row"] as number;
    setEditLoading(true);
    const result = await updateRow("Body", row, data);
    setEditLoading(false);
    if (result.success) {
      setBodyStats((prev) => prev.map((b) => {
        if ((b as unknown as Record<string, unknown>)["_row"] === row) return { ...b, ...data } as unknown as BodyStat;
        return b;
      }));
      toast.success("Body record updated");
      setEditRecord(null);
      fetchFromGoogle();
    } else {
      toast.error(`Failed to update: ${result.error || "Unknown error"}`);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteRecord) return;
    const row = deleteRecord["_row"] as number;
    setDeleteLoading(true);
    const result = await deleteRow("Body", row);
    setDeleteLoading(false);
    if (result.success) {
      setBodyStats((prev) => prev.filter((b) => (b as unknown as Record<string, unknown>)["_row"] !== row));
      toast.success("Body record deleted");
      setDeleteRecord(null);
      fetchFromGoogle();
    } else {
      toast.error(`Failed to delete: ${result.error || "Unknown error"}`);
    }
  }

  return (
    <div className="space-y-5">
      {/* Latest stats */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {BODY_FIELDS_CHART.map((f) => {
            const val = parseFloat((latest as Record<string, string>)[f.key] || "0");
            const d = delta(f.key);
            return (
              <div key={f.key} className="glass-card rounded-xl p-4">
                <p className="text-[10px] text-muted-foreground mb-1">{f.label}</p>
                <p className="font-mono-metric font-600 text-foreground text-xl">{val || "—"}</p>
                {d !== null && (
                  <p className={cn("text-[10px] flex items-center gap-0.5 mt-1", d < 0 ? "text-emerald-600" : "text-red-500")}>
                    {d < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {d > 0 ? "+" : ""}{d}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Weight trend chart */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-4 h-4 text-primary" />
          <h2 className="font-display font-600 text-foreground text-sm">Body Composition Trend</h2>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 9 }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 8)} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: "#64748b" }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {BODY_FIELDS_CHART.slice(0, 4).map((f) => (
              <Line
                key={f.key}
                type="monotone"
                dataKey={f.key}
                name={f.label}
                stroke={f.color}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* History table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-muted-foreground font-semibold">Date</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">Weight</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">BMI</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">Body Fat %</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">Fat Mass</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">Muscle</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">BMR</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">Visceral Fat</th>
                <th className="text-center px-4 py-3 text-muted-foreground font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...sorted].reverse().map((b, i) => {
                const raw = b as unknown as Record<string, unknown>;
                return (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-2.5 text-muted-foreground">{formatDateDisplay(b.Date)}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-foreground font-semibold">{b.Weight || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-slate-600">{b.BMI || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-orange-500">{b.BodyFat || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-slate-600">{b.FatMass || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-purple-600">{b.MuscleMass || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-amber-600">{b.BMR || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-slate-600">{b.VisceralFat || "—"}</td>
                    <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditRecord(raw)}
                          className="p-1 rounded hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setDeleteRecord(raw)}
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
        </div>
      </div>

      {/* Edit Modal */}
      <EditRecordModal
        open={!!editRecord}
        onClose={() => setEditRecord(null)}
        onSave={handleEditSave}
        loading={editLoading}
        title="Edit Body Record"
        fields={BODY_EDIT_FIELDS}
        initialValues={editRecord || {}}
      />

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={!!deleteRecord}
        onClose={() => setDeleteRecord(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Delete Body Record"
        recordLabel={deleteRecord ? `${formatDateDisplay(String(deleteRecord["Date"] || ""))} — Weight: ${String(deleteRecord["Weight"] || "?")} kg` : undefined}
      />
    </div>
  );
}
