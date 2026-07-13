"use client";

import { ReactNode } from "react";

interface ResponsiveModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Tailwind max-width class applied from the `sm` breakpoint up. */
  maxWidthClassName?: string;
}

// Bottom sheet on mobile (slides up from the bottom edge), centered dialog
// on desktop (sm and up) — same content, native-appropriate presentation
// per viewport.
export default function ResponsiveModal({
  open,
  onClose,
  children,
  maxWidthClassName = "sm:max-w-[440px]",
}: ResponsiveModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div
        className={`bg-white w-full ${maxWidthClassName} rounded-t-3xl sm:rounded-3xl border border-outline-variant/60 shadow-2xl p-6 relative max-h-[92vh] sm:max-h-[95vh] overflow-y-auto overscroll-contain custom-scrollbar animate-slide-up-sheet sm:animate-fade-in-up`}
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-variant/40 rounded-full p-1.5 transition-all bg-white z-10"
        >
          <span className="material-symbols-outlined text-2xl font-bold">close</span>
        </button>
        {children}
      </div>
    </div>
  );
}
