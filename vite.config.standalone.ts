import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Builds a portable, offline-friendly client bundle. The follow-up
// scripts/inline-standalone.mjs step inlines the generated JS/CSS into
// dist/standalone/CNGCalculator.html.
export default defineConfig({
  plugins: [react()],
  base: "./",
  define: {
    __STANDALONE_LOCAL__: "true",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/standalone"),
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 10 * 1024 * 1024,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});