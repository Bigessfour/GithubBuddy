/**
 * Type declarations for the safe Electron API exposed via preload.ts
 *
 * This file tells TypeScript that `window.electronAPI` exists when running in the desktop app.
 * It prevents TypeScript errors when we call the methods from React components.
 *
 * We only declare the methods we actually expose in preload.ts.
 */

export {};

declare global {
  interface Window {
    electronAPI?: {
      selectWorkspace: () => Promise<string | null>;
      executeCommand: (
        command: string,
        cwd: string
      ) => Promise<{
        success: boolean;
        output: string;
        error?: string;
      }>;
      getCourseContentScan: () => { hasLocal: boolean; weeks: Array<{ week: number; days: number[] }> };
      getDayFocusContent: (
        week: number,
        day: number
      ) => { week: number; day: number; files: Array<{ name: string; content: string }> } | null;
      fetchUpstreamRepo: (repoUrl?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
      onCommandOutput?: (
        callback: (data: { type: 'stdout' | 'stderr'; data: string }) => void
      ) => () => void;
      onCommandComplete?: (
        callback: (result: { success: boolean; output?: string; error?: string; exitCode?: number }) => void
      ) => () => void;
      onUpstreamStatus?: (callback: (data: { message: string }) => void) => () => void;
    };
  }
}
