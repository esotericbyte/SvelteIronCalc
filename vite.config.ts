import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  optimizeDeps: {
    // wasm-bindgen packages locate their .wasm file with import.meta.url,
    // which esbuild pre-bundling would break
    exclude: ["@ironcalc/wasm", "@ironcalc/wasm-xlsx"],
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
  resolve: process.env.VITEST ? { conditions: ["browser"] } : undefined,
});
