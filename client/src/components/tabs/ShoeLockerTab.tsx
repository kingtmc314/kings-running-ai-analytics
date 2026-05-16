// =============================================================
// Shoe Locker Tab — King's Running AI Analytics
// Light Running Theme — clickable cards open activity history popup
// =============================================================
import { useMemo, useState } from "react";
import {
  ShoppingBag, Activity, Calendar, ChevronUp, ChevronDown,
  ChevronsUpDown, DollarSign, Ruler, Hash, ExternalLink,
  Footprints, Timer, Zap, X, Pencil, Trash2,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { formatDateDisplay, parseDate, logToSeconds, secondsToHMS, paceToString, getShoeName, getHRZone, RUN_TYPE_COLORS, Shoe } from "@/lib/runningData";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import EditRecordModal, { FieldDef } from "@/components/EditRecordModal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { updateRow, deleteRow } from "@/lib/sheetsApi";

// ─── Constants ────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  "In Use":          "bg-emerald-100 text-emerald-700 border-emerald-300",
  "Not Yet Opened":  "bg-blue-100 text-blue-700 border-blue-300",
  "Retired":         "bg-slate-100 text-slate-500 border-slate-300",
};

const MAX_SHOE_DIST = 800;

type SortKey = "status" | "dist" | "sessions" | "price" | "costperkm" | "purchase";
type SortDir = "asc" | "desc";

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ElementType }[] = [
  { key: "status",    label: "Status",     icon: Activity },
  { key: "dist",      label: "Distance",   icon: Ruler },
  { key: "sessions",  label: "Sessions",   icon: Hash },
  { key: "price",     label: "Price",      icon: DollarSign },
  { key: "costperkm", label: "$/km",       icon: DollarSign },
  { key: "purchase",  label: "Purchased",  icon: Calendar },
];

// ─── Shoe Activity History Popup ──────────────────────────────

function ShoeHistoryModal({
  shoeName,
  photoUrl,
  onClose,
}: {
  shoeName: string | null;
  photoUrl: string;
  onClose: () => void;
}) {
  const { logs, latestRestingHR } = useData();

  const shoeActivities = useMemo(() => {
    if (!shoeName) return [];
    return logs
      .filter((l) => getShoeName(l) === shoeName)
      .sort((a, b) => {
        const da = parseDate(a.Date)?.getTime() || 0;
        const db = parseDate(b.Date)?.getTime() || 0;
        return db - da;
      });
  }, [logs, shoeName]);

  const totalKm = useMemo(
    () => shoeActivities.reduce((s, l) => {
      const raw = l as unknown as Record<string, unknown>;
      return s + (parseFloat(String(raw["Distance (km)"] ?? "0")) || 0);
    }, 0),
    [shoeActivities]
  );

  const avgPace = useMemo(() => {
    let totalSec = 0, totalDist = 0;
    shoeActivities.forEach((l) => {
      const raw = l as unknown as Record<string, unknown>;
      const dist = parseFloat(String(raw["Distance (km)"] ?? "0")) || 0;
      const t = logToSeconds(l);
      if (dist > 0 && t > 0) { totalSec += t; totalDist += dist; }
    });
    return totalDist > 0 ? (totalSec / 60) / totalDist * 60 : 0;
  }, [shoeActivities]);

  if (!shoeName) return null;

  return (
    <Dialog open={!!shoeName} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white border-border">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-3">
            {photoUrl && (
              <img src={photoUrl} alt={shoeName} className="w-14 h-14 object-contain rounded-lg bg-secondary p-1 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Shoe Activity History</p>
              <DialogTitle className="font-display text-base text-foreground leading-snug">{shoeName}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="font-mono-metric text-xl font-bold text-foreground">{shoeActivities.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sessions</p>
          </div>
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="font-mono-metric text-xl font-bold text-primary">{totalKm.toFixed(1)}<span className="text-sm font-normal text-muted-foreground ml-1">km</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Distance</p>
          </div>
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="font-mono-metric text-xl font-bold text-foreground">{avgPace > 0 ? paceToString(avgPace) : "—"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Avg Pace /km</p>
          </div>
        </div>

        {/* Activity list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {shoeActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No activities recorded with this shoe.</div>
          ) : (
            <div className="space-y-1.5">
              {shoeActivities.map((l, i) => {
                const raw = l as unknown as Record<string, unknown>;
                const dist = parseFloat(String(raw["Distance (km)"] ?? "0")) || 0;
                const timeSec = logToSeconds(l);
                const paceSec = dist > 0 && timeSec > 0 ? (timeSec / 60) / dist * 60 : 0;
                const avgHR = parseFloat(String(raw["Average Heart Rate"] ?? "0")) || 0;
                const zone = getHRZone(avgHR, latestRestingHR);
                const rt = String(raw["Running Type"] || "");
                const rtColor = RUN_TYPE_COLORS[rt] || "#64748b";
                return (
                  <div key={i} className="flex items-center gap-3 bg-secondary/60 hover:bg-secondary rounded-xl px-3 py-2.5 transition-colors">
                    <div className="shrink-0 text-center w-14">
                      <p className="text-[10px] text-muted-foreground">{formatDateDisplay(l.Date)}</p>
                    </div>
                    <div className="shrink-0">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white"
                        style={{ background: rtColor }}
                      >
                        {rt || "Run"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 ml-auto text-xs font-mono-metric">
                      <span className="flex items-center gap-1 text-foreground font-semibold">
                        <Footprints className="w-3 h-3 text-muted-foreground" />
                        {dist > 0 ? `${dist.toFixed(2)} km` : "—"}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Timer className="w-3 h-3" />
                        {timeSec > 0 ? secondsToHMS(timeSec) : "—"}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Zap className="w-3 h-3" />
                        {paceSec > 0 ? `${paceToString(paceSec)}/km` : "—"}
                      </span>
                      {avgHR > 0 && (
                        <span className={cn("flex items-center gap-1 font-semibold", zone.color)}>
                          ♥ {avgHR}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const SHOE_FIELDS: FieldDef[] = [
  { key: "Shoes Name",    label: "Shoe Full Name",   type: "text",   required: true },
  { key: "Shoes Brand",   label: "Brand",           type: "text" },
  { key: "Status",        label: "Status",          type: "select", options: ["In Use", "Not Yet Opened", "Retired"] },
  { key: "Price",         label: "Price (HKD)",     type: "number" },
  { key: "Purchase Date", label: "Purchase Date",   type: "date" },
  { key: "First Use",     label: "First Use Date",  type: "date" },
  { key: "Retired Date",  label: "Retired Date",    type: "date" },
];

// ─── Main Component ───────────────────────────────────────────

export default function ShoeLockerTab() {
  const { processedShoes, setShoes, fetchFromGoogle } = useData();
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedShoe, setSelectedShoe] = useState<{ name: string; photo: string } | null>(null);

  // Edit state
  const [editShoe, setEditShoe] = useState<Record<string, unknown> | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Delete state
  const [deleteShoe, setDeleteShoe] = useState<Record<string, unknown> | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleEditSave(data: Record<string, string>) {
    if (!editShoe) return;
    const row = editShoe["_row"] as number;
    setEditLoading(true);
    const result = await updateRow("Running Shoes", row, data);
    setEditLoading(false);
    if (result.success) {
      setShoes((prev) => prev.map((s) => {
        if ((s as unknown as Record<string, unknown>)["_row"] === row) return { ...s, ...data } as unknown as Shoe;
        return s;
      }));
      toast.success("Shoe updated successfully");
      setEditShoe(null);
      fetchFromGoogle();
    } else {
      toast.error(`Failed to update: ${result.error || "Unknown error"}`);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteShoe) return;
    const row = deleteShoe["_row"] as number;
    setDeleteLoading(true);
    const result = await deleteRow("Running Shoes", row);
    setDeleteLoading(false);
    if (result.success) {
      setShoes((prev) => prev.filter((s) => (s as unknown as Record<string, unknown>)["_row"] !== row));
      toast.success("Shoe deleted");
      setDeleteShoe(null);
      fetchFromGoogle();
    } else {
      toast.error(`Failed to delete: ${result.error || "Unknown error"}`);
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const totalSpend = useMemo(
    () => processedShoes.reduce((acc, s) => acc + s.parsedPrice, 0),
    [processedShoes]
  );
  const totalDist = useMemo(
    () => processedShoes.reduce((acc, s) => acc + s.totalDist, 0),
    [processedShoes]
  );
  const inUseCount = useMemo(
    () => processedShoes.filter((s) => (s as unknown as Record<string, unknown>)["Status"] === "In Use").length,
    [processedShoes]
  );

  const filtered = useMemo(() => {
    const base = statusFilter === "All"
      ? processedShoes
      : processedShoes.filter((s) => {
          const raw = s as unknown as Record<string, unknown>;
          return String(raw["Status"] || "") === statusFilter;
        });

    return [...base].sort((a, b) => {
      let av = 0, bv = 0;
      const ra = a as unknown as Record<string, unknown>;
      const rb = b as unknown as Record<string, unknown>;
      if (sortKey === "status") {
        const order: Record<string, number> = { "In Use": 1, "Not Yet Opened": 2, "Retired": 3 };
        av = order[String(ra["Status"] || "")] || 9;
        bv = order[String(rb["Status"] || "")] || 9;
      } else if (sortKey === "dist") {
        av = a.totalDist; bv = b.totalDist;
      } else if (sortKey === "sessions") {
        av = a.usageCount; bv = b.usageCount;
      } else if (sortKey === "price") {
        av = a.parsedPrice; bv = b.parsedPrice;
      } else if (sortKey === "costperkm") {
        av = a.costPerKm || 0; bv = b.costPerKm || 0;
      } else if (sortKey === "purchase") {
        const da = String(ra["Purchase Date"] || "");
        const db = String(rb["Purchase Date"] || "");
        av = da ? new Date(da).getTime() : 0;
        bv = db ? new Date(db).getTime() : 0;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [processedShoes, statusFilter, sortKey, sortDir]);

  return (
    <div className="space-y-5">
      {/* ── Summary stats ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display font-700 text-2xl text-foreground">{processedShoes.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Shoes</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display font-700 text-2xl text-emerald-600">{inUseCount}</p>
          <p className="text-xs text-muted-foreground mt-1">In Rotation</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display font-700 text-2xl text-amber-600">HK${totalSpend.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Investment</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="font-display font-700 text-2xl text-primary">{totalDist.toFixed(0)} km</p>
          <p className="text-xs text-muted-foreground mt-1">Total Distance Run</p>
        </div>
      </div>

      {/* ── Controls bar ────────────────────────────────────── */}
      <div className="glass-card rounded-xl p-3 flex flex-wrap items-center gap-2">
        {/* Status filter */}
        <div className="flex gap-1.5 shrink-0">
          {["All", "In Use", "Not Yet Opened", "Retired"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                statusFilter === s
                  ? "bg-primary/15 text-primary border-primary/40"
                  : "bg-white border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border hidden sm:block" />

        {/* Sort chips */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mr-1">Sort:</span>
          {SORT_OPTIONS.map(({ key, label, icon: Icon }) => {
            const active = sortKey === key;
            return (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border",
                  active
                    ? "bg-primary/15 text-primary border-primary/40"
                    : "bg-white text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
                {active
                  ? sortDir === "asc"
                    ? <ChevronUp className="w-3 h-3" />
                    : <ChevronDown className="w-3 h-3" />
                  : <ChevronsUpDown className="w-3 h-3 opacity-40" />}
              </button>
            );
          })}
        </div>

        <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
          {filtered.length} shoe{filtered.length !== 1 ? "s" : ""} · Click a card to view activities
        </span>
      </div>

      {/* ── Shoe cards grid ─────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground text-sm">
          No shoes found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((shoe, i) => {
            const raw = shoe as unknown as Record<string, unknown>;
            const fullName = String(raw["Shoes Name"] || raw["Shoes"] || "Unknown");
            const brand = String(raw["Shoes Brand"] || "");
            const shortName = brand && fullName.startsWith(brand)
              ? fullName.slice(brand.length).trim()
              : fullName;
            const status = String(raw["Status"] || "Unknown");
            const photoUrl = String(raw["ItemPhoto"] || "");
            const distPct = Math.min((shoe.totalDist / MAX_SHOE_DIST) * 100, 100);
            const isWarning = shoe.totalDist > MAX_SHOE_DIST * 0.8 && status === "In Use";

            return (
              <div
                key={i}
                className={cn(
                  "glass-card rounded-xl border overflow-hidden transition-all cursor-pointer",
                  "hover:shadow-lg hover:-translate-y-1 hover:border-primary/40",
                  isWarning ? "border-orange-300" : "border-border"
                )}
                onClick={() => setSelectedShoe({ name: fullName, photo: photoUrl })}
                title="Click to view all activities with this shoe"
              >
                {/* ── Photo section ─────────────────────────── */}
                <div className="relative h-44 bg-secondary/50 overflow-hidden">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={fullName}
                      className="w-full h-full object-contain p-3 transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Status badge + edit/delete overlay */}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                      STATUS_COLORS[status] || "bg-slate-100 text-slate-500 border-slate-300"
                    )}>
                      {status}
                    </span>
                    {/* Edit button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditShoe(raw); }}
                      className="p-1 rounded-lg bg-white/80 hover:bg-white text-blue-500 hover:text-blue-700 shadow transition-colors"
                      title="Edit shoe"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteShoe(raw); }}
                      className="p-1 rounded-lg bg-white/80 hover:bg-white text-red-400 hover:text-red-600 shadow transition-colors"
                      title="Delete shoe"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Photo link — stop propagation so it doesn't open the popup */}
                  {photoUrl && (
                    <a
                      href={photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-white/70 text-muted-foreground hover:text-foreground hover:bg-white transition-all"
                      title="View full photo"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {/* Warning overlay */}
                  {isWarning && (
                    <div className="absolute bottom-0 left-0 right-0 bg-orange-100/90 backdrop-blur-sm px-3 py-1.5 text-[10px] text-orange-700 text-center font-medium">
                      ⚠ Approaching {MAX_SHOE_DIST} km retirement
                    </div>
                  )}

                  {/* "View activities" hint */}
                  <div className="absolute inset-0 bg-primary/0 hover:bg-primary/5 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <span className="bg-white/90 text-primary text-[10px] font-semibold px-3 py-1.5 rounded-full shadow">
                      View {shoe.usageCount} activities →
                    </span>
                  </div>
                </div>

                {/* ── Card body ─────────────────────────────── */}
                <div className="p-4 space-y-3">
                  {/* Name + brand */}
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{brand}</p>
                    <p className="font-display font-600 text-foreground text-sm leading-snug mt-0.5">{shortName}</p>
                  </div>

                  {/* Distance progress bar */}
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">Distance used</span>
                      <span className={cn("font-mono-metric font-600", isWarning ? "text-orange-600" : "text-foreground")}>
                        {shoe.totalDist.toFixed(1)} km
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          distPct > 80 ? "bg-orange-500" : distPct > 50 ? "bg-amber-500" : "bg-primary"
                        )}
                        style={{ width: `${distPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                      <span>0 km</span>
                      <span>{MAX_SHOE_DIST} km</span>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <StatCell label="Sessions" value={String(shoe.usageCount)} />
                    <StatCell
                      label="Price"
                      value={shoe.parsedPrice > 0 ? `HK$${shoe.parsedPrice.toLocaleString()}` : "—"}
                      color="text-amber-600"
                    />
                    <StatCell
                      label="$/km"
                      value={shoe.costPerKm > 0 ? `$${shoe.costPerKm.toFixed(2)}` : "—"}
                      color="text-emerald-600"
                    />
                  </div>

                  {/* Dates */}
                  <div className="pt-2 border-t border-border space-y-1">
                    {!!raw["Purchase Date"] && (
                      <DateRow icon={Calendar} label="Purchased" value={formatDateDisplay(String(raw["Purchase Date"]))} />
                    )}
                    {!!raw["First Use"] && (
                      <DateRow icon={Activity} label="First Use" value={formatDateDisplay(String(raw["First Use"]))} />
                    )}
                    {!!raw["Retired Date"] && (
                      <DateRow icon={ShoppingBag} label="Retired" value={formatDateDisplay(String(raw["Retired Date"]))} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shoe Activity History Modal */}
      <ShoeHistoryModal
        shoeName={selectedShoe?.name ?? null}
        photoUrl={selectedShoe?.photo ?? ""}
        onClose={() => setSelectedShoe(null)}
      />

      {/* Edit Modal */}
      <EditRecordModal
        open={!!editShoe}
        onClose={() => setEditShoe(null)}
        onSave={handleEditSave}
        loading={editLoading}
        title="Edit Shoe"
        fields={SHOE_FIELDS}
        initialValues={editShoe || {}}
      />

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={!!deleteShoe}
        onClose={() => setDeleteShoe(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Delete Shoe"
        recordLabel={deleteShoe ? String(deleteShoe["Shoes Name"] || "this shoe") : undefined}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-secondary rounded-lg px-2 py-2 text-center">
      <p className="text-[9px] text-muted-foreground mb-0.5">{label}</p>
      <p className={cn("font-mono-metric text-xs font-600", color || "text-foreground")}>{value}</p>
    </div>
  );
}

function DateRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <Icon className="w-3 h-3 shrink-0" />
      <span>{label}:</span>
      <span className="text-foreground/70">{value}</span>
    </div>
  );
}
