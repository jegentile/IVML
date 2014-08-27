module.exports = function(grunt) {

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Project configuration.
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        concat: {

            dist: {
                // the files to concatenate
                src: [
                    'ivml/ivml.js',
                    'ivml/elements/bar-group.js',
                    'ivml/elements/bars.js',
                    'ivml/elements/chart.js',
                    'ivml/elements/cylinders.js',
                    'ivml/elements/donut-charts.js',
                    'ivml/elements/error-bars.js',
                    'ivml/elements/line-group.js',
                    'ivml/elements/line-segments.js',
                    'ivml/elements/paths.js',
                    'ivml/elements/plot.js',
                    'ivml/elements/points.js',
                    'ivml/elements/rectangles.js',
                    'ivml/elements/shapes.js',
                    'ivml/elements/texts.js'
                ],
                // the location of the resulting JS file
                dest: 'dist/<%= pkg.name %>.<%= pkg.version %>.js'
            }
        },
        uglify: {
            options: {
                // the banner is inserted at the top of the output
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    'dist/ivml.min.js':
                        [
                            'dist/<%= pkg.name %>.<%= pkg.version %>.js'
                        ]
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');


    // Default task(s).
    grunt.registerTask('default', ['concat','uglify']);


};