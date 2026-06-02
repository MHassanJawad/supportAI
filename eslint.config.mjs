import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["node_modules/**", ".next/**", "dist/**", "coverage/**"]
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: ["./apps/api/tsconfig.json", "./apps/web/tsconfig.json", "./packages/shared/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      "@typescript-eslint": typescriptEslint
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { "argsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" }
      ],
      "@typescript-eslint/consistent-type-imports": "error"
    }
  }
];
