import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_PRODUCTION_BASE = '/place-and-see/';

function normalizeBase(base: string): string {
  const path = base.trim().replace(/\\/g, '/').replace(/\/{2,}/g, '/').replace(/^\/+|\/+$/g, '');
  return path ? `/${path}/` : '/';
}

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : normalizeBase(process.env.VITE_BASE_PATH ?? DEFAULT_PRODUCTION_BASE),
  plugins: [react()],
}));
