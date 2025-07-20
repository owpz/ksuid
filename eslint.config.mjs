import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      "dist/**/*",
      "build/**/*",
      "coverage/**/*",
      "node_modules/**/*",
      "*.d.ts.map",
      "*.js.map",
      "docs/_build/**/*",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        Buffer: "readonly",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        global: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        setImmediate: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        clearImmediate: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      // Override JS rules for TypeScript
      "no-unused-vars": "off",

      // TypeScript-specific rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/array-type": ["error", { default: "array" }],
      "prefer-const": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],

      // General code quality rules
      "no-console": ["warn", { allow: ["log", "warn", "error"] }],
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-arrow-callback": "error",

      // Security and best practices
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-return-assign": "error",
      "no-self-compare": "error",
      "no-sequences": "error",
      "no-throw-literal": "error",
      "no-unmodified-loop-condition": "error",
      "no-unused-expressions": "error",
      "no-useless-call": "error",
      "no-useless-concat": "error",
      "no-useless-return": "error",

      // Allow precision loss for crypto/math operations
      "no-loss-of-precision": "off",
    },
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        Buffer: "readonly",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        global: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        setImmediate: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        clearImmediate: "readonly",
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "prefer-const": "error",
      "no-var": "error",
    },
  },
  {
    files: ["test/**/*.ts", "test/**/*.js"],
    rules: {
      // Relax some rules for test files
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      "no-unused-expressions": "off",
      "no-control-regex": "off", // Tests may include control characters
    },
  },
  {
    files: ["scripts/**/*.js", "*.config.js", "*.config.mjs"],
    rules: {
      // Allow console logs in scripts and config files
      "no-console": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  {
    files: [
      "docs/**/*.ts",
      "docs/**/*.js",
      "examples/**/*.ts",
      "examples/**/*.js",
    ],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
      },
    },
    rules: {
      // Relax rules for documentation and examples
      "no-console": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  prettier, // Must be last to override other formatting rules
];
