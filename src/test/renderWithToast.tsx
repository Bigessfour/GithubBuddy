import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { ToastTestWrapper } from "./ToastTestWrapper";

/** RTL render with the same ToastProvider wrapper the app uses. */
export function renderWithToast(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { ...options, wrapper: ToastTestWrapper });
}
