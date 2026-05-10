import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressTracker } from "./ProgressTracker";
import type { Step } from "../types";

const steps: Step[] = [
  { id: "s1", title: "a", why: "w", command: "c", category: "git" },
  { id: "s2", title: "b", why: "w", command: "c", category: "git" },
];

describe("ProgressTracker", () => {
  it("shows 0% when no steps", () => {
    render(<ProgressTracker steps={[]} completedSteps={new Set()} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText(/0 of 0 steps/)).toBeInTheDocument();
  });

  it("computes percent and count", () => {
    render(<ProgressTracker steps={steps} completedSteps={new Set(["s1"])} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 steps/)).toBeInTheDocument();
  });
});
