const path = require('path');
// Root .env first (shared), then frontend/.env so frontend overrides (e.g. NEXT_PUBLIC_API_URL)
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true });

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  env: {
    // Only base origin (no path): e.g. https://memoon-card.localhost or http://localhost:4002
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002',
  },
  // Prevent infinite reload in Docker (--webpack forces webpack so this applies)
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        aggregateTimeout: 600,
        ignored: ['**/node_modules', '**/.git', '**/.next', '**/dist', '**/.yarn'],
      };
    }
    return config;
  },
};

module.exports = nextConfig;
