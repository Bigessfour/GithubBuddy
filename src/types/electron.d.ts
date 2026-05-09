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
    };
  }
}
