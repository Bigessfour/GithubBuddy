import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "electron/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      reportsDirectory: "./coverage",
      include: [
        "src/**/*.{ts,tsx}",
        "electron/courseContentScan.ts",
        "electron/classifyGitRemoteFailure.ts",
        "electron/dayFocusLoader.ts",
        "electron/ghAuthForGitHub.ts",
        "electron/runShellCommand.ts",
        "electron/parseGitFetchProgress.ts",
        "electron/runGitWithUpstreamProgress.ts",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/src/test/**",
        "src/types/electron.d.ts",
        "src/types/index.ts",
        "electron/main.ts",
        "electron/preload.ts",
      ],
      // Minimums enforced in CI (`npm run test:coverage`). Class-scope bar: keep green locally, raise slowly.
      thresholds: {
        lines: 95,
        functions: 91,
        branches: 86,
        statements: 93,
      },
    },
  },
});
