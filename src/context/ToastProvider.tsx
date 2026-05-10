import { useCallback, useId, useMemo, useState, type ReactNode } from "react";
import { ToastContext, type ToastVariant } from "./toast-context";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

const TOAST_DURATION_MS = 6500;
const MAX_TOASTS = 3;

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const regionId = useId();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = makeId();
      setToasts((prev) => {
        const next = [...prev, { id, message, variant }];
        return next.slice(-MAX_TOASTS);
      });
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        id={regionId}
        role="region"
        className="toast-region"
        aria-label="Notifications"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`toast toast-${t.variant}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
