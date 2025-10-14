module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    sourceType: 'module',
    tsconfigRootDir: __dirname
  },
  plugins: ['@typescript-eslint'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:@typescript-eslint/stylistic', 'plugin:promise/recommended'],
  ignorePatterns: ['dist', 'node_modules'],
  env: {
    node: true,
    es2022: true
  },
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off'
  }
};
