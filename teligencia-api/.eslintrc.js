module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'no-secrets'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    /*
     * Constitution Rule 4 — no secrets in source.
     * `no-secrets` scans string literals for high-entropy tokens that
     * look like JWTs, API keys, AWS keys, etc. Tuned to ignore the
     * common placeholder shapes used in .env.example + tests.
     */
    'no-secrets/no-secrets': [
      'error',
      {
        tolerance: 4.2,
        ignoreContent: [
          '<replace>',
          '<service-role-jwt>',
          'pk_test_<replace>',
          'sk_test_<replace>',
          'whsec_<replace>',
          'pk_live_<replace-at-deploy>',
        ],
        ignoreModules: true,
      },
    ],
  },
};
