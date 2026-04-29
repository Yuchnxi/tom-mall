import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';

export default [
  {
    ignores: [ 'dist/**', 'node_modules/**' ],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: [ '**/*.vue', '**/*.js' ],
    languageOptions: {
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': [ 'error', { argsIgnorePattern: '^_' } ],
    },
  },
];
