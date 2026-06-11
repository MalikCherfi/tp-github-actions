import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "error",
      "no-console": "warn",
      semi: ["error", "always"],
      quotes: ["error", "single"],
      indent: ["error", 2],
      "max-len": ["error", { code: 100 }],
    },
  },
];
