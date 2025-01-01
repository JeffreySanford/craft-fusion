const path = require('path');
const webpack = require('webpack');

module.exports = {
  resolve: {
    fallback: {
      fs: false,
      stream: require.resolve('stream-browserify'),
      constants: require.resolve('constants-browserify'),
      path: require.resolve('path-browserify'),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};
