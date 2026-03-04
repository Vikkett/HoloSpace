import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: 'src',
    server: {
      port: 5173,      // Force this port
      strictPort: true // Don't auto-change if taken
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    }
  });