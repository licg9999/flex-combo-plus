/* jshint evil:true */
/* globals bundleIt */
/**
@exports: Object
        .exists: function(){
            path   : string
            @return: Promise
        }
**/
var REGEXP_REQUIRE_BROWSERIFY = /require\s*\((\s*\'browserify\'|\"browserify\"\s*)\)/;

var REGEXP_EXTERN_DIRNAME = /EXTERN_DIRNAME\s*=\s*(\'(.+)\'|\"(.+)\")/;
var REGEXP_SRC_DIRNAME    = /SRC_DIRNAME\s*=\s*(\'(.+)\'|\"(.+)\")/;
var REGEXP_BUILD_DIRNAME  = /BUILD_DIRNAME\s*=\s*(\'(.+)\'|\"(.+)\")/;
var REGEXP_BUNDLEIT       = /function\s*bundleIt\s*\(\s*b\s*\)\s*/;


var REGEXP_HIDDEN_JSFILE = /_.*\.js$/;
var REGEXP_JSFILE        = /\.js$/;

var REGEXP_HIDDEN_CSSFILE = /_.*\.js$/;
var REGEXP_CSSFILE        = /\.css/;

module.exports = (function(fs, pathLib, findup, browserify, glob, colors, log){
    
    return {
        exists: function(path){
            var deferred = Promise.defer();
            fs.exists(path, function(b){
                deferred.resolve(b);
            });
            return deferred.promise;
        },
        
        readFile: function(path){
            var deferred = Promise.defer();

            function plainFunc(){
                fs.readFile(path, {}, function(err, data){
                    if(err){
                        deferred.reject(err);
                        return;
                    }
                    log(('Disapathed to Local').cyan +
                        (': [' + path + ']').grey);
                    deferred.resolve(data);
                });
            }

            if(REGEXP_JSFILE.test(path)){
                var floorPath = pathLib.resolve(path, '../..');
                findup('gulpfile.js', { cwd: floorPath }).then(function(gfp){
                    if(!gfp){
                        plainFunc();
                        return;
                    }

                    fs.readFile(gfp, function(err, gfbuf){
                        var gfctt = gfbuf.toString();
                        if(!REGEXP_REQUIRE_BROWSERIFY.test(gfctt)){
                            plainFunc();
                            return;
                        }

                        var parentPath   = pathLib.resolve(gfp, '..');
                        var relativePath = pathLib.relative(parentPath, path);
                        var holderDirname   = relativePath.substring(0, relativePath.indexOf(pathLib.sep));
                        var innerPath    = relativePath.substring(relativePath.indexOf(pathLib.sep) + 1);

                        if(REGEXP_HIDDEN_JSFILE.test(innerPath)){
                            deferred.reject(('Hidden Browserify JS File').yellow + 
                                            (': [' + path + ']').grey);
                            return;
                        }

                        var buildDirname = gfctt.match(REGEXP_BUILD_DIRNAME);
                        buildDirname = buildDirname[2] || buildDirname[3] || undefined;

                        var srcDirname = gfctt.match(REGEXP_SRC_DIRNAME);
                        srcDirname = srcDirname[2] || srcDirname[3] || undefined;

                        if(buildDirname && holderDirname === buildDirname){
                            plainFunc();
                            return;
                        }

                        if(srcDirname && holderDirname !== srcDirname){
                            deferred.reject();
                            return;
                        }

                        findup('package.json', { cwd: floorPath }).then(function(pkgp){
                            var browserifyExternal = [];
                            if(pkgp){
                                try{
                                    browserifyExternal = JSON.parse(fs.readFileSync(pkgp)).browserify.external;
                                }catch(e){}
                            }

                            var externDirname = gfctt.match(REGEXP_EXTERN_DIRNAME);
                            externDirname = externDirname[2] || externDirname[3] || undefined;
                            var externPattern = [];
                            if(externDirname){
                                var externDirpath = pathLib.resolve(parentPath, holderDirname, externDirname);
                                externPattern.push(externDirpath + pathLib.sep + '**/*.js');
                                externPattern.push('!' + externDirpath + pathLib.sep + '**/_*.js');         // 下划线开头的js文件
                                externPattern.push('!' + externDirpath + pathLib.sep + '**/_*/**/*.js');    // 下划线开头的文件夹
                            }

                            glob(externPattern, function(err, externFiles){
                                if(err) {
                                    deferred.reject(err);
                                    return;
                                }

                                var isExtern = innerPath.indexOf(externDirname) === 0;
                                var b;
                                if(isExtern){
                                    b = browserify({ 
                                        debug: true,
                                        basedir: parentPath
                                    }).require('.' + pathLib.sep + relativePath, {
                                        expose: pathLib.sep + relativePath 
                                    }).external(externFiles.filter(function(ef){
                                        return ef !== path;
                                    }).concat(browserifyExternal));
                                }else {
                                    b = browserify(relativePath, { 
                                        debug: true,
                                        basedir: parentPath
                                    }).external(externFiles.map(function(ef){
                                        return pathLib.relative(parentPath, ef);
                                    }).concat(browserifyExternal));
                                }

                                var bundle = gfctt.match(REGEXP_BUNDLEIT);
                                var depth = 0, firstCurlyMathed = false;
                                for(var i = bundle.index, n = gfctt.length; i < n; i++){
                                    if(gfctt.charAt(i) === '{'){
                                        depth++;
                                        if(!firstCurlyMathed){
                                            firstCurlyMathed = true;
                                        }
                                    }else if(gfctt.charAt(i) === '}'){
                                        depth--;
                                        if(firstCurlyMathed && depth === 0) break;
                                    }
                                }
                                if(firstCurlyMathed && depth === 0){
                                    bundle = gfctt.substring(bundle.index, i + 1);
                                    try{
                                        eval(bundle);
                                        bundle = bundleIt;
                                    }catch(e){
                                        bundle = function(b){
                                            b.bundle();
                                        };
                                    }
                                }else {
                                    bundle = function(b){
                                        b.bundle();
                                    };
                                }

                                var chunks = [];
                                bundle(b).on('data', function(chunk){
                                    chunks.push(chunk);
                                }).on('end', function(){
                                    log(('Disapathed to Local and Browserified').cyan +
                                        (': [' + path + ']').grey);

                                    deferred.resolve(Buffer.concat(chunks));
                                }).on('error', function(err){
                                    deferred.reject({
                                        code: 'ENOENT'
                                    });
                                });
                            });
                        });
                    });
                }, function(err){
                    deferred.reject(err);
                });
            }else if(REGEXP_CSSFILE.test(path)){
                plainFunc();
            }else {
                plainFunc();
            }

            // TODO less judgement and compile
            // var less = require('less');
            // less.render(str /* :string */, { paths: [ './src'] }, function(err, result){ 
            //      console.log(err, result); /* result.css :string*/ 
            // });

            return deferred.promise;
        },

        stat: function(path){
            var deferred = Promise.defer();
            fs.stat(path, function(err, stats){
                if(err){
                    deferred.reject(err);
                }else {
                    deferred.resolve(stats);
                }
            });
            return deferred.promise;
        }
    };
}(require('fs'), require('path'), require('find-up'), require('browserify'), require('glob-all'), require('colors'), require('./log')));
