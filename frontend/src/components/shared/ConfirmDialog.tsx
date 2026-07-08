import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    if (open) { document.addEventListener("keydown", handler); return () => document.removeEventListener("keydown", handler); }
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-lg bg-surface p-6 shadow-modal">
        <div className="flex items-start gap-4">
          <div
            className={`rounded-full p-2 ${variant === "danger" ? "bg-semantic-danger-soft" : "bg-semantic-warning-soft"}`}
          >
            <AlertTriangle
              className={`h-5 w-5 ${variant === "danger" ? "text-semantic-danger" : "text-semantic-warning"}`}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <p className="mt-1 text-sm text-secondary">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-md border border-default px-4 py-2 text-sm font-medium text-secondary hover:bg-hover transition-colors duration-fast"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-colors duration-fast disabled:opacity-50 ${
              variant === "danger"
                ? "bg-semantic-danger hover:bg-red-700"
                : "bg-semantic-warning hover:bg-amber-700"
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
