import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DayFocus } from "./DayFocus";

describe("DayFocus", () => {
  it("shows empty message when no files", () => {
    render(<DayFocus focus={{ week: 2, day: 1, files: [] }} />);
    expect(screen.getByText(/no content files found/i)).toBeInTheDocument();
  });

  it("renders single file without tabs", () => {
    render(
      <DayFocus
        focus={{
          week: 2,
          day: 1,
          files: [{ name: "lesson.md", content: "# Body" }],
        }}
      />,
    );
    expect(screen.getByText(/week 2 day 1/i)).toBeInTheDocument();
    expect(screen.getByText("lesson.md")).toBeInTheDocument();
    expect(screen.getByText("# Body")).toBeInTheDocument();
  });

  it("switches tabs when multiple files", () => {
    render(
      <DayFocus
        focus={{
          week: 1,
          day: 2,
          files: [
            { name: "a.md", content: "A" },
            { name: "b.md", content: "B" },
          ],
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "b.md" }));
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("defaults to README.md tab when present among other files", () => {
    render(
      <DayFocus
        focus={{
          week: 1,
          day: 2,
          files: [
            { name: "lesson.md", content: "LESSON BODY" },
            { name: "README.md", content: "README BODY" },
          ],
        }}
      />,
    );
    expect(screen.getByText("README BODY")).toBeInTheDocument();
    expect(screen.queryByText("LESSON BODY")).not.toBeInTheDocument();
  });

  it("updates scroll region height when reading area slider changes", () => {
    render(
      <DayFocus
        focus={{
          week: 2,
          day: 1,
          files: [{ name: "lesson.md", content: "# Body" }],
        }}
      />,
    );
    const slider = screen.getByRole("slider", {
      name: /reading area height in pixels/i,
    });
    const scroll = document.querySelector(".day-focus-scroll");
    expect(scroll).toBeTruthy();
    fireEvent.change(slider, { target: { value: "600" } });
    expect(scroll).toHaveStyle({ height: "600px" });
  });
});
