import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import App from "./App";
import { getDayGuidance } from "./data/days";
import {
  STORAGE_INTRO_DISMISSED_V1,
  STORAGE_UPSTREAM,
  STORAGE_WORKSPACE,
} from "./constants/storage";

vi.mock("./hooks/useDayGuidance", () => ({
  useDayGuidance: vi.fn(),
}));

vi.mock("./hooks/useDayFocus", () => ({
  useDayFocus: vi.fn(),
}));

import { useDayGuidance } from "./hooks/useDayGuidance";
import { useDayFocus } from "./hooks/useDayFocus";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_INTRO_DISMISSED_V1, "1");
    vi.mocked(useDayFocus).mockReturnValue(null);
    vi.mocked(useDayGuidance).mockReturnValue(getDayGuidance(2, 4));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders guidance panel when day focus is unavailable", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /githubbuddy/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/step-by-step checklist/i)).toBeInTheDocument();
  });

  it("renders DayFocus when hook returns content", () => {
    vi.mocked(useDayFocus).mockReturnValue({
      week: 2,
      day: 4,
      files: [{ name: "lesson.md", content: "# L" }],
    });
    render(<App />);
    expect(screen.getByText("# L")).toBeInTheDocument();
  });

  it("shows no-guidance copy when guidance is missing", () => {
    vi.mocked(useDayGuidance).mockReturnValue(undefined);
    render(<App />);
    expect(screen.getByText(/no guidance available/i)).toBeInTheDocument();
  });

  it("header badge shows selected week and day even when guidance is missing", () => {
    vi.mocked(useDayGuidance).mockReturnValue(undefined);
    render(<App />);
    expect(
      within(screen.getByRole("banner")).getByText("Week 2 Day 4"),
    ).toBeInTheDocument();
  });

  it("continues when localStorage.setItem throws for workspace only", async () => {
    const orig = Storage.prototype.setItem;
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(function (this: Storage, key: string, value: string) {
        if (key === STORAGE_WORKSPACE) throw new Error("quota");
        return orig.call(this, key, value);
      });
    render(<App />);
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("/tmp/fork");
    fireEvent.click(
      screen.getByRole("button", { name: /choose workspace folder/i }),
    );
    await vi.waitFor(() => {
      expect(screen.getAllByText("/tmp/fork").length).toBeGreaterThan(0);
    });
    setItemSpy.mockRestore();
    promptSpy.mockRestore();
  });

  it("persists workspace path to localStorage when set", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    render(<App />);
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("/tmp/fork");
    fireEvent.click(
      screen.getByRole("button", { name: /choose workspace folder/i }),
    );
    await vi.waitFor(() => {
      expect(setItem).toHaveBeenCalledWith(
        "githubbuddy-workspace",
        "/tmp/fork",
      );
    });
    promptSpy.mockRestore();
  });

  it("updates selected day when the day dropdown changes", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/select day of the week/i), {
      target: { value: "3" },
    });
    expect(screen.getByLabelText(/select day of the week/i)).toHaveValue("3");
  });

  it("persists upstream path and removes it from localStorage when cleared", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const removeItem = vi.spyOn(Storage.prototype, "removeItem");
    render(<App />);

    fireEvent.change(
      screen.getByLabelText(/upstream course repository path/i),
      {
        target: { value: "/tmp/course-clone" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: /^save path$/i }));

    await vi.waitFor(() => {
      expect(setItem).toHaveBeenCalledWith(
        STORAGE_UPSTREAM,
        "/tmp/course-clone",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: /^clear$/i }));

    await vi.waitFor(() => {
      expect(removeItem).toHaveBeenCalledWith(STORAGE_UPSTREAM);
    });
  });
});

describe("App first-run intro", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useDayFocus).mockReturnValue(null);
    vi.mocked(useDayGuidance).mockReturnValue(getDayGuidance(2, 4));
  });

  it("shows process intro dialog when not dismissed", () => {
    render(<App />);
    expect(
      screen.getByRole("dialog", { name: /how githubbuddy works/i }),
    ).toBeInTheDocument();
  });

  it("closes intro and persists dismiss on Got it", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^got it$/i }));
    expect(localStorage.getItem(STORAGE_INTRO_DISMISSED_V1)).toBe("1");
    expect(
      screen.queryByRole("dialog", { name: /how githubbuddy works/i }),
    ).not.toBeInTheDocument();
  });

  it("reopens from footer without clearing dismiss flag", () => {
    localStorage.setItem(STORAGE_INTRO_DISMISSED_V1, "1");
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: /how this works/i }),
    );
    expect(
      screen.getByRole("dialog", { name: /how githubbuddy works/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^got it$/i }));
    expect(localStorage.getItem(STORAGE_INTRO_DISMISSED_V1)).toBe("1");
  });
});
