var glob = require('glob-all');
var mergeStream = require('merge-stream');

var gulp = require('gulp');
var gutil = require('gulp-util');
var runSequence = require('run-sequence');
var del = require('del');
var source = require('vinyl-source-stream');
var browserify = require('browserify');

var pkg = require('./package.json');
var SRC_DIRNAME = 'src', 
    BUILD_DIRNAME = 'build', 
    EXTERN_DIRNAME = 'extern',
    BROWSERIFY_EXTERNAL = pkg && pkg.browserify && pkg.browserify.external || [];
var DEBUG = false;


gulp.task('clean', function(){
    return del([ BUILD_DIRNAME ]);
});


gulp.task('node2browser', ['clean'], function(){
    var merged = mergeStream();

    function bundleIt(b){
        return b.transform({
            global: true,
            output: {
                ascii_only: true
            }
        }, 'uglifyify').bundle();
    }

    var normalFiles = glob.sync([
        SRC_DIRNAME + '/**/*.js',
        '!' + SRC_DIRNAME + '/**/_*.js',        // 下划线开头的js文件
        '!' + SRC_DIRNAME + '/**/_*/**/*.js',   // 下划线开头的文件夹
        '!' + SRC_DIRNAME + '/' + EXTERN_DIRNAME + '/**/*.js'
    ]);

    var externalFiles = glob.sync([
        SRC_DIRNAME + '/' + EXTERN_DIRNAME + '/**/*.js',
        '!' + SRC_DIRNAME + '/' + EXTERN_DIRNAME + '/**/_*.js',     // 下划线开头的js文件
        '!' + SRC_DIRNAME + '/' + EXTERN_DIRNAME + '/**/_*/**/*.js' // 下划线开头的文件夹
    ]);

    normalFiles.forEach(function(file){
        var stream = bundleIt(browserify(file, {
            debug: DEBUG
        }).external(externalFiles.concat(BROWSERIFY_EXTERNAL)));

        stream.pipe(source(file.replace(new RegExp(SRC_DIRNAME + '/?'), '')))
        .pipe(gulp.dest(BUILD_DIRNAME));

        merged.add(stream);
    });

    externalFiles.forEach(function(file){
        var stream = bundleIt(browserify({
            debug: DEBUG
        }).require('./' + file, {
            expose: '/' + file
        }).external(externalFiles.filter(function(f){
            return f !== file;
        }).concat(BROWSERIFY_EXTERNAL)));
        
        stream.pipe(source(file.replace(new RegExp(SRC_DIRNAME + '/?'), '')))
        .pipe(gulp.dest(BUILD_DIRNAME));

        merged.add(stream);
    });

    return merged;
});


gulp.task('watch', function(){
    gulp.watch(SRC_DIRNAME + '/**/*.js', ['node2browser']);
});

gulp.task('default', ['clean', 'node2browser']);

gulp.task('debug', function(cb){
    DEBUG = true;
    runSequence('default', 'watch', cb);
});
