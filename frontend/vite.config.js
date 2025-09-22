import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import eslint from "vite-plugin-eslint";

export default defineConfig({
  plugins: [react(), eslint()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000", // backend API server
        changeOrigin: true,
        // secure: false, // uncomment if backend uses self-signed HTTPS
      },
    },
  },
});
