import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import renderer from "vite-plugin-electron-renderer";
import { resolve } from "path";

/**
 * electron-vite Configuration – Fully Documented (v0.4)
 *
 * This is the correct, officially recommended way to configure electron-vite
 * when your project originally started as a standard Vite + React application
 * (with index.html at the project root).
 *
 * Key documentation references:
 * - Official electron-vite guide: https://electron-vite.org/guide/
 * - Renderer configuration options: https://electron-vite.org/config/
 * - Rollup input option: https://rollupjs.org/configuration-options/#input
 *
 * Known build-time messages (toolchain / plugins — not app bugs):
 * - "Invalid output options … freeze" — Vite 8 + Rolldown option mismatch; tracked upstream.
 * - "`resolve.alias` … customResolver … deprecated" — from electron-vite / Vite 9 migration path.
 * - `[INEFFECTIVE_DYNAMIC_IMPORT]` for reportToMainLog — preload static-imports the same module
 *   that scanners dynamic-import; harmless for our bundle shape.
 *
 * Why this structure?
 * - Main and Preload are built as separate bundles (Node.js environment).
 * - Renderer reuses our existing Vite + React setup.
 * - We explicitly set rollupOptions.input so electron-vite knows where index.html lives.
 */

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "dist-electron/main",
      lib: {
        entry: resolve(__dirname, "electron/main.ts"),
      },
    },
  },

  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "dist-electron/preload",
      lib: {
        entry: resolve(__dirname, "electron/preload.ts"),
      },
    },
  },

  renderer: {
    // electron-vite defaults root to ./src/renderer; this app uses project-root index.html + src/.
    // Without an explicit root, the dev server serves the wrong tree and the React entry script never appears in the DOM.
    root: resolve(__dirname, "."),
    plugins: [react(), renderer()],
    server: {
      port: 5173,
      strictPort: true,
      /**
       * Cross-origin isolation (COOP + COEP) so SharedArrayBuffer is allowed.
       * Without this, Chromium logs "SharedArrayBuffer usage is restricted…"
       * for some dev dependencies (e.g. utf-8 helpers pulled into the bundle).
       * @see https://developer.chrome.com/blog/enabling-shared-array-buffer/
       */
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
      },
    },
    build: {
      rollupOptions: {
        input: resolve(__dirname, "index.html"),
      },
    },
  },
});
