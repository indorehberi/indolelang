'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Toast from '../components/ui/Toast';
import { registerToastHandler } from '../lib/api';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Toast.tsx's variant classes are alert-box {info|success|warning|danger}.
const VARIANT_TO_CLASS: Record<ToastVariant, 'info' | 'success' | 'warning' | 'danger'> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'danger',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, variant: ToastVariant = 'info', duration = 4000) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, variant, duration }]);
  }, []);

  useEffect(() => {
    registerToastHandler(show);
    return () => registerToastHandler(null);
  }, [show]);

  const value: ToastContextValue = {
    show,
    success: (message, duration) => show(message, 'success', duration),
    error: (message, duration) => show(message, 'error', duration),
    warning: (message, duration) => show(message, 'warning', duration),
    info: (message, duration) => show(message, 'info', duration),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.map((t, index) => (
        <Toast
          key={t.id}
          message={t.message}
          variant={VARIANT_TO_CLASS[t.variant]}
          duration={t.duration}
          onClose={() => dismiss(t.id)}
          style={{ top: `${16 + index * 64}px` }}
        />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
