import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This allows process.env.API_KEY to work in the browser on Vercel
    // by replacing the string with the value during the build process.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild',
    reportCompressedSize: false
  },
  server: {
    port: 3000,
    host: true
  }
});