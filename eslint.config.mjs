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
  {
    rules: {
      // We intentionally sync state inside effects when subscribing to Firestore
      // (onSnapshot) / Firebase Auth and when resetting derived state as deps
      // change. These are the documented "subscribe to an external store"
      // patterns, so we surface them as warnings rather than hard errors.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
