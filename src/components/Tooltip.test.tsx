import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import type { ReactElement } from "react";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("shows on focus and hides on Escape per keyboard expectation", () => {
    render(
      <Tooltip text="Extra help for this control">
        <button type="button">Action</button>
      </Tooltip>,
    );
    const btn = screen.getByRole("button", { name: /action/i });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.focus(btn);
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Extra help for this control",
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("renders children only when disabled (no tooltip on inert controls)", () => {
    render(
      <Tooltip text="Should not show" disabled>
        <button type="button">Busy</button>
      </Tooltip>,
    );
    fireEvent.focus(screen.getByRole("button", { name: /busy/i }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("rejects non-element children", () => {
    expect(() =>
      render(<Tooltip text="nope">{null as unknown as ReactElement}</Tooltip>),
    ).toThrow(/single React element child/);
  });

  it("shows on hover and hides after the leave delay", async () => {
    vi.useFakeTimers();
    render(
      <Tooltip text="Hover help">
        <button type="button">Go</button>
      </Tooltip>,
    );
    const btn = screen.getByRole("button", { name: /go/i });
    const anchor = btn.closest(".tooltip-anchor");
    expect(anchor).toBeTruthy();
    fireEvent.mouseEnter(anchor!);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Hover help");
    fireEvent.mouseLeave(anchor!);
    await act(async () => {
      vi.advanceTimersByTime(120);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
