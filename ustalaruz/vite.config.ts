import {execSync} from 'child_process';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Vercel sets this at build time without needing the .git dir; falls back to
// running git directly for local `npm run build` / `npm run dev`.
function getGitSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

// Commit date where available (matches the backend's own GIT_COMMIT_DATE,
// core/settings.py) - falls back to the build date, since Vercel builds
// from a source tarball with no .git dir, so `git log` isn't available
// there. Deploys follow a push immediately in this workflow, so the two
// dates coincide in practice.
function getGitDate(): string {
  try {
    return execSync("git log -1 --format=%cd --date=format:%Y-%m-%d").toString().trim();
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export default defineConfig(() => {
  return {
    define: {
      __APP_VERSION__: JSON.stringify(getGitSha()),
      __APP_VERSION_DATE__: JSON.stringify(getGitDate()),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
            if (id.includes('node_modules/recharts')) return 'vendor-charts';
            if (id.includes('node_modules/motion')) return 'vendor-motion';
            if (id.includes('node_modules/react-router-dom')) return 'vendor-router';
          },
        },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
