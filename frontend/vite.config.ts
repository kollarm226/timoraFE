import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig(({ mode }) => ({
  plugins: [angular()],
  define: {
    'import.meta.vitest': mode !== 'production',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test.ts'],
  },
}));
