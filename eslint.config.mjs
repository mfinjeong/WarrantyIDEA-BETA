import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Plain links work on static hosts without client-side routing.
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
  globalIgnores([
    ".next/**",
    "out/**",
    "test-results/**",
    "playwright-report/**",
    "next-env.d.ts",
  ]),
]);
