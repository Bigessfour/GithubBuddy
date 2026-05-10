import React from "react";
import { getCommandErrorHelp } from "../utils/shellCommandErrorHelp";

/**
 * CommandOutput Component – v0.4
 *
 * Displays the result of executing a command.
 *
 * Props:
 *   output   – The stdout from the command
 *   error    – Any error message (stderr or exception)
 *   success  – Whether the command exited with code 0
 *
 * This is intentionally simple in v0.4. In future versions we can add:
 * - Syntax highlighting
 * - Collapsible sections
 * - Copy output button
 * - Live streaming output (using spawn instead of exec)
 *
 * Educational note:
 * We keep the UI minimal so students can focus on the IPC + safety concepts
 * rather than being distracted by a complex output viewer.
 */

interface CommandOutputProps {
  output: string;
  error?: string;
  success: boolean;
  /** When set, used with `error` to show Git/GitHub-oriented recovery steps. */
  exitCode?: number | null;
}

export const CommandOutput: React.FC<CommandOutputProps> = ({
  output,
  error,
  success,
  exitCode,
}) => {
  if (!output && !error) return null;

  const help =
    !success && error
      ? getCommandErrorHelp(error, exitCode ?? undefined)
      : null;

  return (
    <div className={`command-output ${success ? "success" : "error"}`}>
      <div className="command-output-header">
        {success ? "✓ Command completed successfully" : "✗ Command failed"}
      </div>

      {output && (
        <pre className="command-output-content">
          <code>{output}</code>
        </pre>
      )}

      {error && (
        <pre className="command-output-error">
          <code>{error}</code>
        </pre>
      )}

      {help && (
        <section
          className="command-output-help"
          aria-label="Suggested fixes for this error"
        >
          <h4 className="command-output-help-title">{help.title}</h4>
          <ol className="command-output-help-steps">
            {help.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <ul className="command-output-help-links">
            {help.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
