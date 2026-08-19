import { defineConfig } from 'eslint/config'
import pluginSecurity from 'eslint-plugin-security'
import eslintConfigPrettier from 'eslint-config-prettier'

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  eslintConfigPrettier,
  pluginSecurity.configs.recommended,
  {
    rules: {
      'no-unused-vars': 0,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
)
