import globals from "globals";
import nextConfig from "eslint-config-next/core-web-vitals";

const config = [
  ...nextConfig,
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/vitest.setup.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];

export default config;
