import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

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
 * Why this structure?
 * - Main and Preload are built as separate bundles (Node.js environment).
 * - Renderer reuses our existing Vite + React setup.
 * - We explicitly set rollupOptions.input so electron-vite knows where index.html lives.
 */

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist-electron/main',
      lib: {
        entry: resolve(__dirname, 'electron/main.ts'),
      },
    },
  },

  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist-electron/preload',
      lib: {
        entry: resolve(__dirname, 'electron/preload.ts'),
      },
    },
  },

  renderer: {
    // We are using the root-level Vite React setup
    plugins: [react()],

    // This is the critical part that was missing.
    // electron-vite needs to know the entry HTML file when it is not in src/renderer/.
    build: {
      rollupOptions: {
        input: 'index.html',   // ← This fixes the "rollupOptions.input is required" error
      },
    },
  },
});
