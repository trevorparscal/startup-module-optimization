var gulp = require( 'gulp' ),
	gzip = require( 'gulp-gzip' ),
	size = require( 'gulp-filesize' ),
	co = require( 'co' ),
	fs = require( 'co-fs' );

gulp.task( 'test', function ( cb ) {
	var manifest = require( './data/manifest.json' );

	co( function *() {
		var i, len,
			earliest = Infinity,
			moduleNames = {},
			groupNames = {},
			mappings = { groups: [] },
			pre = yield fs.readFile( './data/pre.js', 'utf-8' ),
			post = yield fs.readFile( './data/post.js', 'utf-8' );

		// Get rid of object wrapper
		manifest = manifest.manifest;

		// Build moduleNames and earliest timestamp
		for ( i = 0, len = manifest.length; i < len; i++ ) {
			moduleNames[manifest[i][0]] = i;
			earliest = Math.min( earliest, manifest[i][1] );
			if ( manifest[i][3] && !groupNames[manifest[i][3]] ) {
				groupNames[manifest[i][3]] = mappings.groups.push( manifest[i][3] );
			}
		}

		for ( i = 0, len = manifest.length; i < len; i++ ) {
			// Offset timestamps
			//manifest[i][1] = Number( manifest[i][1] );
			//manifest[i][1] = String( Number( manifest[i][1] ) - earliest );
			manifest[i][1] = Number( manifest[i][1] ) - earliest;
			// Replace dependencies with moduleNameses
			if ( manifest[i][2] ) {
				manifest[i][2] = manifest[i][2].map( function ( dependency ) {
					return moduleNames[dependency];
				} );
			}
			if ( manifest[i][3] ) {
				manifest[i][3] = groupNames[manifest[i][3]];
			}
		}

		// Write new version to disk
		yield fs.writeFile( './src/modified.js',
			JSON.stringify( mappings ) + pre + JSON.stringify( manifest ) + post
		);

		gulp.src( './src/*.js' )
			.pipe( gzip() )
			.pipe( gulp.dest( './dst' ) )
			.pipe( size() );

		// Done
		cb();
	} )();
} );
