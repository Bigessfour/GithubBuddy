import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite Configuration (Cross-Platform Desktop App)
 *
 * We force the dev server to always use port 5173.
 * This is important for the Electron development workflow because:
 * - The Electron main process needs to know which URL to load
 * - The `wait-on` script needs a predictable port
 * - Students on Windows or Mac will have a consistent experience
 *
 * If the port is busy, Vite will fail loudly instead of silently picking another port.
 * This makes debugging easier for learners.
 *
 * Learning references:
 * - Vite server.port option: https://vitejs.dev/config/server-options.html#server-port
 * - Vite server.strictPort: https://vitejs.dev/config/server-options.html#server-strictport
 */

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // Fail if port 5173 is busy instead of picking another port
  },
})
