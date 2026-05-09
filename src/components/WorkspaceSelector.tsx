import React, { useState } from 'react';

/**
 * WorkspaceSelector Component
 *
 * Allows the user to select a local workspace folder where they will run the terminal commands
 * from the daily guidance checklist.
 *
 * Why this component exists (v0.2 of the roadmap):
 * - The original v1 was deliberately "display + copy only" for safety and to work in the browser immediately.
 * - v0.2 adds the ability to choose a folder so that, in a future version, we can actually execute
 *   the suggested commands inside that folder.
 *
 * Educational explanation of the design (the documented way):
 *
 * 1. We store the selected path in React state (useState).
 *    - This follows the official React "Lifting State Up" and "Controlled Components" pattern.
 *    - Reference: https://react.dev/learn/sharing-state-between-components
 *
 * 2. The actual folder selection UI is currently a simple button + simulated path.
 *    - In a pure web app we cannot access the real filesystem path for security reasons.
 *    - When we move to Electron (v0.3), we will replace the button handler with a call to
 *      Electron's `dialog.showOpenDialog()` (main process) + IPC, which returns a real native path.
 *    - By keeping the state shape as `string | null`, the rest of the app does not need to change.
 *    - This is the recommended "progressive enhancement" pattern for Electron + React apps.
 *    - Reference: https://www.electronjs.org/docs/latest/tutorial/application-architecture
 *
 * 3. We expose the selected path via props (onWorkspaceChange) so the parent (App) can pass it
 *    down to a future CommandRunner component. This is the documented "unidirectional data flow".
 *
 * 4. We show a clear visual indicator of whether a workspace is selected.
 *    - This follows accessibility best practices (clear status, no hidden state).
 *    - Reference: https://developer.mozilla.org/en-US/docs/Web/Accessibility
 *
 * Future safety note:
 * - Even when we add real execution, we will always show a preview + confirmation dialog first.
 * - We will never run commands without explicit user approval (principle of least surprise).
 */

interface WorkspaceSelectorProps {
  /** The currently selected workspace path (null if none chosen) */
  workspacePath: string | null;
  /** Callback to update the workspace path in the parent */
  onWorkspaceChange: (path: string | null) => void;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  workspacePath,
  onWorkspaceChange,
}) => {
  const [isSelecting, setIsSelecting] = useState(false);

  /**
   * Handles the folder selection.
   *
   * Current (web) behavior:
   * - We simulate the selection by prompting the user to type a path.
   * - This is intentional for v0.2 so the UI works in the browser without Electron.
   *
   * Documented future Electron behavior:
   * - We will use `window.electronAPI.selectWorkspace()` (exposed via preload script)
   *   which calls `dialog.showOpenDialog({ properties: ['openDirectory'] })` in the main process.
   * - This is the official, secure way to let users pick folders in desktop apps.
   * - Reference: https://www.electronjs.org/docs/latest/api/dialog
   */
  const handleSelectWorkspace = () => {
    setIsSelecting(true);

    // For now (web-only v0.2): prompt for a path so the feature is usable immediately
    const enteredPath = prompt(
      'Enter the full path to your local workspace folder\n(e.g. /Users/you/Code/my-platoon-project)\n\nIn the final desktop app this will open a native folder picker.'
    );

    if (enteredPath && enteredPath.trim() !== '') {
      onWorkspaceChange(enteredPath.trim());
    }

    setIsSelecting(false);
  };

  const handleClearWorkspace = () => {
    onWorkspaceChange(null);
  };

  return (
    <div className="workspace-selector">
      <h3>Workspace Folder (v0.2 Preview)</h3>
      <p className="workspace-explanation">
        Choose the folder on your computer where you want to run the commands from today&apos;s checklist.
        This is the first step toward safe, one-click execution (coming in a later version).
      </p>

      <div className="workspace-actions">
        <button
          type="button"
          onClick={handleSelectWorkspace}
          disabled={isSelecting}
          className="workspace-button"
        >
          {isSelecting ? 'Selecting...' : workspacePath ? 'Change Workspace' : 'Choose Workspace Folder'}
        </button>

        {workspacePath && (
          <button
            type="button"
            onClick={handleClearWorkspace}
            className="workspace-clear-button"
          >
            Clear
          </button>
        )}
      </div>

      {workspacePath ? (
        <div className="workspace-path-display">
          <span className="workspace-label">Selected workspace:</span>
          <code className="workspace-path">{workspacePath}</code>
        </div>
      ) : (
        <p className="workspace-hint">
          No workspace selected yet. Pick a folder so we know where to run commands.
        </p>
      )}
    </div>
  );
};
