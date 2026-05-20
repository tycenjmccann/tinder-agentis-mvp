/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/components/sidebar/**/*.{ts,tsx}'],
      exclude: ['**/__tests__/**', '**/*.test.*', '**/index.ts'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'sidebar': [
            './src/components/sidebar/SidebarNavigation.tsx',
            './src/components/sidebar/AgentStatusPanel.tsx',
            './src/components/sidebar/WorkflowHistoryList.tsx',
          ],
        },
      },
    },
  },
});
