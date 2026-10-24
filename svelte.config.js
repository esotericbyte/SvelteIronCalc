import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // The demo app is a static single page; the library itself lives in src/lib
    adapter: adapter({ fallback: "200.html" }),
  },
};

export default config;
