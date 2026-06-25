// @lovable.dev/vite-tanstack-config wraps TanStack Start, Vite React, Tailwind CSS,
// tsconfig paths, Nitro deploy, and various Lovable-specific plugins.
// Outside a Lovable sandbox, Nitro must be explicitly enabled via the `nitro` key.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  react: {
    development: false,
  },
  tanstackStart: {
    server: { entry: "server" },
  },
  // Explicitly enable Nitro with node-server preset.
  // Without this, the Lovable wrapper skips Nitro entirely outside its sandbox.
  nitro: {
    preset: "node-server",
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
