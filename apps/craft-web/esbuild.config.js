import { build as _build } from 'esbuild';
import { resolve } from 'path';

_build({
  entryPoints: [
    resolve(__dirname, 'src/polyfills.ts'),
    resolve(__dirname, 'src/main.ts')
  ],
  bundle: true,
  outdir: resolve(__dirname, '../../dist/apps/craft-web'),
  define: {
    'process.env.NODE_ENV': '"production"',
    global: 'window',
  },
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
        build.onResolve({ filter: /^fs$/ }, () => ({ path: resolve(__dirname, 'empty-module.js') })); // Use the empty module
      },
    },
  ],
  external: ['tslib']
}).catch(() => process.exit(1));
