import React from 'react';

/**
 * WorkspaceSelector – v0.4 Version with Real Native Dialog
 *
 * This component now uses the safe Electron API we exposed in preload.ts
 * to open a real native folder picker dialog (instead of a browser prompt).
 *
 * Why this is better:
 * - Gives users a familiar system folder picker on Windows and macOS
 * - Much better UX than typing a path
 * - Still completely safe because the actual dialog logic lives in the main process
 *
 * The component receives `workspacePath` and `onWorkspaceChange` from the parent (App).
 * When the user clicks "Choose Workspace Folder", we call:
 *   window.electronAPI.selectWorkspace()
 *
 * This returns a Promise<string | null>.
 *
 * Educational references:
 * - dialog.showOpenDialog: https://www.electronjs.org/docs/latest/api/dialog#dialogshowopendialogoptions
 * - Using contextBridge from renderer: https://www.electronjs.org/docs/latest/tutorial/context-isolation#exposing-apis
 */

interface WorkspaceSelectorProps {
  workspacePath: string | null;
  onWorkspaceChange: (path: string | null) => void;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  workspacePath,
  onWorkspaceChange,
}) => {
  const handleSelectWorkspace = async () => {
    // Check if we are running inside Electron (desktop app)
    if (window.electronAPI?.selectWorkspace) {
      const selectedPath = await window.electronAPI.selectWorkspace();
      if (selectedPath) {
        onWorkspaceChange(selectedPath);
      }
    } else {
      // Fallback for web-only development (prompt is ugly but works)
      const enteredPath = prompt(
        'Enter the full path to your workspace folder\n(e.g. /Users/you/Code/my-platoon-project)'
      );
      if (enteredPath && enteredPath.trim()) {
        onWorkspaceChange(enteredPath.trim());
      }
    }
  };

  const handleClearWorkspace = () => {
    onWorkspaceChange(null);
  };

  return (
    <div className="workspace-selector">
      <h3>Workspace Folder</h3>
      <p className="workspace-explanation">
        Choose the folder on your computer where you want the commands from today&apos;s checklist to run.
        This is required before you can use the <strong>Run</strong> buttons.
      </p>

      <div className="workspace-actions">
        <button
          type="button"
          onClick={handleSelectWorkspace}
          className="workspace-button"
        >
          {workspacePath ? 'Change Workspace Folder' : 'Choose Workspace Folder'}
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
          No workspace selected. Pick a folder so the Run buttons become active.
        </p>
      )}
    </div>
  );
};
