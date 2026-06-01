import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  },
  {
    files: ["*.vue", "**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },
  {
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/no-v-html": "warn",
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },
  {
    ignores: ["dist/", "release/", "electron/", "node_modules/"]
  }
);
