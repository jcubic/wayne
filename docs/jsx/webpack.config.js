const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './sw.jsx',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'sw.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules)/,
        use: 'babel-loader',
      },
    ],
  },
  plugins: [new webpack.ProgressPlugin()]
};