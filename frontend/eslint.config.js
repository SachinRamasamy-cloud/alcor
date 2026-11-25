import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  { ignores: ['dist', 'test-results', 'playwright-report', 'src/shared/api/schema.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-imports': ['error', { patterns: [{ group: ['**/features/*/components/*', '**/features/*/model/*'], message: 'Import a feature through its narrow public interface.' }] }],
    },
  },
  { files: ['src/shared/**/*.{ts,tsx}'], rules: { 'no-restricted-imports': ['error', { patterns: ['**/features/**', '**/entities/**', '**/pages/**', '**/widgets/**'] }] } },
)
