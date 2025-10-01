import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  sourcemap: false,
  clean: true,
  shims: true,
  splitting: false,
  bundle: true,
  external: [
    '@modelcontextprotocol/sdk',
    'resend'
  ],
  esbuildOptions(options) {
    options.jsx = 'automatic';
    options.jsxImportSource = 'react';
  }
});
