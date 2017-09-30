import buble from 'rollup-plugin-buble';

var external = Object.keys( require( './package.json' ).dependencies ).concat( 'path' );

export default {
	input: 'src/index.js',
	plugins: [ buble() ],
	external: external
};
