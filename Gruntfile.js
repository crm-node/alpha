/**
 * Created by mmalkav on 23.05.2016.
 */
module.exports = function(grunt) {
    var AnnotateOptions = {
        options: {
            singleQuotes: true
        },
        app: {
            files: {
                'pos/view/production/temp/app.js': ['pos/view/scripts/core/app.js'],
                'pos/view/production/temp/controllers.js': ['pos/view/module/controllers/*.js'],
                'pos/view/production/temp/controllers-games.js': ['pos/view/module/controllers/games/*.js'],
                'pos/view/production/temp/controllers-live.js': ['pos/view/module/controllers/live/*.js'],
                'pos/view/production/temp/controllers-results.js': ['pos/view/module/controllers/results/*.js'],
                'pos/view/production/temp/controllers-sports.js': ['pos/view/module/controllers/sports/*.js'],
                'pos/view/production/temp/other.js': ['pos/view/module/other/*.js']
            }
        }
    };

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        ngAnnotate: AnnotateOptions,
        concat: {
            dist: {
                src: [
                    'files/js/lib/jquery-2.1.3.min.js',
                    'files/js/lib/angular.min.js',
                    'files/js/lib/angular-route.min.js',
                    'files/js/lib/angular-sanitize.min.js',
                    'files/js/lib/angular-cookies.min.js',
                    'node_modules/ng-file-upload/dist/ng-file-upload.min.js',
                    'node_modules/ng-file-upload/dist/ng-file-upload-shim.min.js',
                    'files/js/lib/underscore-min.js',
                    'files/js/lib/moment.min.js',
                    'files/js/lib/socket.io-client/socket.io.js',
                    'files/js/lib/materialize.min.js',
                    'files/js/lib/highcharts.js',
                    'files/js/lib/highcharts-exporting.js'                
                ],
                dest: 'files/js/scripts/production/libs.js'
            }
        },
        htmlConvert: {
            options: {
                // custom options, see below
            },
            templates: {
                src: [
                    'pos/view/module/pages/*.html',
                    'pos/view/module/pages/dashboard/*.html'
                ],
                dest: 'pos/view/production/production-html.js'
            }
        },
        cssmin: {
            target: {
                files: [{
                    src: [
                        'pos/view/styles/style.css'
                    ],
                    dest: 'pos/view/production/production-css.min.css'
                }]
            }
        },
        uglify: {
            build: {
                files: [{
                    src: 'files/js/scripts/production/libs.js',
                    dest: 'files/js/scripts/production/libs.min.js'
                }]
                //     ,{
                //     src: 'pos/view/production/production-html.js',
                //     dest: 'pos/view/production/production-html.min.js'
                // }]

            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    // grunt.loadNpmTasks('grunt-html-convert');
    // grunt.loadNpmTasks('grunt-contrib-cssmin');
    // grunt.loadNpmTasks('grunt-ng-annotate');

    // grunt.registerTask('libs', ['ngAnnotate', 'concat', 'htmlConvert', 'cssmin', 'uglify']);
    // grunt.registerTask('pos-dev', ['ngAnnotate', 'concat', 'htmlConvert', 'cssmin']);

    grunt.registerTask('libs', ['concat', 'uglify']);
};