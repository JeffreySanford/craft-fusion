const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
  entryPoints: [path.resolve(__dirname, 'src/main.ts')],
  bundle: true,
  outdir: path.resolve(__dirname, '../../dist/apps/craft-web'),
  define: {
    'process.env.NODE_ENV': '"production"',
    global: 'window',
  },
  inject: [path.resolve(__dirname, 'src/polyfills.js')],
  plugins: [
    {
      name: 'node-polyfills',
      setup(build) {
        build.onResolve({ filter: /^path$/ }, () => ({ path: require.resolve('path-browserify') }));
        build.onResolve({ filter: /^util$/ }, () => ({ path: require.resolve('util/') }));
        build.onResolve({ filter: /^assert$/ }, () => ({ path: require.resolve('assert/') }));
        build.onResolve({ filter: /^stream$/ }, () => ({ path: require.resolve('stream-browserify') }));
        build.onResolve({ filter: /^constants$/ }, () => ({ path: require.resolve('constants-browserify') }));
        build.onResolve({ filter: /^process$/ }, () => ({ path: require.resolve('process/browser') }));
      },
    },
  ],
}).catch(() => process.exit(1));
