// =============================================================
// EditRecordModal — Generic edit form modal
// Accepts field definitions and renders appropriate inputs
// Light theme, used across all record tabs
// =============================================================
import { useState, useEffect } from "react";
import { Loader2, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  options?: string[];   // for type === "select"
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
}

interface EditRecordModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, string>) => Promise<void>;
  loading: boolean;
  title: string;
  fields: FieldDef[];
  initialValues: Record<string, unknown>;
}

export default function EditRecordModal({
  open,
  onClose,
  onSave,
  loading,
  title,
  fields,
  initialValues,
}: EditRecordModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  // Populate form when modal opens or record changes
  useEffect(() => {
    if (open) {
      const init: Record<string, string> = {};
      fields.forEach((f) => {
        const v = initialValues[f.key];
        init[f.key] = v !== undefined && v !== null ? String(v) : "";
      });
      setValues(init);
    }
  }, [open, initialValues, fields]);

  function set(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    await onSave(values);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !loading) onClose(); }}>
      <DialogContent className="max-w-lg bg-white border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-slate-800 font-display font-700 text-base">
              {title}
            </DialogTitle>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-1">
          {fields.map((f) => (
            <div
              key={f.key}
              className={cn(
                "flex flex-col gap-1",
                f.type === "textarea" && "col-span-2"
              )}
            >
              <Label className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                {f.label}
                {f.required && <span className="text-red-500 ml-0.5">*</span>}
              </Label>

              {f.type === "select" ? (
                <Select
                  value={values[f.key] || ""}
                  onValueChange={(v) => set(f.key, v)}
                  disabled={loading || f.readOnly}
                >
                  <SelectTrigger className="h-8 text-sm border-slate-200 bg-white text-slate-800">
                    <SelectValue placeholder={f.placeholder || `Select ${f.label}`} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 z-[200]">
                    {f.options?.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-slate-800">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === "textarea" ? (
                <textarea
                  value={values[f.key] || ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  disabled={loading || f.readOnly}
                  placeholder={f.placeholder}
                  rows={3}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none disabled:opacity-50"
                />
              ) : (
                <Input
                  type={f.type}
                  value={values[f.key] || ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  disabled={loading || f.readOnly}
                  placeholder={f.placeholder}
                  className="h-8 text-sm border-slate-200 bg-white text-slate-800 placeholder:text-slate-400"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white border-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
