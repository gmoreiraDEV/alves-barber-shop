"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function getVariantClasses(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";
    case "error":
      return "border-red-500/40 bg-red-500/10 text-red-200";
    default:
      return "border-amber-500/40 bg-amber-500/10 text-amber-100";
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      window.clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "info" }: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((current) => [...current, { id, title, description, variant }]);
      const timeout = window.setTimeout(() => removeToast(id), 4500);
      timeoutsRef.current.set(id, timeout);
    },
    [removeToast]
  );

  useEffect(() => {
    return () => {
      for (const timeout of timeoutsRef.current.values()) {
        window.clearTimeout(timeout);
      }
      timeoutsRef.current.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-[60] flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur ${getVariantClasses(
              item.variant ?? "info"
            )}`}
          >
            <div className="text-sm font-semibold">{item.title}</div>
            {item.description ? (
              <div className="text-xs text-stone-200/80 mt-1">{item.description}</div>
            ) : null}
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="mt-2 text-[10px] uppercase tracking-widest text-stone-200/70 hover:text-stone-100"
            >
              Fechar
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
