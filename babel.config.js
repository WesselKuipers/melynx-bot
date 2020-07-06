module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-react'],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    [
      'import',
      {
        libraryName: 'antd',
        style: 'css',
      },
    ],
  ],
};
