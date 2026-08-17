import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // NOTE: `npm run dev` serves the frontend only. The `/api/site` endpoint
  // (deploy + view) is a Vercel serverless function backed by Supabase. To
  // test it locally, run `npx vercel dev` (starts Vite + API together) instead
  // of adding a blind proxy here. If you do run a local API separately, point
  // it at the port below:
  // server: {
  //   proxy: { '/api': 'http://localhost:3000' },
  // },
})
