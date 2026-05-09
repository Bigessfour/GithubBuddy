import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * electron-vite Configuration
 *
 * This is the official recommended configuration file when using `electron-vite`.
 * It allows us to configure the main process, preload script, and renderer separately
 * while still getting excellent development experience (hot reload for both processes).
 *
 * Why we use electron-vite instead of plain Vite + Electron:
 * - It provides a clean, modern setup with TypeScript support out of the box.
 * - It handles the complexity of bundling the main process correctly.
 * - It enables fast HMR (Hot Module Replacement) for the main process during development.
 *
 * Learning resources:
 * - Official electron-vite documentation: https://electron-vite.org/
 * - GitHub repository with examples: https://github.com/electron-vite/electron-vite
 * - Comparison with other setups: https://electron-vite.org/guide/
 */

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      // Output the main process bundle
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
    // Use our existing Vite + React setup
    // electron-vite will automatically use the root index.html and vite.config.ts
    plugins: [react()],
  },
});
