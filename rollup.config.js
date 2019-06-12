const external = Object.keys(require("./package.json").dependencies).concat("path");

export default {
  input: "src/index.js",
  external: external,
  output: [
    { file: "dist/rollup-plugin-inject.cjs.js", format: "cjs" },
    { file: "dist/rollup-plugin-inject.es6.js", format: "esm" }
  ]
};
