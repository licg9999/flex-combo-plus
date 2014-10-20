var juicer = require('juicer'),
    fs = require('fs'),
    path = require("path"),
    delog = require("debug.log"),
    sass = require('node-sass'),
    less = require('less'),
    isUtf8 = require("is-utf8"),
    iconv = require('iconv-lite');

var method_body = [
    "var __escapehtml = {",
    "escapehash: {",
    "'<': '&lt;',",
    "'>': '&gt;',",
    "'&': '&amp;',",
    "'\"': '&quot;',",
    "\"'\": '&#x27;',",
    "'/': '&#x2f;'",
    "},",
    "escapereplace: function(k) {",
    "return __escapehtml.escapehash[k];",
    "},",
    "escaping: function(str) {",
    "return typeof(str) !== 'string' ? str : str.replace(/[&<>\"]/igm, this.escapereplace);",
    "},",
    "detection: function(data) {",
    "return typeof(data) === 'undefined' ? '' : data;",
    "}",
    "};",

    "var __throw = function(error) {",
    "if(typeof(console) !== 'undefined') {",
    "if(console.warn) {",
    "console.warn(error);",
    "return;",
    "}",

    "if(console.log) {",
    "console.log(error);",
    "return;",
    "}",
    "}",

    "throw(error);",
    "};",

    "_method = _method || {};",
    "_method.__escapehtml = __escapehtml;",
    "_method.__throw = __throw;"
].join('');

function cosoleResp(type, c) {
    c += " [" + type + ']';

    switch (type) {
        case "Compile":
        case "Embed":
            delog.process(c);
            break;
        case "Error":
            delog.error(c);
            break;
        case "Local":
            delog.response(c);
            console.log('');
            break;
        default:
            delog.log(c);
    }
}

function getUTF8Str(filepath) {
    var buff = fs.readFileSync(filepath);
    return isUtf8(buff) ? buff.toString() : iconv.decode(buff, "gbk");
}

function lessCompiler(xcssfile, charset) {
    var lesstxt = getUTF8Str(xcssfile);

    lesstxt = lesstxt.replace(/@import\s+(["'])(\S+?)\1;?/mg, function (t, f, relpath) {
        var filepath = path.join(path.dirname(xcssfile), relpath);
        if (!/\.[a-z]{1,}$/i.test(filepath)) {
            filepath += ".less";
        }

        if (fs.existsSync(filepath)) {
            cosoleResp("Embed", filepath);
            return getUTF8Str(filepath);
        }
        else {
            return '';
        }
    });

    cosoleResp("Compile", xcssfile);

    var content = new (less.Parser)({processImports: false})
        .parse(lesstxt, function (e, tree) {
            if (e) {
                return "/*LESS COMPILE ERROR: "+xcssfile+"*/";
            }
            cosoleResp("Local", xcssfile);
            return tree.toCSS();
        }) + "\n";

    return iconv.encode(content, charset);
}

function scssCompiler(xcssfile, charset) {
    cosoleResp("Compile", xcssfile);

    var content = sass.renderSync({
        data: getUTF8Str(xcssfile),
        success: function () {
            cosoleResp("Local", xcssfile);
        }
    }) + "\n";

    return iconv.encode(content, charset);
}

exports.jstpl = function(absPath, charset, revPath, wrapper, anon) {
    revPath = revPath || "untitled";
    wrapper = wrapper || '';
    anon = anon ? true : false;

    // 前后端模板一致化，如果是*.html.js格式的请求，则编译*.html为juicer的function格式返回
    if (/\.html\.js$/i.test(absPath)) {
        var htmlName = absPath.replace(/\.js$/, '');
        try {
            var compiled = juicer(getUTF8Str(htmlName))._render.toString().replace(/^function anonymous[^{]*?{([\s\S]*?)}$/igm, function ($, fn_body) {
                return 'function(_, _method) {' + method_body + fn_body + '};\n';
            });
        }
        catch (e) {
            cosoleResp('Error', 'Compile failed with error ' + e.message);
            return '';
        }

        var templateFunction = '';
        // 未声明需要哪个定义模块  OR 声明的错误 OR 声明的是 window
        if (!wrapper || 'string' !== typeof wrapper || !!~['window', 'global', 'self', 'parent', 'Window', 'Global'].indexOf(wrapper)) {
            templateFunction = 'window["/' + revPath + '"] = ' + compiled;
        }
        else {
            if (anon) {
                templateFunction = wrapper + '(function(){return ' + compiled + '});';
            }
            else {
                templateFunction = wrapper + '("' + revPath + '", function () {return ' + compiled + '});';
            }
        }

        cosoleResp('Compile', htmlName);
        cosoleResp('Local', absPath);

        return iconv.encode(templateFunction, charset);
    }

    return null;
}

exports.css = function(absPath, charset) {
    if (/\.css$/i.test(absPath)) {

        var xcssfile = absPath.replace(/\.css$/i, '');

        // less文件解析 less.css => .less
        if (/\.less\.css$/i.test(absPath) && fs.existsSync(xcssfile)) {
            return lessCompiler(xcssfile, charset);
        }

        // scss文件解析 scss.css => scss
        if (/\.scss\.css$/i.test(absPath) && fs.existsSync(xcssfile)) {
            return scssCompiler(xcssfile, charset);
        }

        // .css => .less
        xcssfile = absPath.replace(/\.css$/i, '.less');
        if (!fs.existsSync(absPath) && fs.existsSync(xcssfile)) {
            return lessCompiler(xcssfile, charset);
        }
        // .css => .scss
        xcssfile = absPath.replace(/\.css$/i, '.scss');
        if (!fs.existsSync(absPath) && fs.existsSync(xcssfile)) {
            return scssCompiler(xcssfile, charset);
        }
    }

    return null;
}