import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToastProvider } from "./ToastProvider";
import { useToast } from "./useToast";

function ShowToastButton({ message }: { message: string }) {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast(message)}>
      go
    </button>
  );
}

describe("ToastProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a toast when showToast is called", () => {
    render(
      <ToastProvider>
        <ShowToastButton message="Saved" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /go/i }));
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("uses non-UUID ids when crypto.randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", {});

    render(
      <ToastProvider>
        <ShowToastButton message="fallback-id" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /go/i }));
    expect(screen.getByText("fallback-id")).toBeInTheDocument();
  });
});
