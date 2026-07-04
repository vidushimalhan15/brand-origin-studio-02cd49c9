import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Plain client-side SPA. No server, no API keys. Deploys to Vercel as a static site.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
