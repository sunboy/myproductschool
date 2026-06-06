import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // eslint-config-next already loads jsx-a11y plugin; here we elevate all
    // recommended rules from warn → error so CI fails on violations.
    rules: {
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/media-has-caption': 'error',
      'jsx-a11y/mouse-events-have-key-events': 'error',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-autofocus': 'error',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
      'jsx-a11y/no-noninteractive-tabindex': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',
    },
  },
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
    // Sandbox container runtime scripts (Node CommonJS, built into the Docker
    // image — never bundled by Next). They legitimately use require(); linting
    // them as app TS is wrong and breaks CI.
    "infra/**",
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
  {
    // Prevent importing mock-live-interviews or mock-data outside of files that explicitly
    // gate on IS_MOCK. Note: @/lib/mock (IS_MOCK itself) is always safe — it has a
    // built-in production guard. The fixture modules below are what you never want
    // to import from a server component or API route without checking IS_MOCK first.
    // Add specific fixture modules here as the codebase grows.
    files: ["src/app/page.tsx", "src/app/layout.tsx"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/lib/mock-data", "@/lib/mock-live-interviews"],
            message: "Root layout/page must never import mock fixture modules. They are dev-only."
          }
        ]
      }]
    }
  },
]);

export default eslintConfig;
