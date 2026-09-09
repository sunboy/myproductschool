import { defineConfig } from '@playwright/test'
import { config as loadDotenv } from 'dotenv'

// Playwright does not auto-load .env.local (a Next.js convention). Several
// specs' admin helpers (e2e/helpers.ts, e2e/density/helpers.ts) read
// NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY at module-eval time, so
// this must run before any spec file is imported — loading it here in the
// config (evaluated first) rather than in a helper file guarantees that.
loadDotenv({ path: '.env.local' })

export default defineConfig({
  testDir: './e2e',
  timeout: 120000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3002',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  // Don't start the dev server — assume it's already running
  webServer: undefined,
})
