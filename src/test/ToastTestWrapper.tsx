import type { ReactNode } from "react";
import { ToastProvider } from "../context/ToastProvider";

export function ToastTestWrapper({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
