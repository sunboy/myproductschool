import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Mirrors the tsconfig "@/*" -> "./src/*" path alias so component tests can
// import modules that use absolute imports.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
