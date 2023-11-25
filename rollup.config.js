import nodeExternals from "rollup-plugin-node-externals";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

// rollup.config.js
/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: "src/app.ts",
  output: {
    format: "es",
    dir: "./api",
  },
  plugins: [
    nodeResolve(),
    typescript({
      outDir: "./api",
    }),
    nodeExternals(),
  ],
};
export default config;
