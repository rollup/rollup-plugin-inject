var assert = require('assert');
var path = require('path');
var rollup = require('rollup');
var inject = require('..');

process.chdir(__dirname);

describe('rollup-plugin-inject', function () {
	it('inserts a default import statement', function () {
		return rollup
			.rollup({
				input: 'samples/basic/main.js',
				plugins: [inject({ $: 'jquery' })],
				external: ['jquery']
			})
			.then(function (bundle) {
				return bundle.generate({ format: 'es' });
			})
			.then(function (generated) {
				var code = generated.code;

				assert.ok(
					code.indexOf('import $ from \'jquery\'') !== -1,
					generated.code
				);
			});
	});

	it('uses the modules property', function () {
		return rollup
			.rollup({
				input: 'samples/basic/main.js',
				plugins: [
					inject({
						modules: { $: 'jquery' }
					})
				],
				external: ['jquery']
			})
			.then(function (bundle) {
				return bundle.generate({ format: 'es' });
			})
			.then(function (generated) {
				var code = generated.code;

				assert.ok(
					code.indexOf('import $ from \'jquery\'') !== -1,
					generated.code
				);
			});
	});

	it('inserts a named import statement', function () {
		return rollup
			.rollup({
				input: 'samples/named/main.js',
				plugins: [inject({ Promise: ['es6-promise', 'Promise'] })],
				external: ['es6-promise']
			})
			.then(function (bundle) {
				return bundle.generate({ format: 'es' });
			})
			.then(function (generated) {
				var code = generated.code;

				assert.ok(
					code.indexOf('import { Promise } from \'es6-promise\'') !== -1,
					generated.code
				);
			});
	});

	it('overwrites keypaths', function () {
		return rollup
			.rollup({
				input: 'samples/keypaths/main.js',
				plugins: [
					inject({
						'Object.assign': path.resolve(
							'samples/keypaths/polyfills/object-assign.js'
						)
					})
				]
			})
			.then(function (bundle) {
				return bundle.generate({ format: 'es' });
			})
			.then(function (generated) {
				var code = generated.code;

				assert.notEqual(
					code.indexOf('var clone = $inject_Object_assign'),
					-1,
					code
				);
				assert.notEqual(code.indexOf('var $inject_Object_assign ='), -1, code);
			});
	});

	it('ignores existing imports', function () {
		return rollup
			.rollup({
				input: 'samples/existing/main.js',
				plugins: [inject({ $: 'jquery' })],
				external: ['jquery']
			})
			.then(function (bundle) {
				return bundle.generate({ format: 'es' });
			})
			.then(function (generated) {
				var code = generated.code;

				code = code.replace(/import \$.+/, ''); // remove first instance. there shouldn't be a second

				assert.ok(
					code.indexOf('import $ from \'jquery\'') === -1,
					generated.code
				);
			});
	});

	it('handles shadowed variables', function () {
		return rollup
			.rollup({
				input: 'samples/shadowing/main.js',
				plugins: [inject({ $: 'jquery' })],
				external: ['jquery']
			})
			.then(function (bundle) {
				return bundle.generate({ format: 'es' });
			})
			.then(function (generated) {
				var code = generated.code;

				assert.ok(code.indexOf('\'jquery\'') === -1, generated.code);
			});
	});

	it('handles shorthand properties', function () {
		return rollup
			.rollup({
				input: 'samples/shorthand/main.js',
				plugins: [inject({ Promise: ['es6-promise', 'Promise'] })],
				external: ['es6-promise']
			})
			.then(function (bundle) {
				return bundle.generate({ format: 'es' });
			})
			.then(function (generated) {
				var code = generated.code;

				assert.ok(
					code.indexOf('import { Promise } from \'es6-promise\'') !== -1,
					generated.code
				);
			});
	});

	it('handles redundant keys', function () {
		return rollup
			.rollup({
				input: 'samples/redundant-keys/main.js',
				plugins: [
					inject({
						Buffer: 'Buffer',
						'Buffer.isBuffer': 'is-buffer'
					})
				],
				external: ['Buffer', 'is-buffer']
			})
			.then(function (bundle) {
				assert.deepEqual(bundle.imports, ['is-buffer']);
			});
	});

	it('generates * imports', function () {
		return rollup
			.rollup({
				input: 'samples/import-namespace/main.js',
				plugins: [inject({ foo: ['foo', '*'] })],
				external: ['foo']
			})
			.then(function (bundle) {
				return bundle.generate({ format: 'es' });
			})
			.then(function (generated) {
				var code = generated.code;

				assert.ok(
					code.indexOf('import { bar, baz } from \'foo\'') !== -1,
					generated.code
				);
			});
	});

	it('transpiles non-JS files but handles failures to parse', function () {
		return rollup
			.rollup({
				input: 'samples/non-js/main.js',
				plugins: [
					inject({ relative: ['path', 'relative'] }),
					{
						transform (code, id) {
							if (/css/.test(id)) {
								return '';
							}
						}
					}
				],
				external: ['path']
			})
			.then(function (bundle) {
				return bundle.generate({ format: 'cjs' });
			})
			.then(function (generated) {
				var code = generated.code;

				var fn = new Function('require', 'assert', code);
				fn(require, assert);
			});
	});
});
