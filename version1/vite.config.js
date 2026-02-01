import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Asegura que los links funcionen en cualquier subcarpeta (vital para GH Pages)
  build: {
    outDir: 'dist'
  }
});