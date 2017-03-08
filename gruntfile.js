module.exports = function (grunt) {

	var DEBUG = !!grunt.option("debug");

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			readme: {
				src: ['docs/restapi.md'],
				dest: 'readme.md'
			},
			wiki: {
				src: ['docs/restapi.md'],
				dest: '../wikis/noinfopath-restapi.wiki/home.md'
			}

		},
		bumpup: {
			file: 'package.json'
		},
		version: {
			options: {
				prefix: '@version\\s*'
			},
			defaults: {
				src: ['index.js']
			}
		},
		nodocs: {
			"internal": {
				options: {
					src: ['index.js', 'no-rest.js', 'no-mongo-crud.js', 'no-mongo-crud-lo.js', 'no-gcs-crud.js', 'no-awss3-crud.js'],
					dest: 'docs/restapi.md',
					start: ['/*'],
					multiDocs: {
						multiFiles: false,
						dest: "docs/"
					}
				}
			}
		},
		watch: {
			document: {
				files: ["*.js"],
				tasks: ['document'],
				options: {
					spawn: false
						// livereload: true
				}
			}
		},
		shell: {
	        wiki1: {
	            command: [
	                'cd ../wikis/<%= pkg.shortName %>.wiki',
					'pwd',
	                'git stash',
	                'git pull'
	            ].join(' && ')
	        },
			wiki2: {
	            command: [
	                'cd ../wikis/noinfopath-restapi.wiki',
					'pwd',
	                'git add .',
	                'git commit -m"Wiki Updated"',
					'git push'
	            ].join(' && ')
	        }
	    }
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-bumpup');
	grunt.loadNpmTasks('grunt-version');
	grunt.loadNpmTasks('grunt-nodocs');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-shell');
	//Default task(s).

	//Only globals.js in readme.md
	grunt.registerTask('wikiWack', ['shell:wiki1', 'concat:wiki', 'shell:wiki2']);
	grunt.registerTask('release', ['bumpup', 'version', 'nodocs:internal', 'concat:readme', 'wikiWack']);
	grunt.registerTask('document', ['nodocs:internal', 'concat:readme', 'wikiWack']);

};
