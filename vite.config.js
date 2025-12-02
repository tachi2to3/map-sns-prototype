import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // LAN内からのアクセスを許可
    allowedHosts: true, // ngrokなどのトンネル接続を許可
  },
})
