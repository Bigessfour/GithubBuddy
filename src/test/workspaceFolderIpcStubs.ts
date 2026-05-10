import { vi } from "vitest";

/** Satisfies `Window["electronAPI"]` workspace-folder IPC in unit tests. */
export function workspaceFolderIpcStubs() {
  return {
    selectWorkspaceParent: vi.fn().mockResolvedValue(null),
    createWorkspaceFolder: vi
      .fn()
      .mockResolvedValue({ ok: false as const, error: "" }),
  };
}
