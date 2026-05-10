import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { UpstreamPathSelector } from "./UpstreamPathSelector";
import { renderWithToast } from "../test/renderWithToast";
import { workspaceFolderIpcStubs } from "../test/workspaceFolderIpcStubs";

describe("UpstreamPathSelector", () => {
  beforeEach(() => {
    delete (window as Window & { electronAPI?: unknown }).electronAPI;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as Window & { electronAPI?: unknown }).electronAPI;
  });

  it("Browse uses prompt when not in Electron", () => {
    const onUpstreamChange = vi.fn();
    const promptSpy = vi
      .spyOn(window, "prompt")
      .mockReturnValue("  /manual/path  ");
    renderWithToast(
      <UpstreamPathSelector
        key="__z__"
        upstreamPath={null}
        onUpstreamChange={onUpstreamChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /browse/i }));
    expect(onUpstreamChange).toHaveBeenCalledWith("/manual/path");
    promptSpy.mockRestore();
  });

  it("Save path commits trimmed draft", () => {
    const onUpstreamChange = vi.fn();
    renderWithToast(
      <UpstreamPathSelector
        key="__x__"
        upstreamPath={null}
        onUpstreamChange={onUpstreamChange}
      />,
    );
    fireEvent.change(
      screen.getByLabelText(/upstream course repository path/i),
      {
        target: { value: "  /course  " },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: /save path/i }));
    expect(onUpstreamChange).toHaveBeenCalledWith("/course");
  });

  it("Browse ignores null selection from Electron", async () => {
    const onUpstreamChange = vi.fn();
    window.electronAPI = {
      ...workspaceFolderIpcStubs(),
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn().mockResolvedValue(null),
      executeCommand: vi.fn(),
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo: vi.fn(),
    };
    renderWithToast(
      <UpstreamPathSelector
        key="__nullpick__"
        upstreamPath={null}
        onUpstreamChange={onUpstreamChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /browse/i }));
    await vi.waitFor(() =>
      expect(window.electronAPI?.selectUpstreamFolder).toHaveBeenCalled(),
    );
    expect(onUpstreamChange).not.toHaveBeenCalled();
  });

  it("Browse uses native dialog in Electron", async () => {
    const onUpstreamChange = vi.fn();
    window.electronAPI = {
      ...workspaceFolderIpcStubs(),
      selectWorkspace: vi.fn(),
      selectUpstreamFolder: vi.fn().mockResolvedValue("/picked"),
      executeCommand: vi.fn(),
      getCourseContentScan: vi.fn(),
      getDayFocusContent: vi.fn(),
      fetchUpstreamRepo: vi.fn(),
    };
    renderWithToast(
      <UpstreamPathSelector
        key="__y__"
        upstreamPath={null}
        onUpstreamChange={onUpstreamChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /browse/i }));
    await vi.waitFor(() =>
      expect(onUpstreamChange).toHaveBeenCalledWith("/picked"),
    );
  });

  it("Clear resets upstream", () => {
    const onUpstreamChange = vi.fn();
    renderWithToast(
      <UpstreamPathSelector
        key="/saved"
        upstreamPath="/saved"
        onUpstreamChange={onUpstreamChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(onUpstreamChange).toHaveBeenCalledWith(null);
  });
});
