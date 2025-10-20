import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry file
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'outputs/electron',
            minify: false,
            rollupOptions: {
              external: [
                'electron',
                'electron-store',
                'child_process',
                'fs',
                'path',
                'url',
                'axios'
              ],
              output: {
                format: 'cjs',
                entryFileNames: '[name].js',
                // Preserve named imports for CommonJS
                exports: 'named',
                interop: 'auto'
              }
            }
          }
        }
      },
      {
        // Preload script
        entry: 'electron/preload.ts',
        onstart(options) {
          // Notify the Renderer process to reload the page when the Preload scripts build is complete
          options.reload();
        },
        vite: {
          build: {
            outDir: 'outputs/electron',
            minify: false,
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs',
                entryFileNames: '[name].js'
              }
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './sources'),
      '@electron': path.resolve(__dirname, './electron')
    }
  },
  base: './',
  server: {
    port: 0, // Use random available port assigned by OS
    strictPort: false,
  },
  build: {
    outDir: 'outputs/renderer',
    emptyOutDir: true
  }
});
