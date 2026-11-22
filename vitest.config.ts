import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Mirror @rollup/plugin-image in the production build: a PNG import becomes a base64
// data URI string. Without this, Vite resolves PNG imports to /images/... URL paths, so a
// test cannot tell a bundled asset from a path that would 404 at runtime.
const inlinePng = {
  name: 'inline-png-as-data-uri',
  enforce: 'pre' as const,
  load(id: string) {
    const file = id.split('?')[0];
    if (!file.endsWith('.png')) return null;
    return `export default ${JSON.stringify('data:image/png;base64,' + readFileSync(file).toString('base64'))};`;
  },
};

export default defineConfig({
  plugins: [inlinePng],
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/types.ts'],
    },
  },
});
