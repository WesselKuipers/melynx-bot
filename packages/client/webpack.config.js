require('@babel/polyfill');
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, { mode }) => {
  const production = mode === 'production';

  return {
    mode,
    entry: ['@babel/polyfill', path.join(__dirname, 'src')],
    // Enable sourcemaps for debugging webpack's output.
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
        },
        // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
        {
          enforce: 'pre',
          test: /\.js$/,
          loader: 'source-map-loader',
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ['babel-loader'],
        },
        {
          test: /\.css$/,
          oneOf: [
            {
              include: /node_modules/,
              use: [
                'style-loader',
                { loader: 'css-loader', options: { modules: false } },
              ],
            },
            {
              use: [
                {
                  loader: MiniCssExtractPlugin.loader,
                  options: {
                    hmr: !production,
                  },
                },
                { loader: 'css-loader', options: { modules: true } },
              ],
            },
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[path][name].[ext]',
              },
            },
          ],
        },
        {
          test: /\.svg$/,
          loader: 'svgo-loader',
        },
        {
          test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
                outputPath: 'fonts/',
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
    },
    output: {
      path: `${__dirname}/dist`,
      publicPath: '/',
      filename: production ? '[hash].js' : '[name].js',
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new HtmlWebpackPlugin({
        favicon: path.join(__dirname, 'src', 'assets', 'icon.png'),
        template: path.join(__dirname, 'src', 'index.html'),
      }),
      new MiniCssExtractPlugin({
        filename: production ? '_/[hash].css' : '[name].css',
      }),
    ],
    devServer: {
      contentBase: './dist',
    },
  };
};
