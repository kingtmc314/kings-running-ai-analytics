// =============================================================
// DeleteConfirmDialog — Reusable delete confirmation modal
// Light theme, used across all record tabs
// =============================================================
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
  title?: string;
  description?: string;
  recordLabel?: string;
}

export default function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  loading,
  title = "Delete Record",
  description,
  recordLabel,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !loading) onClose(); }}>
      <DialogContent className="max-w-sm bg-white border border-slate-200 shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-slate-800 font-display font-700 text-base">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-600 text-sm leading-relaxed pl-[52px]">
            {description || (
              <>
                Are you sure you want to delete{" "}
                {recordLabel ? (
                  <span className="font-semibold text-slate-800">"{recordLabel}"</span>
                ) : (
                  "this record"
                )}
                ? This action will permanently remove it from Google Sheets and{" "}
                <span className="text-red-600 font-medium">cannot be undone</span>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 justify-end mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white border-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
