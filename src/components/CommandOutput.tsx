import React from "react";

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
}

export const CommandOutput: React.FC<CommandOutputProps> = ({
  output,
  error,
  success,
}) => {
  if (!output && !error) return null;

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
    </div>
  );
};
