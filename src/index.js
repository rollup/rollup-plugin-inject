import { attachScopes, createFilter } from 'rollup-pluginutils';
import { extname } from 'path';
import { walk } from 'estree-walker';
import acorn from 'acorn';
import makeLegalIdentifier from './makeLegalIdentifier';
import MagicString from 'magic-string';

function escape ( str ) {
	return str.replace( /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&' );
}

function isReference ( node, parent ) {
	if ( node.type === 'MemberExpression' ) {
		return !node.computed && isReference( node.object, node );
	}

	if ( node.type === 'Identifier' ) {
		// TODO is this right?
		if ( parent.type === 'MemberExpression' ) return parent.computed || node === parent.object;

		// disregard the `bar` in { bar: foo }
		if ( parent.type === 'Property' && node !== parent.value ) return false;

		// disregard the `bar` in `class Foo { bar () {...} }`
		if ( parent.type === 'MethodDefinition' ) return false;

		// disregard the `bar` in `export { foo as bar }`
		if ( parent.type === 'ExportSpecifier' && node !== parent.local ) return;

		return true;
	}
}

function flatten ( node ) {
	let name;
	let parts = [];

	while ( node.type === 'MemberExpression' ) {
		parts.unshift( node.property.name );
		node = node.object;
	}

	name = node.name;
	parts.unshift( name );

	return { name, keypath: parts.join( '.' ) };
}

export default function provide ( options ) {
	if ( !options ) throw new Error( 'Missing options' );

	const filter = createFilter( options.include, options.exclude );

	let modules;

	if ( options.modules ) {
		modules = options.modules;
	} else {
		modules = Object.assign( {}, options );
		delete modules.include;
		delete modules.exclude;
	}

	const firstpass = new RegExp( `(?:${Object.keys( modules ).map( escape ).join( '|' )})`, 'g' );
	const sourceMap = options.sourceMap !== false;

	return {
		transform ( code, id ) {
			if ( !filter( id ) ) return null;
			if ( !firstpass.test( code ) ) return null;
			if ( extname( id ) !== '.js' ) return null;

			let ast;

			try {
				ast = acorn.parse( code, {
					ecmaVersion: 6,
					sourceType: 'module'
				});
			} catch ( err ) {
				err.message += ` in ${id}`;
				throw err;
			}

			// analyse scopes
			let scope = attachScopes( ast, 'scope' );

			let imports = {};
			ast.body.forEach( node => {
				if ( node.type === 'ImportDeclaration' ) {
					node.specifiers.forEach( specifier => {
						imports[ specifier.local.name ] = true;
					});
				}
			});

			const magicString = new MagicString( code );

			let newImports = {};

			function handleReference ( node, name, keypath ) {
				if ( keypath in modules && !scope.contains( name ) && !imports[ name ] ) {
					let module = modules[ keypath ];
					if ( typeof module === 'string' ) module = [ module, 'default' ];
					const hash = `${keypath}:${module[0]}:${module[1]}`;

					const importLocalName = name === keypath ? name : makeLegalIdentifier( `$inject_${keypath}` );

					if ( !newImports[ hash ] ) {
						newImports[ hash ] = `import { ${module[1]} as ${importLocalName} } from '${module[0]}';`;
					}

					if ( name !== keypath ) {
						magicString.overwrite( node.start, node.end, importLocalName, true );
					}
				}
			}

			walk( ast, {
				enter ( node, parent ) {
					if ( sourceMap ) {
						magicString.addSourcemapLocation( node.start );
						magicString.addSourcemapLocation( node.end );
					}

					if ( node.scope ) scope = node.scope;

					// special case – shorthand properties. because node.key === node.value,
					// we can't differentiate once we've descended into the node
					if ( node.type === 'Property' && node.shorthand ) {
						const name = node.key.name;
						handleReference( node, name, name );
						return this.skip();
					}

					if ( isReference( node, parent ) ) {
						const { name, keypath } = flatten( node );
						handleReference( node, name, keypath );
					}
				},
				leave ( node ) {
					if ( node.scope ) scope = scope.parent;
				}
			});

			const keys = Object.keys( newImports );
			if ( !keys.length ) return null;

			const importBlock = keys.map( hash => newImports[ hash ] ).join( '\n\n' );
			magicString.prepend( importBlock + '\n\n' );

			return {
				code: magicString.toString(),
				map: sourceMap ? magicString.generateMap() : null
			};
		}
	};
}
