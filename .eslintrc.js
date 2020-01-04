module.exports = {
  env: {
    es6: true,
    node: true
  },
  extends: ["airbnb", "prettier", "plugin:prettier/recommended"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  },
  parser: "babel-eslint",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module"
  },
  plugins: ["simple-import-sort", "prettier"],
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"]
      }
    }
  },
  rules: {
    "no-param-reassign": [
      "error",
      { props: true, ignorePropertyModificationsFor: ["client"] }
    ],
    "new-cap": ["error", { newIsCap: false }],
    "prettier/prettier": ["error", { singleQuote: true, trailingComma: "es5" }],
    "react/state-in-constructor": "off",
    "react/prop-types": "off",
    "simple-import-sort/sort": "error",
    "import/no-unresolved": "off",
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never"
      }
    ]
  }
};
