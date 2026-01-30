// Load root .env first so shared values are available; Next.js then loads frontend/.env*
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002',
  },
};

module.exports = nextConfig;
