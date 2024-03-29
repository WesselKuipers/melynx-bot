module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [
    'prettier',
    'prettier/react',
    'react-app',
    'eslint:recommended',
    'plugin:react/recommended',
    'prettier/@typescript-eslint',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint', 'simple-import-sort'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-submodule-imports': 'off',
    '@typescript-eslint/no-unused-expressions': 'warn',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/jsx-no-lambda': 'off',
    '@typescript-eslint/prefer-interface': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/camelcase': 'off',
    'simple-import-sort/sort': 'warn',
    'no-console': 'off',
    'sort-keys': 'off',
    'sort-imports': 'off',
  },
  ignorePatterns: ['dist'],
};
