import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite configuration for the **browser** workflow (`npm run dev`, `npm run build`, Playwright).
 *
 * The **Electron** app uses `electron.vite.config.ts` (via `electron-vite`); that file extends this
 * setup for the renderer with `vite-plugin-electron-renderer` and may use a different `strictPort`
 * policy when 5173 is already taken.
 *
 * CLI flags override this file when passed explicitly — see:
 * https://vite.dev/guide/cli (e.g. `vite --port 5173 --strictPort`).
 *
 * Learning references:
 * - Server options: https://vite.dev/config/server-options.html
 */

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    /** Align with Playwright `webServer` / `baseURL`; fail fast if 5173 is busy (use `electron:dev` for Electron). */
    strictPort: true,
    // Matches electron-vite renderer: enables crossOriginIsolated + SharedArrayBuffer in dev
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
