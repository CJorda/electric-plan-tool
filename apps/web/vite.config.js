import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

const compilerPreset = reactCompilerPreset({
  compilationMode: 'annotation',
})

compilerPreset.rolldown.filter.code.include = [
  /['"]use memo['"]/,
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [
        compilerPreset,
      ],
    }),
  ],
  resolve: {
    tsconfigPaths: false,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom/client",
      "react/jsx-runtime",
      "lucide-react",
      "echarts/core",
      "echarts/charts",
      "echarts/components",
      "echarts/renderers",
    ],
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    warmup: {
      clientFiles: [
        "./src/main.jsx",
        "./src/App.jsx",
        "./src/pages/DashboardPage/DashboardPage.jsx",
        "./src/components/Dashboard/DashboardCharts.jsx",
      ],
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5050",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.error("[vite-proxy]", err.message);
          });
        },
      },
    },
  },
})
