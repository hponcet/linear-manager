import { fileURLToPath } from "node:url"

import { includeIgnoreFile } from "@eslint/compat"
import js from "@eslint/js"
import json from "@eslint/json"
import markdown from "@eslint/markdown"
import { defineConfig } from "eslint/config"
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript"
import importPlugin from "eslint-plugin-import"
import eslintConfigPrettier from "eslint-plugin-prettier/recommended"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import globals from "globals"
import tseslint from "typescript-eslint"

const gitignorePath = fileURLToPath(new URL(".lint-ignore", import.meta.url))

export default defineConfig([
  includeIgnoreFile(gitignorePath, "Imported .gitignore patterns"),

  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReactHooks.configs.flat.recommended,
  importPlugin.flatConfigs.recommended,

  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: {
      js,
    },
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "no-unused-vars": "off",
      "no-irregular-whitespace": "error",
      "no-empty": "error",
      "no-unsafe-optional-chaining": "error",
      "no-prototype-builtins": "error",
      "no-useless-escape": "error",
      "no-else-return": 0,
      "no-nested-ternary": 0,
      "no-plusplus": 0,
      "no-continue": 0,
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-use-before-define": ["error", { variables: false }],
      "no-shadow": 0,
      "linebreak-style": 0,
      "default-param-last": 0,
      "class-methods-use-this": 0,
      "lines-between-class-members": 0,

      "no-promise-executor-return": 0,
      "promise/param-names": 0,
      "no-await-in-loop": 0,
      "no-restricted-syntax": 0,

      "promise/always-return": 0,
      "consistent-return": 0,

      "react/no-unknown-property": 0,
      "react/prop-types": 0,
      "react-hooks/rules-of-hooks": 0,
      "react-hooks/exhaustive-deps": 0,
      "react/react-in-jsx-scope": 0,
      "react/jsx-filename-extension": 0,
      "react/no-did-update-set-state": 0,
      "react/jsx-no-bind": [
        "error",
        {
          allowFunctions: true,
          allowArrowFunctions: true,
        },
      ],
      "react/sort-comp": 0,
      "react/jsx-props-no-spreading": 0,
      "react/no-unused-class-component-methods": 1,
      "react/function-component-definition": 0,
      "react/require-default-props": "off",
      "react/static-property-placement": "off",
      "react-hooks/set-state-in-effect": 0,
      "@typescript-eslint/interface-name-prefix": 0,
      "@typescript-eslint/no-empty-interface": 0,
      "@typescript-eslint/ban-ts-comment": 0,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          caughtErrors: "none",
          ignoreClassWithStaticInitBlock: true,
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": 0,
      "@typescript-eslint/no-inferrable-types": 0,
      "@typescript-eslint/no-non-null-assertion": 0,
      "@typescript-eslint/no-use-before-define": 0,
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/camelcase": "off",
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/no-empty-function": "error",
      "@typescript-eslint/explicit-member-accessibility": "off",
      "@typescript-eslint/no-unsafe-function-type": 0,
      "@typescript-eslint/no-require-imports": 0,

      "prettier/prettier": [2, { endOfLine: "auto" }],

      "import/no-cycle": 0, // cycle import -> Circular Dependencies off
      "import/no-extraneous-dependencies": 0,
      "import/extensions": 0,
      "import/no-unresolved": 0,
      "import/no-import-module-exports": 0,
      "import/prefer-default-export": 0,
      "import/no-named-as-default-member": 0,
      "import/order": [
        "error",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          groups: [
            "builtin", // Built-in imports (come from NodeJS native) go first
            "external", // <- External imports
            "internal", // <- Absolute imports
            "sibling",
            "parent",
            "index", // <- index imports
            "type",
            "object", // <- Object imports
            "unknown", // <- unknown
          ],
          pathGroups: [
            {
              pattern: "**/*.{scss,css}",
              group: "unknown",
              position: "after",
            },
            {
              pattern: "./**/*.{scss,css}",
              group: "unknown",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
          warnOnUnassignedImports: true,
        },
      ],

      "jsx-a11y/alt-text": 0,
      "jsx-a11y/label-has-associated-control": 0,
      "jsx-a11y/no-noninteractive-element-interactions": 0,
      "jsx-a11y/click-events-have-key-events": 0,
      "jsx-a11y/no-static-element-interactions": 0,
      "jsx-a11y/anchor-is-valid": 0,
      "jsx-a11y/no-noninteractive-tabindex": 0,
      "jsx-a11y/media-has-caption": 0,
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
      "import-x/resolver-next": [createTypeScriptImportResolver({ alwaysTryTypes: true })],
    },
  },

  {
    files: ["**/*.jsonc"],
    plugins: { json: json as any },
    language: "json/jsonc",
    extends: ["json/recommended"],
  },

  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/commonmark",
    extends: ["markdown/recommended"],
  },

  eslintConfigPrettier,
])
