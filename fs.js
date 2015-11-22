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
var REGEXP_BUNDLEIT = /function\s*bundleIt\s*\(\s*b\s*\)\s*/;
var REGEXP_HIDDEN_JSFILE = /_\.js$/;
var REGEXP_JSFILE = /\.js$/;
module.exports = (function(fs, pathLib, findup, browserify, glob, log){
    
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
            if(!REGEXP_JSFILE.test(path)){
                fs.readFile(path, {}, function(err, data){
                    if(err){
                        deferred.reject();
                    }else{
                        log(('Disapathed to Local').cyan +
                            (': [' + path + ']').grey);
                        deferred.resolve(data);
                    }
                });
                return deferred.promise;
            }

            var floorPath = pathLib.resolve(path, '../..');
            findup('gulpfile.js', { cwd: floorPath }).then(function(gfp){
                if(!gfp){
                    fs.readFile(path, {}, function(err, data){
                        if(err){
                            deferred.reject();
                        }else{
                            log(('Disapathed to Local').cyan +
                                (': [' + path + ']').grey);
                            deferred.resolve(data);
                        }
                    });
                    return;
                }

                fs.readFile(gfp, function(err, gfbuf){
                    var gfctt = gfbuf.toString();
                    if(!REGEXP_REQUIRE_BROWSERIFY.test(gfctt)){
                        fs.readFile(path, {}, function(err, data){
                            if(err){
                                deferred.reject();
                            }else{
                                log(('Disapathed to Local').cyan +
                                    (': [' + path + ']').grey);
                                deferred.resolve(data);
                            }
                        });
                        return;
                    }

                    var parentPath = pathLib.resolve(gfp, '..');
                    var relativePath = pathLib.relative(parentPath, path);
                    var srcDirname = relativePath.substring(0, relativePath.indexOf(pathLib.sep));
                    var innerPath = relativePath.substring(relativePath.indexOf(pathLib.sep) + 1);

                    if(REGEXP_HIDDEN_JSFILE.test(innerPath)){
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
                            var externDirpath = pathLib.resolve(parentPath, srcDirname, externDirname);
                            externPattern.push(externDirpath + pathLib.sep + '**/*.js');
                            externPattern.push('!' + externDirpath + pathLib.sep + '**/_*.js');
                            externPattern.push('!' + externDirpath + pathLib.sep + '**/_*/**/*.js');
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
                                    debug: true 
                                }).require(path, {
                                    expose: path.sep + relativePath
                                }).external(externFiles.filter(function(ef){
                                    return ef !== relativePath;
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
                            });
                        });
                    });
                });
            }, function(err){
                deferred.reject(err);
            });
            return deferred.promise;
        },

        stat: function(path){
            var deferred = Promise.defer();
            fs.stat(path, function(err, stats){
                if(err){
                    deferred.reject();
                }else {
                    deferred.resolve(stats);
                }
            });
            return deferred.promise;
        }
    };
}(require('fs'), require('path'), require('find-up'), require('browserify'), require('glob-all'), require('./log')));
