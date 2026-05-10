import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, screen, fireEvent } from "@testing-library/react";
import { StepCard } from "./StepCard";
import type { Step } from "../types";
import { renderWithToast } from "../test/renderWithToast";
import { workspaceFolderIpcStubs } from "../test/workspaceFolderIpcStubs";

const sampleStep: Step = {
  id: "s1",
  title: "Test step",
  why: "Because",
  command: "git status",
  category: "git",
};

describe("StepCard", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as Window & { electronAPI?: unknown }).electronAPI;
  });

  it("shows Run when workspace is set and command is not a comment", () => {
    delete (window as Window & { electronAPI?: unknown }).electronAPI;
    renderWithToast(
      <StepCard
        step={sampleStep}
        resolvedCommand="git status"
        isCompleted={false}
        onToggleComplete={vi.fn()}
        workspacePath="/repo"
      />,
    );
    expect(
      screen.getByRole("button", { name: /run command/i }),
    ).toBeInTheDocument();
  });

  it("hides Run without workspace", () => {
    renderWithToast(
      <StepCard
        step={sampleStep}
        resolvedCommand="git status"
        isCompleted={false}
        onToggleComplete={vi.fn()}
        workspacePath={null}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /run command/i }),
    ).not.toBeInTheDocument();
  });

  it("hides Run for comment-only resolved commands", () => {
    renderWithToast(
      <StepCard
        step={sampleStep}
        resolvedCommand="# editorial"
        isCompleted={false}
        onToggleComplete={vi.fn()}
        workspacePath="/repo"
      />,
    );
    expect(
      screen.queryByRole("button", { name: /run command/i }),
    ).not.toBeInTheDocument();
  });

  it("displays resolved command text", () => {
    renderWithToast(
      <StepCard
        step={sampleStep}
        resolvedCommand="git status -sb"
        isCompleted={false}
        onToggleComplete={vi.fn()}
        workspacePath={null}
      />,
    );
    expect(screen.getByText("git status -sb")).toBeInTheDocument();
  });

  it("toasts when workspace set but executeCommand missing", async () => {
    window.electronAPI = {
      ...workspaceFolderIpcStubs(),
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo: vi.fn(),
    } as unknown as NonNullable<Window["electronAPI"]>;
    renderWithToast(
      <StepCard
        step={sampleStep}
        resolvedCommand="git status"
        isCompleted={false}
        onToggleComplete={vi.fn()}
        workspacePath="/w"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /run command/i }));
    expect(
      await screen.findByText(/only available in the desktop app/i),
    ).toBeInTheDocument();
  });

  it("does not run when user cancels confirm", () => {
    const executeCommand = vi.fn();
    window.electronAPI = {
      ...workspaceFolderIpcStubs(),
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn(),
      executeCommand,
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo: vi.fn(),
      onCommandOutput: vi.fn(() => () => {}),
      onCommandComplete: vi.fn(() => () => {}),
    };
    vi.mocked(window.confirm).mockReturnValue(false);
    renderWithToast(
      <StepCard
        step={sampleStep}
        resolvedCommand="git status"
        isCompleted={false}
        onToggleComplete={vi.fn()}
        workspacePath="/w"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /run command/i }));
    expect(executeCommand).not.toHaveBeenCalled();
  });

  it("shows Copied state then resets via timer", async () => {
    vi.useFakeTimers();
    renderWithToast(
      <StepCard
        step={sampleStep}
        resolvedCommand="git status"
        isCompleted={false}
        onToggleComplete={vi.fn()}
        workspacePath={null}
      />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /copy command to clipboard/i }),
      );
    });
    expect(
      screen.getByRole("button", { name: /command copied/i }),
    ).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(
      screen.getByRole("button", { name: /copy command to clipboard/i }),
    ).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("streams stdout and stderr while running", async () => {
    let outputCb: (chunk: {
      type: "stdout" | "stderr";
      data: string;
    }) => void = () => {};
    const executeCommand = vi.fn().mockImplementation(async () => {
      outputCb({ type: "stderr", data: "e" });
      outputCb({ type: "stdout", data: "o" });
      return { success: true, output: "o" };
    });
    window.electronAPI = {
      ...workspaceFolderIpcStubs(),
      selectWorkspace: vi.fn().mockResolvedValue(null),
      selectUpstreamFolder: vi.fn().mockResolvedValue(null),
      executeCommand,
      getCourseContentScan: vi
        .fn()
        .mockReturnValue({ hasLocal: false, weeks: [] }),
      getDayFocusContent: vi.fn().mockReturnValue(null),
      fetchUpstreamRepo: vi.fn().mockResolvedValue({ success: true }),
      onCommandOutput: vi.fn((cb) => {
        outputCb = cb;
        return () => {};
      }),
      onCommandComplete: vi.fn(() => () => {}),
    };
    vi.mocked(window.confirm).mockReturnValue(true);

    renderWithToast(
      <StepCard
        step={sampleStep}
        resolvedCommand="git status"
        isCompleted={false}
        onToggleComplete={vi.fn()}
        workspacePath="/work"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /run command/i }));
    await vi.waitFor(() => {
      expect(screen.getByText("e")).toBeInTheDocument();
      expect(screen.getByText("o")).toBeInTheDocument();
    });
  });

  it("handles copy failure", async () => {
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("no"),
    );
    renderWithToast(
      <StepCard
        step={sampleStep}
        resolvedCommand="git status"
        isCompleted={false}
        onToggleComplete={vi.fn()}
        workspacePath={null}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /copy command to clipboard/i }),
    );
    expect(await screen.findByText(/could not copy/i)).toBeInTheDocument();
  });

  it("invokes executeCommand after confirm in Electron", async () => {
    const executeCommand = vi
      .fn()
      .mockResolvedValue({ success: true, output: "" });
    const unsub = vi.fn();
    window.electronAPI = {
      ...workspaceFolderIpcStubs(),
      selectWorkspace: vi.fn().mockResolvedValue(null),
      selectUpstreamFolder: vi.fn().mockResolvedValue(null),
      executeCommand,
      getCourseContentScan: vi
        .fn()
        .mockReturnValue({ hasLocal: false, weeks: [] }),
      getDayFocusContent: vi.fn().mockReturnValue(null),
      fetchUpstreamRepo: vi.fn().mockResolvedValue({ success: true }),
      onCommandOutput: vi.fn(() => unsub),
      onCommandComplete: vi.fn(() => unsub),
    };
    vi.mocked(window.confirm).mockReturnValue(true);

    renderWithToast(
      <StepCard
        step={sampleStep}
        resolvedCommand="git status"
        isCompleted={false}
        onToggleComplete={vi.fn()}
        workspacePath="/work"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /run command/i }));
    await vi.waitFor(() => {
      expect(executeCommand).toHaveBeenCalledWith("git status", "/work");
    });
  });

  it("handles executeCommand rejection", async () => {
    const executeCommand = vi.fn().mockRejectedValue(new Error("ipc down"));
    const unsub = vi.fn();
    window.electronAPI = {
      ...workspaceFolderIpcStubs(),
      selectWorkspace: vi.fn().mockResolvedValue(null),
      selectUpstreamFolder: vi.fn().mockResolvedValue(null),
      executeCommand,
      getCourseContentScan: vi
        .fn()
        .mockReturnValue({ hasLocal: false, weeks: [] }),
      getDayFocusContent: vi.fn().mockReturnValue(null),
      fetchUpstreamRepo: vi.fn().mockResolvedValue({ success: true }),
      onCommandOutput: vi.fn(() => unsub),
      onCommandComplete: vi.fn(() => unsub),
    };
    vi.mocked(window.confirm).mockReturnValue(true);

    renderWithToast(
      <StepCard
        step={sampleStep}
        resolvedCommand="git status"
        isCompleted={false}
        onToggleComplete={vi.fn()}
        workspacePath="/work"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /run command/i }));
    await vi.waitFor(() => {
      expect(screen.getByText(/ipc down/i)).toBeInTheDocument();
    });
  });

  it("applies onCommandComplete when main process signals failure", async () => {
    let completeCb: (result: {
      success: boolean;
      output?: string;
      error?: string;
      exitCode?: number;
    }) => void = () => {};
    const executeCommand = vi.fn().mockResolvedValue({});
    window.electronAPI = {
      ...workspaceFolderIpcStubs(),
      selectWorkspace: vi.fn().mockResolvedValue(null),
      selectUpstreamFolder: vi.fn().mockResolvedValue(null),
      executeCommand,
      getCourseContentScan: vi
        .fn()
        .mockReturnValue({ hasLocal: false, weeks: [] }),
      getDayFocusContent: vi.fn().mockReturnValue(null),
      fetchUpstreamRepo: vi.fn().mockResolvedValue({ success: true }),
      onCommandOutput: vi.fn(() => () => {}),
      onCommandComplete: vi.fn((cb) => {
        completeCb = cb;
        return () => {};
      }),
    };
    vi.mocked(window.confirm).mockReturnValue(true);

    renderWithToast(
      <StepCard
        step={sampleStep}
        resolvedCommand="git status"
        isCompleted={false}
        onToggleComplete={vi.fn()}
        workspacePath="/work"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /run command/i }));
    await vi.waitFor(() => expect(executeCommand).toHaveBeenCalled());

    await act(async () => {
      completeCb({
        success: false,
        output: "",
        error: "command failed",
        exitCode: 2,
      });
    });

    expect(screen.getAllByText(/command failed/i).length).toBeGreaterThan(0);
  });
});
