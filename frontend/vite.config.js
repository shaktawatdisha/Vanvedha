import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['9626-2401-4900-ae40-4c44-ee00-498f-8df8-e095.ngrok-free.app'],
  },
})
