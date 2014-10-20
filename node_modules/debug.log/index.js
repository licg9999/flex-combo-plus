var colors = {
    bold: [ 1, 22 ],
    italic: [ 3, 23 ],
    underline: [ 4, 24 ],
    inverse: [ 7, 27 ],
    white: [ 37, 39 ],
    grey: [ 89, 39 ],
    black: [ 30, 39 ],
    blue: [ 34, 39 ],
    cyan: [ 36, 39 ],
    green: [ 32, 39 ],
    magenta: [ 35, 39 ],
    red: [ 31, 39 ],
    yellow: [ 33, 39 ]
};
var styles = {
    "special"   : 'cyan',
    "number"    : 'yellow',
    "boolean"   : 'green',
    "undefined" : 'grey',
    "null"      : 'bold',
    "string"    : 'white',
    "date"      : 'magenta',
    "regexp"    : 'red',
    "dft"       : "white"
};
exports.colors = colors;
exports.styles = styles;

function colorFull (color, str, style, wrap) {
    var prefix = '\x1B[';

    return [
        wrap ? '·'+new Array(10-str.length).join(' ') : '',
        style ? (prefix + style[0] + 'm') : '',
        prefix, color[0], 'm',

        str,
        prefix, color[1], 'm',
        style ? (prefix + style[1] + 'm') : '',
        wrap ? ' ' : ''
    ].join('');
}

var confs =[
    {
        name: "Log",
        color: colors.white
    },
    {
        name: "Warn",
        color: colors.yellow,
        style: colors.underline
    },
    {
        name:"Error",
        color: colors.red,
        style: colors.inverse
    },
    {
        name:"Request",
        color: colors.blue,
        prefix: "=>"
    },
    {
        name:"Response",
        color: colors.cyan,
        prefix: "<="
    },
    {
        name:"Process",
        color: colors.yellow
    },
    {
        name:"Success",
        color: colors.green,
        style: colors.underline
    }
];
confs.forEach(function(conf) {
    var prefix = colorFull(conf.color, conf.name, conf.style, true);
    var name = conf.name.trim().toLowerCase();
    var fn = console[name] || console.log;
    var reToken = /\%[a-zA-Z]/g;
    var TAB_SIZE = 2;

    exports[name] = function (str) {
        if (conf.prefix) {
            str = colorFull(conf.color, conf.prefix+' '+str);
        }
        var args = Array.prototype.slice.call(arguments);
        var lv = args.slice(-1)[0];
        var i = -1;
        var target = '';
        var space = '';
        var _check;
        // 匹配到  util.log('name is %s and age is %d!', name, age);
        if (typeof str === 'string') {
            target = args.shift();
            _check = (str.match(reToken) ||[]).length;
            // 匹配到  util.log('name is %s and age is %d!', name, age, 1);
            if (args.length === _check + 1 && lv|0 === lv) {
                args.pop();
                space = new Array(lv * TAB_SIZE + 1).join(' ');
            }
        }
        target = target.replace(reToken, function(token) {
            var s = this.toString.call(args[++i]);
            var type = s.substr(8, s.length - 9).toLowerCase();
            if (!!~['object','array'].indexOf(type)) {
                type = 'special';
            }
            return colorFull(colors[styles[type] || 'white'], token);
        });
        args.unshift(space + prefix + target);

        fn.apply(console, args);
    };
});