import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".worktrees/**",
    "_archived/**",
    "public/sql.js/**",
    "public/talkinghead/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // React 19's compiler-oriented lint rules are useful during refactors, but
      // this app has many established effect-driven client components. Keep
      // launch lint focused on actionable correctness without rewriting UI flows.
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["scripts/**/*.{js,mjs,cjs,ts,tsx}"],
    rules: {
      // Ingestion/maintenance scripts parse third-party JSON where strict shapes
      // would add noise without improving the launch app surface.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
