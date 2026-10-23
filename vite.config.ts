import { resolve } from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Plain Vite config for the Tauri renderer: the app root is the renderer
// folder, and the build output is consumed by Tauri as `frontendDist`.
export default defineConfig({
  root: resolve(__dirname, "src/renderer"),
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // Vite must not watch the Rust backend
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    outDir: resolve(__dirname, "dist-web"),
    emptyOutDir: true,
    // Tauri uses WebView2 (Chromium-based) on Windows
    target: process.env.TAURI_ENV_PLATFORM == "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
