import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api-dihw-smarthw": {
        target: "https://zytestaliyun.ceshiservice.cn",
        changeOrigin: true,
        secure: true,
      },
      "/oss-proxy": {
        target: "https://oss-cn-beijing.aliyuncs.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/oss-proxy/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            // 动态设置 Host 头为实际的 OSS bucket 域名
            const targetHost = req.headers["x-proxy-target-host"] as string | undefined;
            if (targetHost) {
              proxyReq.setHeader("host", targetHost);
              proxyReq.removeHeader("x-proxy-target-host");
            }
          });
        },
      },
    },
  },
  build: {
    sourcemap: true,
  },
});
