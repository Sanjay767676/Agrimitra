import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// The backend API base URL for the dev proxy.
const API_TARGET = process.env.VITE_API_TARGET || "http://localhost:5000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      // Forward API calls to the backend during development.
      "/api": {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
});
