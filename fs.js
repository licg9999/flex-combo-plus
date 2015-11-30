/* jshint evil:true */
/* globals buildOneJS, buildOneCSS */

/**
@exports: Object
        .exists: function(){
            path   : string
            @return: Promise
        }
**/

/*
var REGEXP_REQUIRE_BROWSERIFY = /require\s*\((\s*\'browserify\'|\"browserify\"\s*)\)/;

var REGEXP_EXTERN_DIRNAME = /EXTERN_DIRNAME\s*=\s*(\'(.+)\'|\"(.+)\")/;
var REGEXP_SRC_DIRNAME    = /SRC_DIRNAME\s*=\s*(\'(.+)\'|\"(.+)\")/;
var REGEXP_BUILD_DIRNAME  = /BUILD_DIRNAME\s*=\s*(\'(.+)\'|\"(.+)\")/;
var REGEXP_BUNDLEIT       = /function\s*bundleIt\s*\(\s*b\s*\)\s<];


var REGEXP_HIDDEN_JSFILE = /_.*\.js$/;
var REGEXP_HIDDEN_CSSFILE = /_.*\.css$/;
*/

var fs = require('fs');
var pathLib = require('path');
var findup = require('find-up');
var colors = require('colors');
var Uglify = require('uglify-js');
var log = require('./log');

var REGEXP_JSFILE  = /\.js$/;
var REGEXP_CSSFILE = /\.css$/;
var REGEXP_STATEMENT_REQUIRE = /require\s*\(\s*[\'\"](.+)[\'\"]\s*\)/;
var SYSTEM_MODULES = {
    'assert': true,
    'buffer': true,
    'child_process': true,
    'cluster': true,
    'console': true,
    'crypto': true,
    'dns': true,
    'events': true,
    'fs': true,
    'http': true,
    'https': true,
    'net': true,
    'os': true,
    'path': true,
    'process': true,
    'punycode': true,
    'querystring': true,
    'readline': true,
    'stream': true,
    'tls': true,
    'dgram': true,
    'url': true,
    'util': true,
    'vm': true,
    'zlib': true
};

module.exports = {
    exists: function(path){
        var deferred = Promise.defer();
        fs.exists(path, function(b){
            deferred.resolve(b);
        });
        return deferred.promise;
    },
    
    readFile: function(pathVal){
        var deferred = Promise.defer();

        function plainFunc(){
            fs.readFile(pathVal, {}, function(err, data){
                if(err){
                    deferred.reject(err);
                    return;
                }
                log(('Disapathed to Local').cyan +
                    (': [' + pathVal + ']').grey);
                deferred.resolve(data);
            });
        }

        var isJS  = REGEXP_JSFILE.test(pathVal),
            isCSS = REGEXP_CSSFILE.test(pathVal);
        if(isJS || isCSS){
            findup('gulpfile.js', { cwd: pathVal }).then(function(gulpath){
                if(!gulpath){
                    plainFunc();
                    return;
                }

                var floorPath = pathLib.resolve(gulpath, '..');
                var parentDirname = pathLib.relative(floorPath, pathVal);
                var fi = parentDirname.indexOf(pathLib.sep);
                if(fi <= 0){
                    plainFunc();
                    return;
                }
                parentDirname = parentDirname.substring(0, fi);
                if(parentDirname === 'build'){
                    plainFunc();
                    return;
                }

                fs.readFile(gulpath, function(err, gulpfile){
                    gulpfile = gulpfile.toString();
                    var _vars = [], _funs = [];

                    var ast = Uglify.parse(gulpfile); 
                    ast.figure_out_scope();
                    var matched, lessed;
                    var walker = new Uglify.TreeWalker(function(node){
                        if(node instanceof Uglify.AST_SymbolVar && node.scope instanceof Uglify.AST_Toplevel){
                            node = walker.find_parent(Uglify.AST_Statement);
                            node = gulpfile.substring(node.start.pos, node.end.pos + 1);
                            matched = node.match(REGEXP_STATEMENT_REQUIRE);
                            if (matched){
                                if(matched[1] === 'gulp-less'){
                                    lessed = true;
                                }

                                if(!SYSTEM_MODULES[matched[1]]) {
                                    _vars.push(node.replace(REGEXP_STATEMENT_REQUIRE,
                                        'require(\'' + floorPath + '/node_modules/$1/\')'));
                                }else {
                                    _vars.push(node);
                                }
                            } else {
                                _vars.push(node);
                            }
                        }

                        if(node instanceof Uglify.AST_Defun){
                            if(node.name.name === 'buildOneJS'){
                                _funs.push(gulpfile.substring(node.start.pos, node.end.pos + 1));
                            }
                            if(node.name.name === 'buildOneCSS'){
                                _funs.push(gulpfile.substring(node.start.pos, node.end.pos + 1));
                            }
                        }
                    });
                    ast.walk(walker);
                    _vars.push('DEBUG = true;');
                    // TODO gulpfile 与 当前环境之间的路径问题
                    _vars = _vars.join('\n');
                    _funs = _funs.join('\n');
                    if(isCSS && lessed){
                        pathVal = pathVal.replace(REGEXP_CSSFILE, '.less');
                    }

                    try{
                        eval(_vars + '\n' + _funs);

                        var stream;
                        if(REGEXP_JSFILE.test(pathVal)){
                            stream = buildOneJS(pathVal);
                        }else {
                            stream = buildOneCSS(pathVal);
                        }
                        var chunks = [];
                        stream.on('data', function(chunk){
                            chunks.push(chunk._contents);
                        });
                        stream.on('end', function(){
                            deferred.resolve(Buffer.concat(chunks));
                        });
                    }catch(e){
                        console.error(e);
                        plainFunc();
                    }
                });
            }, function(){
                plainFunc();
            });
        }else {
            plainFunc();
        }

        //if(REGEXP_JSFILE.test(path)){
            //var floorPath = pathLib.resolve(path, '../..');
            //findup('gulpfile.js', { cwd: floorPath }).then(function(gfp){
                //if(!gfp){
                    //plainFunc();
                    //return;
                //}

                //fs.readFile(gfp, function(err, gfbuf){
                    //var gfctt = gfbuf.toString();
                    //if(!REGEXP_REQUIRE_BROWSERIFY.test(gfctt)){
                        //plainFunc();
                        //return;
                    //}

                    //var parentPath   = pathLib.resolve(gfp, '..');
                    //var relativePath = pathLib.relative(parentPath, path);
                    //var holderDirname   = relativePath.substring(0, relativePath.indexOf(pathLib.sep));
                    //var innerPath    = relativePath.substring(relativePath.indexOf(pathLib.sep) + 1);

                    //if(REGEXP_HIDDEN_JSFILE.test(innerPath)){
                        //deferred.reject(('Hidden Browserify JS File').yellow + 
                                        //(': [' + path + ']').grey);
                        //return;
                    //}

                    //var buildDirname = gfctt.match(REGEXP_BUILD_DIRNAME);
                    //buildDirname = buildDirname[2] || buildDirname[3] || undefined;

                    //var srcDirname = gfctt.match(REGEXP_SRC_DIRNAME);
                    //srcDirname = srcDirname[2] || srcDirname[3] || undefined;

                    //if(buildDirname && holderDirname === buildDirname){
                        //plainFunc();
                        //return;
                    //}

                    //if(srcDirname && holderDirname !== srcDirname){
                        //deferred.reject();
                        //return;
                    //}

                    //findup('package.json', { cwd: floorPath }).then(function(pkgp){
                        //var browserifyExternal = [];
                        //if(pkgp){
                            //try{
                                //browserifyExternal = JSON.parse(fs.readFileSync(pkgp)).browserify.external;
                            //}catch(e){}
                        //}

                        //var externDirname = gfctt.match(REGEXP_EXTERN_DIRNAME);
                        //externDirname = externDirname[2] || externDirname[3] || undefined;
                        //var externPattern = [];
                        //if(externDirname){
                            //var externDirpath = pathLib.resolve(parentPath, holderDirname, externDirname);
                            //externPattern.push(externDirpath + pathLib.sep + '**/*.js');
                            //externPattern.push('!' + externDirpath + pathLib.sep + '**/_*.js');         // 下划线开头的js文件
                            //externPattern.push('!' + externDirpath + pathLib.sep + '**/_*/**/*.js');    // 下划线开头的文件夹
                        //}

                        //glob(externPattern, function(err, externFiles){
                            //if(err) {
                                //deferred.reject(err);
                                //return;
                            //}

                            //var isExtern = innerPath.indexOf(externDirname) === 0;
                            //var b;
                            //if(isExtern){
                                //b = browserify({ 
                                    //debug: true,
                                    //basedir: parentPath
                                //}).require('.' + pathLib.sep + relativePath, {
                                    //expose: pathLib.sep + relativePath 
                                //}).external(externFiles.filter(function(ef){
                                    //return ef !== path;
                                //}).concat(browserifyExternal));
                            //}else {
                                //b = browserify(relativePath, { 
                                    //debug: true,
                                    //basedir: parentPath
                                //}).external(externFiles.map(function(ef){
                                    //return pathLib.relative(parentPath, ef);
                                //}).concat(browserifyExternal));
                            //}

                            //var bundle = gfctt.match(REGEXP_BUNDLEIT);
                            //var depth = 0, firstCurlyMathed = false;
                            //for(var i = bundle.index, n = gfctt.length; i < n; i++){
                                //if(gfctt.charAt(i) === '{'){
                                    //depth++;
                                    //if(!firstCurlyMathed){
                                        //firstCurlyMathed = true;
                                    //}
                                //}else if(gfctt.charAt(i) === '}'){
                                    //depth--;
                                    //if(firstCurlyMathed && depth === 0) break;
                                //}
                            //}
                            //if(firstCurlyMathed && depth === 0){
                                //bundle = gfctt.substring(bundle.index, i + 1);
                                //try{
                                    //eval(bundle);
                                    //bundle = bundleIt;
                                //}catch(e){
                                    //bundle = function(b){
                                        //b.bundle();
                                    //};
                                //}
                            //}else {
                                //bundle = function(b){
                                    //b.bundle();
                                //};
                            //}

                            //var chunks = [];
                            //bundle(b).on('data', function(chunk){
                                //chunks.push(chunk);
                            //}).on('end', function(){
                                //log(('Disapathed to Local and Browserified').cyan +
                                    //(': [' + path + ']').grey);

                                //deferred.resolve(Buffer.concat(chunks));
                            //}).on('error', function(err){
                                //deferred.reject({
                                    //code: 'ENOENT'
                                //});
                            //});
                        //});
                    //});
                //});
            //}, function(err){
                //deferred.reject(err);
            //});
        //}else if(REGEXP_CSSFILE.test(path)){
            //plainFunc();
        //}else {
            //plainFunc();
        //}

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
