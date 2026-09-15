import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import globals from "globals";

/**
 * Lint 策略（2026-08）：
 * - 只管「正确性」，不管格式（格式交给编辑器，避免全库重排的海量 diff）
 * - 渲染层 src/ + tests/ 走 TS/Vue 规则；electron/*.cjs 与脚本走 Node 全局
 * - 个别遗留模式（any 断言、非空断言）降为 warn，逐步清理不阻塞
 */
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "release/**",
      "node_modules/**",
      "coverage/**",
      "qa-shots/**",
      "qa-user-data/**",
      "design/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    files: ["src/**/*.{ts,vue}", "tests/**/*.ts"],
    languageOptions: {
      globals: { ...globals.browser }
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-console": "off",
      "prefer-const": "warn",
      // wc 是全局共享 store（reactive(useWageClaw())）经 props 下发，
      // 模板里直接改 wc.* 是本项目的状态管理模式，非误用 —— 关闭该规则
      "vue/no-mutating-props": "off"
    }
  },
  {
    files: ["src/**/*.vue"],
    languageOptions: {
      parserOptions: { parser: tseslint.parser }
    }
  },
  {
    files: ["electron/**/*.cjs", "scripts/*.cjs", "*.cjs"],
    languageOptions: {
      globals: { ...globals.node }
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }]
    }
  },
  {
    files: ["scripts/*.mjs"],
    languageOptions: {
      globals: { ...globals.node }
    }
  }
);
