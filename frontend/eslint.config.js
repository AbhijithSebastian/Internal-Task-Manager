import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

/**
 * Flat ESLint config.
 *
 * Type-aware linting is deliberately left off: `tsc --noEmit` already runs as
 * its own CI step and catches type errors faster than the lint parser would.
 * ESLint here is for correctness smells and house rules that TypeScript cannot
 * express — hooks ordering, accidental `console`, raw colour literals.
 */
export default tseslint.config(
  {
    ignores: ["dist", "node_modules", "coverage", "playwright-report", "test-results"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
    },
  },
  {
    // Design tokens are the only place raw colour values may appear.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/design-system/tokens/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
          message:
            "Raw hex colours are not allowed outside src/design-system/tokens. Use a design-system token or Tailwind class instead.",
        },
        {
          selector: "Literal[value=/^(?:rgb|rgba|hsl|hsla)\\(/]",
          message:
            "Raw rgb/hsl colours are not allowed outside src/design-system/tokens. Use a design-system token instead.",
        },
      ],
    },
  },
  {
    files: [
      "vite.config.ts",
      "tailwind.config.js",
      "postcss.config.js",
      "eslint.config.js",
      "scripts/**/*.mjs",
    ],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["e2e/**/*.ts"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-console": "off",
    },
  },
);
