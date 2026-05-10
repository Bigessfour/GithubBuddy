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

const README_DEFAULT_MIN = 200;
const README_DEFAULT_MAX = 720;
const README_DEFAULT_STEP = 20;
const README_DEFAULT_HEIGHT_PX = 380;

function initialFileIndex(files: DayFocusContent["files"]): number {
  const readme = files.findIndex(
    (f) => f.name.toLowerCase() === "readme.md",
  );
  return readme >= 0 ? readme : 0;
}

interface DayFocusProps {
  focus: DayFocusContent;
}

export const DayFocus: React.FC<DayFocusProps> = ({ focus }) => {
  const [activeFileIndex, setActiveFileIndex] = useState(() =>
    initialFileIndex(focus.files),
  );
  const [readAreaHeightPx, setReadAreaHeightPx] = useState(
    README_DEFAULT_HEIGHT_PX,
  );
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
        <div className="day-focus-read-controls">
          <label className="day-focus-height-label" htmlFor="day-focus-height">
            Reading area height — use the slider for a taller or shorter box;
            scroll inside the box to read the full document (for example{" "}
            <code>README.md</code>).
          </label>
          <div className="day-focus-slider-row">
            <span className="day-focus-height-tick" aria-hidden>
              Compact
            </span>
            <input
              id="day-focus-height"
              type="range"
              min={README_DEFAULT_MIN}
              max={README_DEFAULT_MAX}
              step={README_DEFAULT_STEP}
              value={readAreaHeightPx}
              onChange={(e) =>
                setReadAreaHeightPx(Number(e.target.value))
              }
              aria-label="Reading area height in pixels"
              aria-valuemin={README_DEFAULT_MIN}
              aria-valuemax={README_DEFAULT_MAX}
              aria-valuenow={readAreaHeightPx}
              aria-valuetext={`${readAreaHeightPx} pixels tall`}
            />
            <span className="day-focus-height-tick" aria-hidden>
              Large
            </span>
          </div>
        </div>
        <div
          className="day-focus-scroll"
          style={{ height: readAreaHeightPx }}
          tabIndex={0}
          role="region"
          aria-label={`Lesson file: ${activeFile.name}`}
        >
          <pre className="markdown-content">
            <code>{activeFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
