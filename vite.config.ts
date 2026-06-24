// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
    // Use node-server preset so Nitro outputs a plain Node.js server (required for Render/VPS).
    // The NITRO_PRESET env var on Render will override this if set.
  },
  vite: {
    server: {
      host: true,
      allowedHosts: "all",
    },
    preview: {
      host: true,
      allowedHosts: "all",
      port: Number(process.env.PORT) || 3000,
    },
  },
});
