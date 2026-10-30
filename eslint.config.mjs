import js from "@eslint/js";
import globals from "globals";

export default [
  // audio.js can be cleaned up separately; start with the game and new tooling.
  { ignores: ["dist/audio.js"] },
  js.configs.recommended,
  {
    files: ["dist/game.js"],
    languageOptions: {
      sourceType: "script",
      globals: globals.browser,
    },
    rules: {
      // Braces make it easier to see which lines belong to an if or loop.
      curly: "error",
      eqeqeq: "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["*.mjs", "tests/*.mjs"],
    languageOptions: { globals: globals.node },
  },
];
