import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig, loadEnv} from 'vite';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const serverHost = env.HOST || 'localhost';
  const serverPort = Number(env.PORT || 3000);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': currentDir,
      },
    },
    build: {
      modulePreload: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }

            if (id.includes('node_modules/recharts')) {
              return 'vendor-recharts';
            }

            if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
              return 'vendor-export';
            }

            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')
            ) {
              return 'vendor-react';
            }

            if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) {
              return 'vendor-motion';
            }

            if (
              id.includes('node_modules/@tanstack/react-query') ||
              id.includes('node_modules/zustand') ||
              id.includes('node_modules/zod')
            ) {
              return 'vendor-state';
            }

            if (id.includes('node_modules/axios')) {
              return 'vendor-axios';
            }
          },
        },
      },
    },
    server: {
      host: serverHost,
      port: serverPort,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: false,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
        '/media': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    logger: {
      warn: (msg: string, options?: any) => {
        // Suppress non-critical warnings about lazy-loaded images
        if (msg.includes('loaded lazily') || msg.includes('Lazy Image')) {
          return;
        }
        console.warn(msg, options);
      }
    }
  };
});
