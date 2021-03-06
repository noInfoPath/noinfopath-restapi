module.exports = function (grunt) {

	var DEBUG = !!grunt.option("debug");

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		copy: {
	        wiki: {
	            files: [
	                {
	                    expand: true,
	                    flatten: true,
	                    src: ['docs/*.md', '!docs/global.md'],
	                    dest: '../wikis/<%= pkg.shortName %>.wiki/'
	                }
	            ]
	        }
	    },
		concat: {
			readme: {
				src: ['docs/restapi.md'],
				dest: 'readme.md'
			},
			wiki: {
				src: ['docs/index.md'],
				dest: '../wikis/<%= pkg.shortName %>.wiki/home.md'
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
					src: ['index.js', 'no-mongo-crud.js', 'no-mongo-crud-lo.js', 'no-gcs-crud.js', 'no-awss3-crud.js', 'no-odata.js'],
					dest: 'docs/restapi.md',
					start: ['/*', '/**'],
					multiDocs: {
						multiFiles: true,
						dest: "docs/"
					}
				}
			}
		},
		noinfopath_config: {
			dev: {
				src: ["no-schemas/*.json.tmpl",  "config.json.tmpl"],
				options: {
					values: {
						"NIP_MONGO_HOST": "mongodb://gitlab.img.local:27017",
						"NIP_AUTH_PROTOCOL": "https://",
						"NIP_AUTH_HOST": "auth.noinfopath.net",
						"NIP_AUTH_PORT": 443,
						"NIP_RESTAPI_PROTOCOL": "http://",
						"NIP_RESTAPI_HOST": "localhost",
						"NIP_RESTAPI_PORT": 4002,
						"NIP_MS_WEBAPI_HOST": "auth.noinfopath.net",
						"NIP_MS_WEBAPI_PORT": 443,
						"NIP_DTC_COLLECTION": "efr2_dtc",
						"NIP_DTCS_PROTOCOL": "http://",
						"NIP_DTCS_HOST": "dtc.efr.rm.test",
						"NIP_DTCS_PORT": 8443,
						"NIP_BEDS_PORT": 8443,
						"NIP_LOG_ROOT": "./logs/",
						"JWT_SECRET": "NTE1Njg2NDFGQTg5MzY1RDhDMjQ5REREQjU1RTE3QUE",
						"JWT_AUDIENCE": "vO6mYRIAldyw7GP6FUW0WgvU32pFYD6x",
						"CORS_WHITELIST": "[\"http://macbook:3000\", \"http://macbook:3001\", \"http://macbook:8080\"]",
						"AWS_S3_ID": "AKIAJSUV55LNTVE7PD7Q",
						"AWS_S3_SECRET": "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",
						"AWS_S3_BUCKET": "file-cache.noinfopath.net",
						"AWS_S3_FOLDER": "rm-efr2-test/"
					}
				}
			},
			test: {
				src: ["no-schemas/*.json.tmpl",  "config.json.tmpl"],
				options: {
					values: {
						"NIP_MONGO_HOST": "mongodb://img-sqlserv2.img.local:27017",
						"NIP_AUTH_PROTOCOL": "https://",
						"NIP_AUTH_HOST": "auth.noinfopath.net",
						"NIP_AUTH_PORT": 443,
						"NIP_RESTAPI_PROTOCOL": "http://",
						"NIP_RESTAPI_HOST": "auth.noinfopath.net",
						"NIP_RESTAPI_PORT": 4000,
						"NIP_MS_WEBAPI_PROTOCOL": "https://",
						"NIP_MS_WEBAPI_HOST": "auth.noinfopath.net",
						"NIP_MS_WEBAPI_PORT": 443,
						"NIP_DTC_COLLECTION": "efr2_dtc",
						"NIP_DTCS_PROTOCOL": "http://",
						"NIP_DTCS_HOST": "localhost",
						"NIP_DTCS_PORT": 3100,
						"NIP_BEDS_PORT": 3200,
						"NIP_LOG_ROOT": "./logs/",
						"JWT_SECRET": "NTE1Njg2NDFGQTg5MzY1RDhDMjQ5REREQjU1RTE3QUE",
						"JWT_AUDIENCE": "vO6mYRIAldyw7GP6FUW0WgvU32pFYD6x",
						"CORS_WHITELIST": "[\"http://macbook:3000\", \"http://macbook:3001\", \"http://macbook:8080\", \"http://efr2-test.noinfopath.net\"]",
						"AWS_S3_ID": "AKIAJT46Q2ITDH2RRLDA",
						"AWS_S3_SECRET": "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",
						"AWS_S3_BUCKET": "file-cache.noinfopath.net",
						"AWS_S3_FOLDER": "rm-efr2-test/"
					}
				}
			},
			prod: {
				src: ["no-schemas/*.json.tmpl", "config.json.tmpl"],
				options: {
					values: {
						"NIP_MONGO_HOST": "mongodb://localhost:27017",
						"NIP_AUTH_PROTOCOL": "http://",
						"NIP_AUTH_HOST": "web-api.rm.efieldreporting.com",
						"NIP_AUTH_PORT": 80,
						"NIP_RESTAPI_PROTOCOL": "http://",
						"NIP_RESTAPI_HOST": "backend.rm.efieldreporting.com",
						"NIP_RESTAPI_PORT": 4000,
						"NIP_MS_WEBAPI_PROTOCOL": "http://",
						"NIP_MS_WEBAPI_HOST": "web-api.rm.efieldreporting.com",
						"NIP_MS_WEBAPI_PORT": 80,
						"NIP_DTC_COLLECTION": "efr2_dtc",
						"NIP_DTCS_PROTOCOL": "http://",
						"NIP_DTCS_HOST": "backend.rm.efieldreporting.com",
						"NIP_DTCS_PORT": 3100,
						"NIP_BEDS_PORT": 3200,
						"NIP_LOG_ROOT": "./logs/",
						"JWT_SECRET": "NTE1Njg2NDFGQTg5MzY1RDhDMjQ5REREQjU1RTE3QUE",
						"JWT_AUDIENCE": "vO6mYRIAldyw7GP6FUW0WgvU32pFYD6x",
						"CORS_WHITELIST": "[\"http://macbook:3000\", \"http://macbook:3001\", \"http://macbook:8080\", \"http://app.rm.efieldreporting.com\"]",
						"AWS_S3_ID": "AKIAI7XT5VHCBFRVAY2A",
						"AWS_S3_SECRET": "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",
						"AWS_S3_BUCKET": "rm-efr-data",
						"AWS_S3_FOLDER": "rm-efr-data/NoFileCache/"
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
	                'cd ../wikis/<%= pkg.shortName %>.wiki',
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
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('@noinfopath/grunt-noinfopath-config');

	//Default task(s).

	//Only globals.js in readme.md
	grunt.registerTask('wikiWack', ['shell:wiki1','concat:wiki', 'copy:wiki', 'shell:wiki2']);
	grunt.registerTask('release', ['bumpup', 'version', 'nodocs:internal', 'concat:readme', 'wikiWack']);
	grunt.registerTask('document', ['nodocs:internal', 'concat:readme']);
	grunt.registerTask('updateWiki', ['document', 'wikiWack']);

};
