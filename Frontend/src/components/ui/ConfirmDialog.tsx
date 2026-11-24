"use client";

import { useEffect } from "react";
import { AlertTriangle, Loader2, RotateCcw, Trash2, X } from "lucide-react";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  icon?: "trash" | "warning" | "reset";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  icon = "trash",
  loading = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#090D16]/45 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={() => {
        if (!loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white border border-[#DADDD4] shadow-[0_24px_60px_-15px_rgba(9,13,22,0.28)] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${
                isDanger
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "bg-[#F7F4FC] border-[#2e1065]/15 text-[#2e1065]"
              }`}
            >
              {icon === "trash" ? (
                <Trash2 className="w-5 h-5" />
              ) : icon === "reset" ? (
                <RotateCcw className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              aria-label="Close dialog"
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <h3
              id="confirm-dialog-title"
              className="font-display text-lg font-bold text-[#090D16] tracking-tight"
            >
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-[#525B6C] leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#FAF9F5] border-t border-[#DADDD4] flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#DADDD4] text-xs font-semibold text-[#090D16] transition cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl text-xs font-display font-bold text-white transition inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#2e1065] hover:bg-[#3b0764]"
            }`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
