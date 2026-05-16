// =============================================================
// Sleep Tab — King's Running AI Analytics
// Light theme with Edit and Delete per row
// =============================================================
import { useMemo, useState } from "react";
import { Moon, Battery, Heart, Pencil, Trash2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { parseDate, formatDateDisplay, SleepRecord } from "@/lib/runningData";
import { toast } from "sonner";
import EditRecordModal, { FieldDef } from "@/components/EditRecordModal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { updateRow, deleteRow } from "@/lib/sheetsApi";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const SLEEP_EDIT_FIELDS: FieldDef[] = [
  { key: "Date",               label: "Date",          type: "date",   required: true },
  { key: "Score",              label: "Sleep Score",   type: "number" },
  { key: "Resting Heart Rate", label: "Resting HR",    type: "number" },
  { key: "Body Battery",       label: "Body Battery",  type: "number" },
  { key: "Pulse Ox",           label: "Pulse Ox (%)",  type: "number" },
  { key: "Respiration",        label: "Respiration",   type: "number" },
  { key: "Stress",             label: "Stress",        type: "number" },
  { key: "Quality",            label: "Quality",       type: "select", options: ["Excellent", "Good", "Fair", "Poor"] },
];

export default function SleepTab() {
  const { sleeps, setSleeps, fetchFromGoogle } = useData();

  const [editRecord, setEditRecord]   = useState<Record<string, unknown> | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteRecord, setDeleteRecord]   = useState<Record<string, unknown> | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const sorted = useMemo(() =>
    [...sleeps].sort((a, b) => (parseDate(a.Date)?.getTime() || 0) - (parseDate(b.Date)?.getTime() || 0)),
    [sleeps]
  );

  const last30 = sorted.slice(-30);

  const chartData = useMemo(() =>
    last30.map((s) => ({
      date: formatDateDisplay(s.Date),
      Score:          parseFloat(s.Score              || "0") || null,
      "Resting HR":   parseFloat(s["Resting Heart Rate"] || "0") || null,
      "Body Battery": parseFloat(s["Body Battery"]    || "0") || null,
    })),
    [last30]
  );

  const latest = sorted[sorted.length - 1];

  const avgScore = useMemo(() => {
    const vals = sorted.map((s) => parseFloat(s.Score || "0")).filter(Boolean);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
  }, [sorted]);

  async function handleEditSave(data: Record<string, string>) {
    if (!editRecord) return;
    const row = editRecord["_row"] as number;
    setEditLoading(true);
    const result = await updateRow("Sleep", row, data);
    setEditLoading(false);
    if (result.success) {
      setSleeps((prev) => prev.map((s) => {
        if ((s as unknown as Record<string, unknown>)["_row"] === row) return { ...s, ...data } as unknown as SleepRecord;
        return s;
      }));
      toast.success("Sleep record updated");
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
    const result = await deleteRow("Sleep", row);
    setDeleteLoading(false);
    if (result.success) {
      setSleeps((prev) => prev.filter((s) => (s as unknown as Record<string, unknown>)["_row"] !== row));
      toast.success("Sleep record deleted");
      setDeleteRecord(null);
      fetchFromGoogle();
    } else {
      toast.error(`Failed to delete: ${result.error || "Unknown error"}`);
    }
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SleepStatCard icon={Moon}    label="Latest Score"   value={latest.Score || "—"}                         color="text-blue-600" />
          <SleepStatCard icon={Battery} label="Body Battery"   value={latest["Body Battery"] || "—"}               color="text-emerald-600" />
          <SleepStatCard icon={Heart}   label="Resting HR"     value={`${latest["Resting Heart Rate"] || "—"} bpm`} color="text-red-500" />
          <SleepStatCard icon={Moon}    label="Avg Score (All)" value={avgScore}                                    color="text-purple-600" />
        </div>
      )}

      {/* Chart */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Moon className="w-4 h-4 text-blue-500" />
          <h2 className="font-display font-600 text-foreground text-sm">Sleep Score &amp; Recovery (Last 30 Days)</h2>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 9 }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#64748b" }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="Score" fill="#3b82f6" opacity={0.7} maxBarSize={20} />
            <Line type="monotone" dataKey="Resting HR"   stroke="#ef4444" strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="Body Battery" stroke="#10b981" strokeWidth={2} dot={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-muted-foreground font-semibold">Date</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">Score</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">Resting HR</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">Body Battery</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">Pulse Ox</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">Respiration</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">Stress</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-semibold">Quality</th>
                <th className="text-center px-4 py-3 text-muted-foreground font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...sorted].reverse().map((s, i) => {
                const raw = s as unknown as Record<string, unknown>;
                return (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground">{formatDateDisplay(s.Date)}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-blue-600 font-semibold">{s.Score || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-red-500">{s["Resting Heart Rate"] || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-emerald-600">{s["Body Battery"] || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-slate-600">{s["Pulse Ox"] || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-slate-600">{s.Respiration || "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-amber-600">{s.Stress || "—"}</td>
                    <td className="px-4 py-2.5 text-slate-600">{s.Quality || "—"}</td>
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
        title="Edit Sleep Record"
        fields={SLEEP_EDIT_FIELDS}
        initialValues={editRecord || {}}
      />

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={!!deleteRecord}
        onClose={() => setDeleteRecord(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Delete Sleep Record"
        recordLabel={deleteRecord ? `${formatDateDisplay(String(deleteRecord["Date"] || ""))} — Score: ${String(deleteRecord["Score"] || "?")}` : undefined}
      />
    </div>
  );
}

function SleepStatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className={`font-mono-metric font-600 text-2xl ${color}`}>{value}</p>
    </div>
  );
}
