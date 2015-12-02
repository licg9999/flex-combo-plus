var fs = require('fs');
var path = require('path');

var glob = require('glob-all');

var gulp = require('gulp');
var gutil = require('gulp-util');

var del = require('del');
var sourcemaps = require('gulp-sourcemaps');

var browserify = require('browserify');
var uglify = require('gulp-uglify');

var less = require('gulp-less');
var minify = require('gulp-minify-css');
var autoprefixer = require('gulp-autoprefixer');

var sourceStream = require('vinyl-source-stream');
var sourceBuffer = require('vinyl-source-buffer');

var mergeStream = require('merge-stream');
var runSequence = require('run-sequence');


var SRC  = __dirname + path.sep + 'src',
    DEST = __dirname + path.sep + '/build';

var GLOBS_IN_SRC_JS  = ['./**/*.js', '!./**/_*.js'];
var GLOBS_IN_SRC_CSS = ['./**/*.less', '!./**/_*.less'];

var DEBUG = false;

function buildOneJS(filename){
    var stream = browserify(filename, {
        debug: DEBUG,
        basedir: SRC
    }).bundle();

    stream.on('error', function(err){ gutil.log(err); });
    stream = stream.pipe(sourceBuffer(path.relative(SRC, filename)));
    if(DEBUG){
        stream = stream.pipe(sourcemaps.init({loadMaps: true}));
    }
    stream = stream.pipe(uglify({
        output: {
            ascii_only: true
        },
        mangle: !DEBUG,
        compress: !DEBUG
    }));
    if(DEBUG){
        stream = stream.pipe(sourcemaps.write());
    }
    stream = stream.pipe(gulp.dest(DEST));

    return stream;
}

function buildOneCSS(filename){
    var stream = fs.createReadStream(filename);

    stream.on('error', function(err){ gutil.log(err); });
    stream = stream.pipe(sourceBuffer(path.relative(SRC, filename)));
    if(DEBUG){
        stream = stream.pipe(sourcemaps.init({loadMaps: true}));
    }
    stream = stream.pipe(less({
        paths: [ SRC ]
    }));
    if(!DEBUG){
        stream = stream.pipe(minify());
    }
    if(DEBUG){
        stream = stream.pipe(sourcemaps.write());
    }
    stream = stream.pipe(autoprefixer({
        browsers: ['> 5%', 'last 2 version']
    }));
    stream = stream.pipe(gulp.dest(DEST));

    return stream;
}

gulp.task('clean', function(){
    return del([DEST]);
});

gulp.task('buildJS', function(cb){
    var streams = mergeStream();
    glob.sync(GLOBS_IN_SRC_JS, { cwd: SRC }).forEach(function(filename){
        streams.add(buildOneJS(path.resolve(SRC, filename)));
    });
    return streams;
});

gulp.task('buildCSS', function(cb){
    var streams = mergeStream();
    glob.sync(GLOBS_IN_SRC_CSS, { cwd: SRC }).forEach(function(filename){
        streams.add(buildOneCSS(path.resolve(SRC, filename)));
    });
    return streams;
});

gulp.task('watch', function(){
    gulp.watch(GLOBS_IN_SRC_JS, { cwd: SRC }, function(e){
        if(e.type === 'deleted') return;
        gulp.task('buildOneJS', function(){
            return buildOneJS(e.path);
        });
        runSequence('buildOneJS');
    });
    gulp.watch(GLOBS_IN_SRC_CSS, { cwd: SRC }, function(e){
        if(e.type === 'deleted') return;
        gulp.task('buildOneCSS', function(){
            return buildOneCSS(e.path);
        });
        runSequence('buildOneCSS');
    });
});

gulp.task('default', function(cb){
    runSequence('clean', ['buildJS', 'buildCSS'], cb);
});

gulp.task('debug', function(cb){
    DEBUG = true;
    runSequence(['watch', 'default'], cb);
});
