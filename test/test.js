const assert = require("assert");
const path = require("path");
const { rollup } = require("rollup");
const inject = require("..");

process.chdir(__dirname);

describe("rollup-plugin-inject", () => {
  it("inserts a default import statement", async () => {
    const bundle = await rollup({
      input: "samples/basic/main.js",
      plugins: [inject({ $: "jquery" })],
      external: ["jquery"]
    });

    const { output } = await bundle.generate({ format: "es" });

    const { code } = output[0];

    assert.ok(code.indexOf("import $ from 'jquery'") !== -1, code);
  });

  it("uses the modules property", async () => {
    const bundle = await rollup({
      input: "samples/basic/main.js",
      plugins: [
        inject({
          modules: { $: "jquery" }
        })
      ],
      external: ["jquery"]
    });

    const { output } = await bundle.generate({ format: "es" });
    const { code } = output[0];

    assert.ok(code.indexOf("import $ from 'jquery'") !== -1, code);
  });

  it("inserts a named import statement", async () => {
    const bundle = await rollup({
      input: "samples/named/main.js",
      plugins: [inject({ Promise: ["es6-promise", "Promise"] })],
      external: ["es6-promise"]
    });

    const { output } = await bundle.generate({ format: "es" });
    const { code } = output[0];

    assert.ok(code.indexOf("import { Promise } from 'es6-promise'") !== -1, code);
  });

  it("overwrites keypaths", async () => {
    const bundle = await rollup({
      input: "samples/keypaths/main.js",
      plugins: [
        inject({
          "Object.assign": path.resolve("samples/keypaths/polyfills/object-assign.js")
        })
      ]
    });
    const { output } = await bundle.generate({ format: "es" });
    const { code } = output[0];

    assert.notEqual(code.indexOf("var clone = $inject_Object_assign"), -1, code);
    assert.notEqual(code.indexOf("var $inject_Object_assign ="), -1, code);
  });

  it("ignores existing imports", async () => {
    const bundle = await rollup({
      input: "samples/existing/main.js",
      plugins: [inject({ $: "jquery" })],
      external: ["jquery"]
    });
    const { output } = await bundle.generate({ format: "es" });
    let { code } = output[0];

    code = code.replace(/import \$.+/, ""); // remove first instance. there shouldn't be a second

    assert.ok(code.indexOf("import $ from 'jquery'") === -1, output[0].code);
  });

  it("handles shadowed variables", async () => {
    const bundle = await rollup({
      input: "samples/shadowing/main.js",
      plugins: [inject({ $: "jquery" })],
      external: ["jquery"]
    });
    const { output } = await bundle.generate({ format: "es" });

    const { code } = output[0];

    assert.ok(code.indexOf("'jquery'") === -1, code);
  });

  it("handles shorthand properties", async () => {
    const bundle = await rollup({
      input: "samples/shorthand/main.js",
      plugins: [inject({ Promise: ["es6-promise", "Promise"] })],
      external: ["es6-promise"]
    });
    const { output } = await bundle.generate({ format: "es" });

    const { code } = output[0];

    assert.ok(code.indexOf("import { Promise } from 'es6-promise'") !== -1, code);
  });

  it("handles redundant keys", async () => {
    const bundle = await rollup({
      input: "samples/redundant-keys/main.js",
      plugins: [
        inject({
          Buffer: "Buffer",
          "Buffer.isBuffer": "is-buffer"
        })
      ],
      external: ["Buffer", "is-buffer"]
    });

    const { output } = await bundle.generate({ format: "es" });

    const { imports } = output[0];

    assert.deepEqual(imports, ["is-buffer"]);
  });

  it("generates * imports", async () => {
    const bundle = await rollup({
      input: "samples/import-namespace/main.js",
      plugins: [inject({ foo: ["foo", "*"] })],
      external: ["foo"]
    });
    const { output } = await bundle.generate({ format: "es" });

    const { code } = output[0];

    assert.ok(code.indexOf("import { bar, baz } from 'foo'") !== -1, code);
  });

  it("transpiles non-JS files but handles failures to parse", async () => {
    const bundle = await rollup({
      input: "samples/non-js/main.js",
      plugins: [
        inject({ relative: ["path", "relative"] }),
        {
          transform(code, id) {
            if (/css/.test(id)) {
              return "";
            }
          }
        }
      ],
      external: ["path"]
    });
    const { output } = await bundle.generate({ format: "cjs" });

    const { code } = output[0];

    const fn = new Function("require", "path", "assert", code);
    fn(require, path, assert);
  });
});
