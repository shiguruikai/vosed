import stylistic from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  // ESLint Stylisticのcustomize()によるデフォルト設定は、以下のソースコードを参照すること。
  // https://github.com/eslint-stylistic/eslint-stylistic/blob/main/packages/eslint-plugin/configs/customize.ts
  stylistic.configs.customize({
    arrowParens: true,
    quotes: 'single',
    semi: true,
    severity: 'warn',
    braceStyle: '1tbs',
  }),
  {
    plugins: {
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // 可能な限りシングルクォーテーションを使用する。
      '@stylistic/quotes': ['warn', 'single', { allowTemplateLiterals: 'avoidEscape', avoidEscape: true }],
      '@stylistic/jsx-quotes': ['warn', 'prefer-single'],
      // 子要素を持たない要素はセルフクロージングタグを使用する。
      '@stylistic/jsx-self-closing-comp': 'warn',
      // 不要なセミコロンを禁止する。
      '@stylistic/no-extra-semi': 'warn',
      // セミコロンは文末に付ける。
      '@stylistic/semi-style': ['warn', 'last'],
      // anyの使用を許可する。
      '@typescript-eslint/no-explicit-any': 'off',
      // 未使用のimportを禁止する。
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // imports および exports をソートする。
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
    },
  },
]);

export default eslintConfig;
