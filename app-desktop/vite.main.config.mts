import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        "ssh2",
        /^ssh2\/.*/,
        "cpu-features",
        /^cpu-features\/.*/,
        "mysql2",
        /^mysql2\/.*/,
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
