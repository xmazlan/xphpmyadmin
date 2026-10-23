import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    coverage: {
      exclude: [],
      include: ["src/**/*"],
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    css: true,
    dir: "./src/tests/unit",
    environment: "jsdom",
    globals: true,
    reporters: ["verbose"],
    setupFiles: "./src/tests/unit/setup.ts",
  },
});
