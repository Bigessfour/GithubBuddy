import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProcessIntroModal } from "./ProcessIntroModal";
import { STORAGE_INTRO_DISMISSED_V1 } from "../constants/storage";

describe("ProcessIntroModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("writes dismiss flag when Got it and persistDismissOnClose", () => {
    const onClose = vi.fn();
    render(
      <ProcessIntroModal
        open
        persistDismissOnClose
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^got it$/i }));
    expect(localStorage.getItem(STORAGE_INTRO_DISMISSED_V1)).toBe("1");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not write dismiss flag when replaying (persistDismissOnClose false)", () => {
    const onClose = vi.fn();
    render(
      <ProcessIntroModal
        open
        persistDismissOnClose={false}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^got it$/i }));
    expect(localStorage.getItem(STORAGE_INTRO_DISMISSED_V1)).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape triggers close with same persistence rules", () => {
    const onClose = vi.fn();
    render(
      <ProcessIntroModal
        open
        persistDismissOnClose={false}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when closed", () => {
    render(
      <ProcessIntroModal
        open={false}
        persistDismissOnClose
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("dialog", { name: /how githubbuddy works/i }),
    ).not.toBeInTheDocument();
  });
});
