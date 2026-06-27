import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@krypton/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@krypton/engine': path.resolve(__dirname, '../../packages/engine/src/index.ts'),
      '@krypton/network': path.resolve(__dirname, '../../packages/network/src/index.ts'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});
