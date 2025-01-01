module.exports = {
  // ...existing code...
  resolve: {
    extensions: ['.ts', '.js', '.mjs'],
    fallback: {
      "fs": false,
      "util": require.resolve("util/"),
      "assert": require.resolve("assert/"),
      "stream": require.resolve("stream-browserify"),
      "constants": require.resolve("constants-browserify"),
      "process": require.resolve("process/browser"),
      "path": require.resolve("path-browserify"),
      "url": require.resolve("url/")
    }
  },
  module: {
    rules: [
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  // ...existing code...
};
