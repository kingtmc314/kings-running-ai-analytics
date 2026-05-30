// =============================================================
// Heart Rate Tab — King's Running AI Analytics
// Light theme with Edit and Delete per row
// =============================================================
import { useMemo, useState } from "react";
import { Heart, Pencil, Trash2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { parseDate, formatDateDisplay, getHRZone, HeartRateRecord } from "@/lib/runningData";
import { toast } from "sonner";
import EditRecordModal, { FieldDef } from "@/components/EditRecordModal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
// Supabase CRUD via DataContext
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const ZONE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#f97316", "#ef4444"];

const HR_EDIT_FIELDS: FieldDef[] = [
  { key: "Date",    label: "Date",       type: "date",   required: true },
  { key: "Resting", label: "Resting HR (bpm)", type: "number", required: true },
  { key: "High",    label: "High HR (bpm)",    type: "number" },
];

export default function HeartRateTab() {
  const { heartRates, setHeartRates, logs, latestRestingHR, fetchFromGoogle, updateHREntry, deleteHREntry } = useData();

  const [editRecord, setEditRecord]       = useState<Record<string, unknown> | null>(null);
  const [editLoading, setEditLoading]     = useState(false);
  const [deleteRecord, setDeleteRecord]   = useState<Record<string, unknown> | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const sorted = useMemo(() =>
    [...heartRates].sort((a, b) => (parseDate(a.Date)?.getTime() || 0) - (parseDate(b.Date)?.getTime() || 0)),
    [heartRates]
  );

  const chartData = useMemo(() =>
    sorted.map((h) => ({
      date:    formatDateDisplay(h.Date),
      Resting: parseFloat(h.Resting || "0") || null,
      High:    parseFloat(h.High    || "0") || null,
    })),
    [sorted]
  );

  const zoneDistribution = useMemo(() => {
    const counts: Record<string, number> = { "Z1": 0, "Z2": 0, "Z3": 0, "Z4": 0, "Z5": 0, "< Z1": 0 };
    logs.forEach((l) => {
      const avg = parseFloat(l["Average Heart Rate"] || "0");
      if (!avg) return;
      const z = getHRZone(avg, latestRestingHR);
      counts[z.zone] = (counts[z.zone] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [logs, latestRestingHR]);

  async function handleEditSave(data: Record<string, string>) {
    if (!editRecord) return;
    const supabaseId = editRecord["_supabaseId"] as number;
    if (!supabaseId) { toast.error("Cannot update: missing record ID"); return; }
    setEditLoading(true);
    try {
      const supabaseData: Record<string, unknown> = {};
      if (data["Date"]) supabaseData["date"] = data["Date"];
      if (data["Resting"]) supabaseData["resting_heart_rate"] = parseFloat(data["Resting"]);
      if (data["High"]) supabaseData["max_heart_rate"] = parseFloat(data["High"]);
      await updateHREntry(supabaseId, supabaseData as Parameters<typeof updateHREntry>[1]);
      setHeartRates((prev) => prev.map((h) => {
        if ((h as unknown as Record<string, unknown>)["_supabaseId"] === supabaseId) return { ...h, ...data } as unknown as HeartRateRecord;
        return h;
      }));
      toast.success("Heart rate record updated");
      setEditRecord(null);
      fetchFromGoogle();
    } catch (err) {
      toast.error(`Failed to update: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteRecord) return;
    const supabaseId = deleteRecord["_supabaseId"] as number;
    if (!supabaseId) { toast.error("Cannot delete: missing record ID"); return; }
    setDeleteLoading(true);
    try {
      await deleteHREntry(supabaseId);
      setHeartRates((prev) => prev.filter((h) => (h as unknown as Record<string, unknown>)["_supabaseId"] !== supabaseId));
      toast.success("Heart rate record deleted");
      setDeleteRecord(null);
    } catch (err) {
      toast.error(`Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Latest HR */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Latest Resting HR</p>
            <p className="font-mono-metric font-700 text-3xl text-red-500">{sorted[sorted.length - 1].Resting} bpm</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Latest High HR</p>
            <p className="font-mono-metric font-700 text-3xl text-orange-500">{sorted[sorted.length - 1].High || "—"} bpm</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Max HR (configured)</p>
            <p className="font-mono-metric font-700 text-3xl text-foreground">202 bpm</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Trend chart */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-red-500" />
            <h2 className="font-display font-600 text-foreground text-sm">Resting HR Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 9 }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" interval={Math.floor(chartData.length / 6)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#64748b" }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="Resting" stroke="#ef4444" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="High" stroke="#f97316" strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 2" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Zone pie */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-primary" />
            <h2 className="font-display font-600 text-foreground text-sm">Training Zone Distribution</h2>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={zoneDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {zoneDistribution.map((_, i) => (
                    <Cell key={i} fill={ZONE_COLORS[i % ZONE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {zoneDistribution.map((z, i) => (
                <div key={z.name} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ZONE_COLORS[i % ZONE_COLORS.length] }} />
                  <span className="text-muted-foreground">{z.name}</span>
                  <span className="font-mono-metric text-foreground ml-auto">{z.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-muted-foreground font-semibold">Date</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">Resting HR</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-semibold">High HR</th>
                <th className="text-center px-4 py-3 text-muted-foreground font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...sorted].reverse().map((h, i) => {
                const raw = h as unknown as Record<string, unknown>;
                return (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground">{formatDateDisplay(h.Date)}</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-red-500 font-semibold">{h.Resting} bpm</td>
                    <td className="px-4 py-2.5 text-right font-mono-metric text-orange-500">{h.High || "—"}</td>
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
        title="Edit Heart Rate Record"
        fields={HR_EDIT_FIELDS}
        initialValues={editRecord || {}}
      />

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={!!deleteRecord}
        onClose={() => setDeleteRecord(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Delete Heart Rate Record"
        recordLabel={deleteRecord ? `${formatDateDisplay(String(deleteRecord["Date"] || ""))} — Resting: ${String(deleteRecord["Resting"] || "?")} bpm` : undefined}
      />
    </div>
  );
}
