import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Desabilitar checagem de tipos no build
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignorar avisos de tipos
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
        warn(warning)
      }
    }
  },
  esbuild: {
    // Ignorar erros de tipos durante o build
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
