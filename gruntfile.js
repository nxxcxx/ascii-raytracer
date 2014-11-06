
module.exports = function(grunt) {/*jshint strict: false*/

	// Project configuration.
	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		watch: {
			// global opptions for all watcher
			options: {
				livereload: true
			},
			js: {
				files: ['js/*.js']
			},
			html: {
				files: '*.html'
			},
			css: {
				files: 'css/*.css'
			}
		}

	});

	// Load the plugin that provides the tasks.
	grunt.loadNpmTasks('grunt-contrib-watch');

	// tasks
	grunt.registerTask('default', ['watch']);

};