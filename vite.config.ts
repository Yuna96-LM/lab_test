/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project site: https://<owner>.github.io/lab_test/
export default defineConfig({
  base: '/lab_test/',
  plugins: [react()],
  // ucum-lhc ships its full unit table (~400 kB) — expected to exceed the default warning size.
  build: { chunkSizeWarningLimit: 800 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
