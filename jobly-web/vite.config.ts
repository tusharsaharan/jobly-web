// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  // y-monaco imports Monaco's public editor API through a deep ESM path.
  // Pin the path explicitly so Rolldown can resolve the collaborative IDE
  // during production builds instead of treating it as an unavailable export.
  vite: {
    server: {
      port: 8080,
      hmr: { overlay: false },
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "monaco-editor/esm/vs/editor/editor.api.js": fileURLToPath(
          new URL("./node_modules/monaco-editor/esm/vs/editor/editor.api.js", import.meta.url),
        ),
      },
    },
    optimizeDeps: {
      exclude: ["@excalidraw/excalidraw"],
      include: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
    },
    ssr: {
      noExternal: ["@excalidraw/excalidraw"],
    },
    define: {
      "process.env.IS_PREACT": JSON.stringify("true"),
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
