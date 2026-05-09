import React, { useState } from 'react';
import type { Step } from '../types';

/**
 * StepCard Component
 *
 * Displays a single workflow step with:
 * - Checkbox for marking progress (persisted in localStorage via parent)
 * - Educational "why" paragraph explaining the GitHub best practice
 * - Syntax-highlighted command block with one-click copy using the Clipboard API
 * - Optional notes and a category badge for visual scanning
 *
 * Key learning points demonstrated:
 * - useState for local UI state (the temporary "Copied!" feedback)
 * - Async/await with navigator.clipboard (modern, secure clipboard access)
 * - Conditional classNames and disabled state for UX feedback
 * - Accessibility: label wrapping checkbox, aria not strictly needed here but good practice
 *
 * References:
 * - React useState: https://react.dev/reference/react/useState
 * - Clipboard API: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
 * - React conditional rendering & className: https://react.dev/learn/conditional-rendering
 */

interface StepCardProps {
  step: Step;
  isCompleted: boolean;
  onToggleComplete: (id: string) => void;
}

export const StepCard: React.FC<StepCardProps> = ({
  step,
  isCompleted,
  onToggleComplete,
}) => {
  // Local state only for the copy button feedback animation (resets after 2s)
  const [copied, setCopied] = useState(false);

  /**
   * Copies the command string to the user's clipboard.
   * Uses the modern async Clipboard API (requires HTTPS or localhost).
   * On success shows temporary "Copied!" text; on failure falls back to alert.
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(step.command);
      setCopied(true);
      // Auto-reset the button label so user knows they can copy again
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Could not copy to clipboard. Please copy manually.');
    }
  };

  return (
    <div className={`step-card ${isCompleted ? 'completed' : ''}`}>
      <div className="step-header">
        {/* Checkbox + number label. Clicking anywhere on the label toggles completion */}
        <label className="complete-toggle">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={() => onToggleComplete(step.id)}
            aria-label={`Mark step ${step.id} as complete`}
          />
          <span className="step-number">{step.id.replace('s', '')}</span>
        </label>

        <h3>{step.title}</h3>

        {/* Visual category tag - color coded in CSS for quick scanning */}
        <span className={`category-badge ${step.category}`}>{step.category}</span>
      </div>

      {/* The core educational content: why this step teaches good GitHub habits */}
      <p className="why">{step.why}</p>

      {/* Command block with copy button positioned absolutely over the code */}
      <div className="command-block">
        <pre>
          <code>{step.command}</code>
        </pre>
        <button
          type="button"
          className="copy-button"
          onClick={handleCopy}
          disabled={copied}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Optional instructor notes or caveats */}
      {step.notes && <p className="notes">{step.notes}</p>}
    </div>
  );
};
