var gobble = require( 'gobble' );
var babel = require( 'rollup-plugin-babel' );

var external = Object.keys( require( './package.json' ).dependencies ).concat( 'path' );

module.exports = gobble([
	gobble( 'src' ).transform( 'rollup', {
		entry: 'index.js',
		dest: 'rollup-plugin-inject.cjs.js',
		format: 'cjs',
		plugins: [ babel() ],
		external: external
	}),

	gobble( 'src' ).transform( 'rollup', {
		entry: 'index.js',
		dest: 'rollup-plugin-inject.es6.js',
		format: 'es6',
		plugins: [ babel() ],
		external: external
	})
]);
