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
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Guardrail: only the service layer may open a DB connection.
  // Schema *types* stay importable everywhere; the client does not.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/services/**", "src/db/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/db/client",
              message:
                "Only files under src/services/ may import the DB client (see AGENTS.md).",
            },
          ],
          patterns: [
            {
              group: ["**/db/client", "**/db/client.*"],
              message:
                "Only files under src/services/ may import the DB client (see AGENTS.md).",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
