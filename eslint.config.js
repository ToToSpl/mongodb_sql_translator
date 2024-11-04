const tseslint = require('typescript-eslint');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = tseslint.config(
  eslintPluginPrettierRecommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['**/*.js', 'eslint.config.js'],
  }
);
