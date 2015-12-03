/* jshint evil:true */
/* globals buildOneJS, buildOneCSS */

/**
@exports: Object
        .exists: function(){
            pathVal: string
            @return: Promise
        }
        .readFile: function(pathVal){
            pathVal: string
            @return: Promise
        }
        .stat: function(path){
            pathVal: string
            @return: Promise
        }
**/

require('colors');
var fs = require('fs');
var pathLib = require('path');
var findup = require('find-up');
var Uglify = require('uglify-js');
var log = require('./log');

var REGEXP_JSFILE  = /\.js$/;
var REGEXP_CSSFILE = /\.css$/;
var REGEXP_STATEMENT_REQUIRE = /require\s*\(\s*[\'\"](.+)[\'\"]\s*\)/;
var REGEXP_CALL_GULPDEST = /\.dest\s*\(.*\)/;
var REGEXP_CALL_ON_ERROR = /\.on\s*\(\s*\'error\'\s*\,.*\)/;
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
    exists: function(pathVal){
        var deferred = Promise.defer();
        fs.exists(pathVal, function(b){
            deferred.resolve(b);
        });
        return deferred.promise;
    },
    
    readFile: function(pathVal){
        var deferred = Promise.defer();

        function plainFunc(newPathVal){
            fs.readFile(newPathVal || pathVal, {}, function(err, data){
                if(err){
                    deferred.reject(err);
                    return;
                }
                log(('Disapathed to Local').cyan +
                    (': [' + pathVal + ']').grey);
                newPathVal? deferred.resolve([data, newPathVal]): deferred.resolve(data);
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
                    if(err){
                        plainFunc();
                        return;
                    }

                    gulpfile = gulpfile.toString();
                    var _vars = [], _funs = [];
                    var hasFuncBuildOne = false, hasLessed = false, lessCall = '';

                    var ast = Uglify.parse(gulpfile), matched, name;
                    ast.figure_out_scope();
                    var walker = new Uglify.TreeWalker(function(node){
                        if(node instanceof Uglify.AST_SymbolVar && node.scope instanceof Uglify.AST_Toplevel){
                            name = node.name;
                            node = walker.find_parent(Uglify.AST_Statement);
                            node = gulpfile.substring(node.start.pos, node.end.pos + 1);
                            matched = node.match(REGEXP_STATEMENT_REQUIRE);
                            if (matched){
                                if(matched[1] === 'gulp-less'){
                                    lessCall = name;
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
                            if(node.name.name === 'buildOneJS' || node.name.name === 'buildOneCSS'){
                                hasFuncBuildOne = true;
                                _funs.push('function ' + node.name.name + '(' + node.argnames.map(function(argument){
                                    return argument.name;
                                }).join(',') + '){');

                                node.body.forEach(function(statement, i){
                                    statement = gulpfile.substring(statement.start.pos, statement.end.pos + 1);
                                    if(REGEXP_CALL_ON_ERROR.test(statement)){
                                        //_funs.push('stream.on(\'error\', function(err){ log(err.toString().red); });');
                                    }else if(!REGEXP_CALL_GULPDEST.test(statement)){
                                        _funs.push(statement);
                                    }
                                });

                                _funs.push('}');
                            }
                        }

                        if(node instanceof Uglify.AST_Call){
                            if(node.expression.name === lessCall){
                                hasLessed = true;
                            }
                        }
                    });
                    ast.walk(walker);
                    if(!hasFuncBuildOne){
                        plainFunc();
                        return;
                    }
                    if(isCSS && hasLessed){
                        pathVal = pathVal.replace(REGEXP_CSSFILE, '.less');
                    }
                    fs.exists(pathVal, function(isLocal){
                        if(isLocal){
                            _vars.push('DEBUG = true;');
                            _vars = _vars.join('\n');
                            _funs = _funs.join('\n');

                            try{
                                var __handler__ = setTimeout(function(){
                                    deferred.reject();
                                }, 8888);

                                var __dirname = floorPath;
                                eval(_vars + '\n' + _funs);

                                var stream = isJS? buildOneJS(pathVal): buildOneCSS(pathVal);

                                var chunks = [];
                                stream.on('data', function(chunk){
                                    chunks.push(chunk._contents);
                                });
                                stream.on('end', function(){
                                    clearTimeout(__handler__);
                                    log(('Disapathed to Local').cyan +
                                        (': [' + pathVal + ']').grey);
                                    deferred.resolve([Buffer.concat(chunks), pathVal]);
                                });
                            }catch(e){
                                hasLessed? plainFunc(pathVal): plainFunc();
                            }
                        }else {
                            deferred.reject({
                                code: 'ENOENT'
                            });
                        }
                    });

                });
            }, function(){
                plainFunc();
            });
        }else {
            plainFunc();
        }
        return deferred.promise;
    },

    stat: function(pathVal){
        var deferred = Promise.defer();
        fs.stat(pathVal, function(err, stats){
            if(err){
                deferred.reject(err);
            }else {
                deferred.resolve(stats);
            }
        });
        return deferred.promise;
    }
};
