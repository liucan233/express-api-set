import nodeExternals from 'rollup-plugin-node-externals';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import jsonSupport from '@rollup/plugin-json';

// rollup.config.js
/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: 'src/app.ts',
  output: {
    format: 'es',
    dir: './api',
    sourcemap: 'hidden',
  },
  plugins: [
    nodeResolve(),
    typescript({
      outDir: './api',
    }),
    nodeExternals(),
    commonjs(),
    jsonSupport(),
  ],
};
export default config;
