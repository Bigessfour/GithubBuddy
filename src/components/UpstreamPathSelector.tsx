import React, { useState } from "react";
import { Tooltip } from "./Tooltip";
import { useToast } from "../context/useToast";
import {
  WORKFLOW_TOASTS,
  WORKFLOW_TOOLTIPS,
} from "../content/githubWorkflowHints";
import { appLog } from "../utils/appLog";

interface UpstreamPathSelectorProps {
  upstreamPath: string | null;
  onUpstreamChange: (path: string | null) => void;
}

/**
 * Optional path to the local course clone; persisted by the parent (App) in localStorage.
 * Substituted into `{{UPSTREAM}}` in step commands via buildStepCommand.
 */
export const UpstreamPathSelector: React.FC<UpstreamPathSelectorProps> = ({
  upstreamPath,
  onUpstreamChange,
}) => {
  const { showToast } = useToast();
  const [draft, setDraft] = useState(upstreamPath ?? "");

  const handleBrowse = async () => {
    if (window.electronAPI?.selectUpstreamFolder) {
      const selected = await window.electronAPI.selectUpstreamFolder();
      if (selected) {
        appLog("info", "UpstreamPathSelector", "upstream folder selected", {
          pathLength: selected.length,
        });
        onUpstreamChange(selected);
      }
    } else {
      const entered = window.prompt(
        "Enter the full path to your local course repo root\n(e.g. /Users/you/Code/aico-echo)",
      );
      if (entered?.trim()) {
        const p = entered.trim();
        appLog("info", "UpstreamPathSelector", "upstream path entered (web)", {
          pathLength: p.length,
        });
        onUpstreamChange(p);
      }
    }
  };

  const handleSaveDraft = () => {
    const t = draft.trim();
    onUpstreamChange(t || null);
    if (t) showToast(WORKFLOW_TOASTS.upstreamSaved, "success");
    else showToast(WORKFLOW_TOASTS.upstreamCleared, "info");
  };

  const handleClear = () => {
    onUpstreamChange(null);
    setDraft("");
    showToast(WORKFLOW_TOASTS.upstreamCleared, "info");
  };

  return (
    <div className="workspace-selector upstream-path-selector">
      <h3>Course / upstream folder</h3>
      <p className="workspace-explanation">
        Optional. Used to replace <code>{"{{UPSTREAM}}"}</code> in commands
        (e.g. <code>cp</code> from your local clone). Your{" "}
        <strong>workspace folder</strong> above is still where commands run (
        <code>cwd</code>).{" "}
        <a
          href="https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository"
          target="_blank"
          rel="noreferrer"
          className="inline-doc-link"
        >
          GitHub: Cloning a repository
        </a>
      </p>

      <div className="upstream-path-row">
        <Tooltip text={WORKFLOW_TOOLTIPS.upstreamPath}>
          <input
            type="text"
            className="upstream-path-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="/path/to/aico-echo"
            aria-label="Upstream course repository path"
          />
        </Tooltip>
        <Tooltip text={WORKFLOW_TOOLTIPS.upstreamSave}>
          <button
            type="button"
            className="workspace-button"
            onClick={handleSaveDraft}
          >
            Save path
          </button>
        </Tooltip>
        <Tooltip text={WORKFLOW_TOOLTIPS.upstreamBrowse}>
          <button
            type="button"
            className="workspace-button"
            onClick={handleBrowse}
          >
            Browse…
          </button>
        </Tooltip>
        {upstreamPath && (
          <Tooltip text={WORKFLOW_TOOLTIPS.upstreamClear}>
            <button
              type="button"
              onClick={handleClear}
              className="workspace-clear-button"
            >
              Clear
            </button>
          </Tooltip>
        )}
      </div>

      {upstreamPath ? (
        <div className="workspace-path-display">
          <span className="workspace-label">Saved upstream root:</span>
          <code className="workspace-path">{upstreamPath}</code>
        </div>
      ) : (
        <p className="workspace-hint">
          No upstream path saved. Steps with {"{{UPSTREAM}}"} will show the
          placeholder until you set this.
        </p>
      )}
    </div>
  );
};
