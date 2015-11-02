var assert = require( 'assert' );
var path = require( 'path' );
var rollup = require( 'rollup' );
var inject = require( '..' );

process.chdir( __dirname );

describe( 'rollup-plugin-inject', function () {
	it( 'inserts a default import statement', function () {
		return rollup.rollup({
			entry: 'samples/basic/main.js',
			plugins: [
				inject({ $: 'jquery' })
			],
			external: [ 'jquery' ]
		}).then( function ( bundle ) {
			var generated = bundle.generate();
			var code = generated.code;

			assert.ok( code.indexOf( "import $ from 'jquery'" ) !== -1, generated.code );
		});
	});

	it( 'uses the modules property', function () {
		return rollup.rollup({
			entry: 'samples/basic/main.js',
			plugins: [
				inject({
					modules: { $: 'jquery' }
				})
			],
			external: [ 'jquery' ]
		}).then( function ( bundle ) {
			var generated = bundle.generate();
			var code = generated.code;

			assert.ok( code.indexOf( "import $ from 'jquery'" ) !== -1, generated.code );
		});
	});

	it( 'inserts a named import statement', function () {
		return rollup.rollup({
			entry: 'samples/named/main.js',
			plugins: [
				inject({ Promise: [ 'es6-promise', 'Promise' ] })
			],
			external: [ 'es6-promise' ]
		}).then( function ( bundle ) {
			var generated = bundle.generate();
			var code = generated.code;

			assert.ok( code.indexOf( "import { Promise } from 'es6-promise'" ) !== -1, generated.code );
		});
	});

	it( 'overwrites keypaths', function () {
		return rollup.rollup({
			entry: 'samples/keypaths/main.js',
			plugins: [
				inject({ 'Object.assign': path.resolve( 'samples/keypaths/polyfills/object-assign.js' ) })
			]
		}).then( function ( bundle ) {
			var generated = bundle.generate();
			var code = generated.code;

			assert.ok( code.indexOf( "var clone = $inject_Object_assign" ) !== -1, generated.code );
			assert.ok( code.indexOf( "var $inject_Object_assign =" ) !== -1, generated.code );
		});
	});

	it( 'ignores existing imports', function () {
		return rollup.rollup({
			entry: 'samples/existing/main.js',
			plugins: [
				inject({ $: 'jquery' })
			],
			external: [ 'jquery' ]
		}).then( function ( bundle ) {
			var generated = bundle.generate();
			var code = generated.code;

			code = code.replace( /import \$.+/, '' ); // remove first instance. there shouldn't be a second

			assert.ok( code.indexOf( "import $ from 'jquery'" ) === -1, generated.code );
		});
	});

	it( 'handles shadowed variables', function () {
		return rollup.rollup({
			entry: 'samples/shadowing/main.js',
			plugins: [
				inject({ $: 'jquery' })
			],
			external: [ 'jquery' ]
		}).then( function ( bundle ) {
			var generated = bundle.generate();
			var code = generated.code;

			assert.ok( code.indexOf( "'jquery'" ) === -1, generated.code );
		});
	});

	it( 'handles shorthand properties', function () {
		return rollup.rollup({
			entry: 'samples/shorthand/main.js',
			plugins: [
				inject({ Promise: [ 'es6-promise', 'Promise' ] })
			],
			external: [ 'es6-promise' ]
		}).then( function ( bundle ) {
			var generated = bundle.generate();
			var code = generated.code;

			assert.ok( code.indexOf( "import { Promise } from 'es6-promise'" ) !== -1, generated.code );
		});
	});
});
