var gobble = require( 'gobble' );

module.exports = gobble([
	gobble( 'src' ).transform( 'rollup-babel', {
		entry: 'index.js',
		dest: 'rollup-plugin-inject.cjs.js',
		format: 'cjs',
		external: [ 'path', 'rollup-pluginutils', 'acorn', 'magic-string' ]
	}),

	gobble( 'src' ).transform( 'rollup-babel', {
		entry: 'index.js',
		dest: 'rollup-plugin-inject.es6.js',
		format: 'es6',
		external: [ 'path', 'rollup-pluginutils', 'acorn', 'magic-string' ]
	})
]);
