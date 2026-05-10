import { useCallback, useEffect, useId, useRef } from "react";
import { setIntroDismissed } from "../constants/storage";

export type ProcessIntroModalProps = {
  open: boolean;
  /** When true, closing persists “don’t auto-show again” (first launch). When false, close only (replay from footer). */
  persistDismissOnClose: boolean;
  onClose: () => void;
};

/**
 * First-run / “How this works” dialog explaining the main workflow.
 * - `role="dialog"` + labelled title for screen readers
 * - Primary control focused when opened
 * - Escape closes (same persistence rules as the primary button)
 */
export function ProcessIntroModal({
  open,
  persistDismissOnClose,
  onClose,
}: ProcessIntroModalProps) {
  const titleId = useId();
  const primaryRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    if (persistDismissOnClose) {
      setIntroDismissed();
    }
    onClose();
  }, [persistDismissOnClose, onClose]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => primaryRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div
      className="process-intro-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="process-intro-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="process-intro-title">
          How GithubBuddy works
        </h2>
        <ol className="process-intro-steps">
          <li>
            <strong>Choose your week and day</strong> — loads the lesson’s
            guided workflow, course materials (when your upstream clone is set
            up), or an empty state if that day has no checklist yet.
          </li>
          <li>
            <strong>Pick a workspace folder</strong> — your fork or project
            directory. Copy and Run use this folder as the working directory
            (native folder picker in the desktop app; path prompt on the web).
          </li>
          <li>
            <strong>Set the course / upstream path</strong> (optional but
            recommended) — your local clone of the cohort repo. Commands that
            use <code className="process-intro-code">{"{{UPSTREAM}}"}</code> get
            the real path filled in.
          </li>
          <li>
            <strong>Use the checklist</strong> — read the “why,” copy commands,
            check steps off, and in the desktop app run allowlisted commands
            after preview and confirmation.
          </li>
        </ol>
        <p className="process-intro-footnote">
          You can open this explanation anytime from{" "}
          <strong>How this works</strong> in the footer.
        </p>
        <div className="process-intro-actions">
          <button
            ref={primaryRef}
            type="button"
            className="process-intro-primary"
            onClick={handleClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
