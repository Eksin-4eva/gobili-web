import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import Pages from "vite-plugin-pages";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    Pages({ dirs: "src/pages", importMode: "async" }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/user": "http://127.0.0.1:8888",
      "/video": "http://127.0.0.1:8888",
      "/comment": "http://127.0.0.1:8888",
      "/auth": "http://127.0.0.1:8888",
      "/history": "http://127.0.0.1:8889",
      "/conversations": "http://127.0.0.1:8889",
      "/healthz": "http://127.0.0.1:8889",
      "/ws": {
        target: "ws://127.0.0.1:8889",
        ws: true,
      },
    },
  },
});
