import { createContext } from "react";

export type ToastVariant = "info" | "success" | "error";

export type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
