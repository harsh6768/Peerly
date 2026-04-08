import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env* from frontend/ so VITE_* matches `npm run dev` / `vite build` (including Netlify with base = frontend).
  const env = loadEnv(mode, __dirname, '')

  if (mode === 'production' && process.env.NETLIFY === 'true') {
    const api = env.VITE_API_BASE_URL?.trim()
    if (!api) {
      throw new Error(
        'Netlify build: set VITE_API_BASE_URL in Site configuration → Environment variables (same name, no prefix change), ' +
          'then trigger a new deploy. Vite bakes this in at build time — runtime-only env vars are not applied.',
      )
    }
    if (api.includes('localhost') || api.includes('127.0.0.1')) {
      throw new Error(
        `Netlify build: VITE_API_BASE_URL must be your public API URL (got "${api}"). ` +
          'Remove any local .env from the build or fix the variable in Netlify and redeploy.',
      )
    }
  }

  return {
    plugins: [react()],
    envDir: __dirname,
    envPrefix: 'VITE_',
  }
})
