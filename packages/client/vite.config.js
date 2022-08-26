import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
      },
    ],
    extensions: ['.js', '.ts', '.tsx', '.json'],
  },
  envDir: '../..',
  plugins: [react()],
  build: {
    rollupOptions: {},
    target: ['es2020'],
  },
});
