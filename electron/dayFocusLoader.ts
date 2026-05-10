/**
 * Reads markdown day focus from disk. Preload-only — not bundled into the Vite renderer.
 */

import fs from "node:fs";
import path from "node:path";
import { getAppProjectRoot } from "./projectRoot";
import { reportToMainLog } from "./reportToMainLog";

export interface DayFile {
  name: string;
  content: string;
}

export interface DayFocusContent {
  week: number;
  day: number;
  files: DayFile[];
}

export function loadDayFocusFromDisk(
  week: number,
  day: number,
): DayFocusContent | null {
  const courseRoot = path.join(
    getAppProjectRoot(),
    "data",
    "course-content",
    "aico-echo",
  );
  const dayPath = path.join(courseRoot, `week${week}`, `day${day}`);

  if (!fs.existsSync(dayPath) || !fs.statSync(dayPath).isDirectory()) {
    return null;
  }

  try {
    const entries = fs.readdirSync(dayPath, { withFileTypes: true });

    const priorityFiles = ["README.md", "lesson.md", "lab.md", "challenge.md"];
    const allMdFiles = entries
      .filter(
        (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"),
      )
      .map((entry) => entry.name);

    const orderedFiles = [
      ...priorityFiles.filter((f) => allMdFiles.includes(f)),
      ...allMdFiles.filter((f) => !priorityFiles.includes(f)),
    ];

    const files: DayFile[] = orderedFiles.map((filename) => {
      const filePath = path.join(dayPath, filename);
      const content = fs.readFileSync(filePath, "utf-8");
      return { name: filename, content };
    });

    return { week, day, files };
  } catch (error) {
    console.error("[dayFocusLoader] Failed to load day focus content:", error);
    reportToMainLog(
      "error",
      "dayFocusLoader",
      "Failed to load day focus content",
      {
        week,
        day,
        error: error instanceof Error ? error.message : String(error),
      },
    );
    return null;
  }
}
