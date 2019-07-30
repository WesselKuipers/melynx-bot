module.exports = {
  env: {
    es6: true,
    node: true
  },
  extends: ["airbnb-base", "plugin:prettier/recommended"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module"
  },
  rules: {
    "no-param-reassign": [
      "error",
      { props: true, ignorePropertyModificationsFor: ["client"] }
    ],
    "prettier/prettier": ["error", { "singleQuote": true, "trailingComma": 'es5'}],
  }
};