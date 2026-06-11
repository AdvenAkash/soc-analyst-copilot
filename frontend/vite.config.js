import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// For JupyterHub: set VITE_BASE_PATH=/jupyter-<id>/proxy/5173/
const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    port: 5173,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
