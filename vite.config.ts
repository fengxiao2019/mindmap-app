import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Relative asset paths so the build can be hosted at a domain root or in a sub-folder.
  base: "./",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      workbox: {
        // Font slices are fetched on demand (CJK is split into ~100 files); cache each one on first use
        // instead of precaching all ~7 MB, so the app still looks the same offline.
        runtimeCaching: [
          { urlPattern: /\.woff2$/, handler: "CacheFirst", options: { cacheName: "fonts", expiration: { maxEntries: 150 } } }
        ]
      },
      manifest: {
        name: "学习地图",
        short_name: "学习地图",
        description: "导入 JSON，把每个学习主题变成可展开的知识脑图",
        lang: "zh-CN",
        display: "standalone",
        start_url: ".",
        scope: ".",
        background_color: "#edf0eb",
        theme_color: "#148fa0",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }]
      }
    })
  ],
  test: { environment: "node", include: ["src/**/*.test.ts"], setupFiles: ["src/test-setup.ts"] }
});
