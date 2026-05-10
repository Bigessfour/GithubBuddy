import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { DaySelector } from "./DaySelector";
import { renderWithToast } from "../test/renderWithToast";
import { DEFAULT_UPSTREAM_REPO } from "../utils/upstreamRepoUrl";

const mockHasLocal = vi.fn();
const mockGetWeeks = vi.fn();

vi.mock("../utils/courseScanner", () => ({
  getLocalCourseScan: () => ({
    bridgeActive: true,
    hasLocal: mockHasLocal(),
    weeks: mockGetWeeks(),
  }),
}));

describe("DaySelector", () => {
  const onChange = vi.fn();

  beforeEach(() => {
    delete (window as Window & { electronAPI?: unknown }).electronAPI;
    mockHasLocal.mockReturnValue(false);
    mockGetWeeks.mockReturnValue([]);
    onChange.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as Window & { electronAPI?: unknown }).electronAPI;
  });

  it("uses default weeks/days when no local content", () => {
    renderWithToast(
      <DaySelector selectedWeek={2} selectedDay={3} onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText(/select course week/i), {
      target: { value: "3" },
    });
    expect(onChange).toHaveBeenCalledWith(3, 3);
  });

  it("when local content exists, week change snaps to first day of that week", () => {
    mockHasLocal.mockReturnValue(true);
    mockGetWeeks.mockReturnValue([
      { week: 2, days: [1, 2] },
      { week: 4, days: [5] },
    ]);
    renderWithToast(
      <DaySelector selectedWeek={2} selectedDay={2} onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText(/select course week/i), {
      target: { value: "4" },
    });
    expect(onChange).toHaveBeenCalledWith(4, 5);
  });

  it("falls back to defaults when scan returns empty weeks", () => {
    mockHasLocal.mockReturnValue(true);
    mockGetWeeks.mockReturnValue([]);
    renderWithToast(
      <DaySelector selectedWeek={2} selectedDay={2} onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText(/select day of the week/i), {
      target: { value: "4" },
    });
    expect(onChange).toHaveBeenCalledWith(2, 4);
  });

  it("shows local content notice when scan has weeks", () => {
    mockHasLocal.mockReturnValue(true);
    mockGetWeeks.mockReturnValue([{ week: 2, days: [1] }]);
    renderWithToast(
      <DaySelector selectedWeek={2} selectedDay={1} onChange={onChange} />,
    );
    expect(
      screen.getByText(/using local course content from/i),
    ).toBeInTheDocument();
  });

  it("fetch upstream: success updates status", async () => {
    const fetchUpstreamRepo = vi
      .fn()
      .mockResolvedValue({ success: true, message: "Done" });
    window.electronAPI = {
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      executeCommand: vi.fn(),
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo,
      onUpstreamStatus: vi.fn((cb: (m: { message: string }) => void) => {
        cb({ message: "Cloning" });
        return () => {};
      }),
    };
    mockHasLocal.mockReturnValue(false);
    renderWithToast(
      <DaySelector selectedWeek={2} selectedDay={2} onChange={onChange} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /fetch upstream repo data/i }),
    );
    expect(await screen.findByText(/done/i)).toBeInTheDocument();
    expect(fetchUpstreamRepo).toHaveBeenCalledWith(DEFAULT_UPSTREAM_REPO);
  });

  it("fetch upstream: rejects non-GitHub URL and does not call IPC", async () => {
    const fetchUpstreamRepo = vi.fn();
    window.electronAPI = {
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      executeCommand: vi.fn(),
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo,
      onUpstreamStatus: vi.fn(() => () => {}),
    };
    renderWithToast(
      <DaySelector selectedWeek={2} selectedDay={2} onChange={onChange} />,
    );
    fireEvent.change(
      screen.getByLabelText(/github url for course upstream/i),
      {
        target: { value: "https://gitlab.com/acme/course.git" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: /fetch upstream repo data/i }),
    );
    await waitFor(() => {
      const line = document.querySelector(".fetch-status-line");
      expect(line?.textContent).toMatch(
        /only github\.com repository urls are allowed/i,
      );
    });
    expect(fetchUpstreamRepo).not.toHaveBeenCalled();
  });

  it("fetch upstream: accepts custom GitHub HTTPS URL", async () => {
    const custom = "https://github.com/student/my-fork.git";
    const fetchUpstreamRepo = vi
      .fn()
      .mockResolvedValue({ success: true, message: "Cloned" });
    window.electronAPI = {
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      executeCommand: vi.fn(),
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo,
      onUpstreamStatus: vi.fn(() => () => {}),
    };
    renderWithToast(
      <DaySelector selectedWeek={2} selectedDay={2} onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText(/github url for course upstream/i), {
      target: { value: custom },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /fetch upstream repo data/i }),
    );
    await waitFor(() => expect(fetchUpstreamRepo).toHaveBeenCalledWith(custom));
  });

  it("shows course layout alert in desktop mode when clone has no week/day folders", () => {
    window.electronAPI = {
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      executeCommand: vi.fn(),
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo: vi.fn(),
    };
    mockHasLocal.mockReturnValue(true);
    mockGetWeeks.mockReturnValue([]);
    renderWithToast(
      <DaySelector selectedWeek={2} selectedDay={2} onChange={onChange} />,
    );
    expect(
      screen.getByText(/Course folder found, but no week\/day lessons detected/i),
    ).toBeInTheDocument();
  });

  it("fetch upstream: FETCH_FAILED toast includes GitHub auth guidance", async () => {
    window.electronAPI = {
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      executeCommand: vi.fn(),
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo: vi.fn().mockResolvedValue({
        success: false,
        error: "git exited 1",
        code: "FETCH_FAILED",
      }),
      onUpstreamStatus: vi.fn(() => () => {}),
    };
    renderWithToast(
      <DaySelector selectedWeek={2} selectedDay={2} onChange={onChange} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /fetch upstream repo data/i }),
    );
    expect(
      await screen.findByText(/Git could not update the course repo/i),
    ).toBeInTheDocument();
  });

  it("fetch upstream: GH_CLI_MISSING shows install-gh toast copy", async () => {
    window.electronAPI = {
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      executeCommand: vi.fn(),
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo: vi.fn().mockResolvedValue({
        success: false,
        error: "GitHub CLI (gh) is not installed.",
        code: "GH_CLI_MISSING",
      }),
      onUpstreamStatus: vi.fn(() => () => {}),
    };
    renderWithToast(
      <DaySelector selectedWeek={2} selectedDay={2} onChange={onChange} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /fetch upstream repo data/i }),
    );
    expect(
      await screen.findByText(/cli\.github\.com/i),
    ).toBeInTheDocument();
  });

  it("fetch upstream: shows error on failure", async () => {
    window.electronAPI = {
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      executeCommand: vi.fn(),
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo: vi
        .fn()
        .mockResolvedValue({ success: false, error: "nope" }),
      onUpstreamStatus: vi.fn(() => () => {}),
    };
    renderWithToast(
      <DaySelector selectedWeek={2} selectedDay={2} onChange={onChange} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /fetch upstream repo data/i }),
    );
    expect(await screen.findByText(/error: nope/i)).toBeInTheDocument();
  });

  it("fetch upstream: success without message uses default copy", async () => {
    window.electronAPI = {
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      executeCommand: vi.fn(),
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo: vi.fn().mockResolvedValue({ success: true }),
      onUpstreamStatus: vi.fn((cb: (m: { message: string }) => void) => {
        cb({ message: "" });
        return () => {};
      }),
    };
    renderWithToast(
      <DaySelector selectedWeek={2} selectedDay={2} onChange={onChange} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /fetch upstream repo data/i }),
    );
    await waitFor(() => {
      const line = document.querySelector(".fetch-status-line");
      expect(line?.textContent).toMatch(/course content updated/i);
    });
  });

  it("fetch upstream: failure without error shows unknown", async () => {
    window.electronAPI = {
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      executeCommand: vi.fn(),
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo: vi.fn().mockResolvedValue({ success: false }),
      onUpstreamStatus: vi.fn(() => () => {}),
    };
    renderWithToast(
      <DaySelector selectedWeek={2} selectedDay={2} onChange={onChange} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /fetch upstream repo data/i }),
    );
    expect(await screen.findByText(/unknown error/i)).toBeInTheDocument();
  });

  it("fetch upstream: catch path", async () => {
    window.electronAPI = {
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      executeCommand: vi.fn(),
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo: vi.fn().mockRejectedValue(new Error("network")),
      onUpstreamStatus: vi.fn(() => () => {}),
    };
    renderWithToast(
      <DaySelector selectedWeek={2} selectedDay={2} onChange={onChange} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /fetch upstream repo data/i }),
    );
    expect(await screen.findByText(/failed: network/i)).toBeInTheDocument();
  });

  it("fetch upstream: progress bar reflects git percent from IPC", async () => {
    const fetchUpstreamRepo = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () => resolve({ success: true, message: "OK" }),
            30,
          );
        }),
    );
    window.electronAPI = {
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      executeCommand: vi.fn(),
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo,
      onUpstreamStatus: vi.fn(
        (cb: (m: { message: string; percent?: number }) => void) => {
          queueMicrotask(() =>
            cb({ message: "Receiving objects:  42%", percent: 42 }),
          );
          return () => {};
        },
      ),
    };
    mockHasLocal.mockReturnValue(false);
    renderWithToast(
      <DaySelector selectedWeek={2} selectedDay={2} onChange={onChange} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /fetch upstream repo data/i }),
    );
    await waitFor(() => {
      const bar = document.querySelector(
        ".fetch-progress-bar",
      ) as HTMLProgressElement;
      expect(bar?.value).toBe(42);
    });
    expect(screen.getByText("42%")).toBeInTheDocument();
  });
});
