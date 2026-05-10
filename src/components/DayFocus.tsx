import React, { useState } from "react";
import type { DayFocusContent } from "../utils/courseContentLoader";

/**
 * DayFocus Component – v0.6
 *
 * Renders the full lesson, lab, and challenge content loaded from the upstream repo.
 * Supports multiple files with simple tab navigation.
 *
 * This replaces the hardcoded guidance when local course content is available.
 *
 * Educational note: We render raw Markdown content for now (future versions can add react-markdown).
 */

interface DayFocusProps {
  focus: DayFocusContent;
}

export const DayFocus: React.FC<DayFocusProps> = ({ focus }) => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const activeFile = focus.files[activeFileIndex];

  if (!focus.files.length) {
    return <p>No content files found for this day.</p>;
  }

  return (
    <div className="day-focus">
      <div className="day-focus-header">
        <h2>
          Week {focus.week} Day {focus.day} – Course Materials
        </h2>
        <p className="day-focus-subtitle">
          Loaded from your local upstream repo clone
        </p>
      </div>

      {/* File tabs */}
      {focus.files.length > 1 && (
        <div className="file-tabs">
          {focus.files.map((file, index) => (
            <button
              key={index}
              className={`file-tab ${index === activeFileIndex ? "active" : ""}`}
              onClick={() => setActiveFileIndex(index)}
            >
              {file.name}
            </button>
          ))}
        </div>
      )}

      {/* Content area */}
      <div className="file-content">
        <div className="file-header">
          <h3>{activeFile.name}</h3>
        </div>
        <pre className="markdown-content">
          <code>{activeFile.content}</code>
        </pre>
      </div>
    </div>
  );
};
