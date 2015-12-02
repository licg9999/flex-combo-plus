/**
#convention
:ReqPars
.protocol : string <! 'http'
.hostname : string
.port     : number << 80
.dirname  : string
.filenames: Array<string>
.query    : Object
.resolveFilename: function(i){
    i: number
    @return: string
}
.resolveDirname : function(i){
    i: number
    @return: string
}
.toString : function(filenameIndexes){
    filenameIndexes: Array<number>
    @return: string
}
.toUrlPars: function(filenameIndexes){
    filenameIndexes: Array<number>
    @return: UrlPars
}
/convention

@exports: Object
        .parse: function(request, options){
            request: http.IncomingMessage, 
            options >> request.fopts >> @exports >> options
            @return: ReqPars
        }
**/

var querystring = require('querystring');
var url = require('url');
var path = require('path');
var formatOptions = require('./request.fopts');

module.exports = {
    parse: function(request, options) {

        var hostPars = (request.headers.ahost || request.headers.host).split(options.host.seq),
            urlPath = path.normalize(request.url);

        var lenC = options.combo.start.length,
            posC = urlPath.indexOf(options.combo.start),
            hasC = posC >= 0;

        if (!hasC) {
            posC -= lenC - 1;
        }

        var lenQ = options.query.start.length,
            posQ = urlPath.substr(posC + lenC, urlPath.length).indexOf(options.query.start),
            hasQ = posQ >= 0;

        posQ += posC + lenC;
        if (!hasQ) {
            posQ -= lenQ - 1;
        }


        var out = new(function() {
            function Out() {}
            Out.prototype = {
                resolveDirname: function(i) {
                    var _self = this;
                    var resolvedDirname = _self.dirname + _self.filenames[i];
                    resolvedDirname = resolvedDirname.substring(0, resolvedDirname.lastIndexOf(options.combo.dir) + 1);
                    return resolvedDirname;
                },

                resolveFilename: function(i) {
                    var _self = this;
                    var resolvedFilename = _self.filenames[i];
                    resolvedFilename = resolvedFilename.substring(resolvedFilename.lastIndexOf(options.combo.dir) + 1,
                        resolvedFilename.length);
                    return resolvedFilename;
                },

                toString: function(filenameIndexes) {
                    var _self = this;
                    var url = _self.protocol + '://';

                    var host = options.remote[_self.hostname];
                    if (!host) {
                        host = _self.hostname + (_self.port === 80 ? '' : options.host.seq + _self.port);
                    }

                    url += host + _self.dirname;

                    var filenames;
                    if (filenameIndexes) {
                        filenames = [];
                        filenameIndexes.forEach(function(filenameIndex) {
                            filenames.push(_self.filenames[filenameIndex]);
                        });
                    } else {
                        filenames = _self.filenames;
                    }

                    if (filenames.length === 1) {

                        url += filenames[0];

                    } else if (filenames.length > 1) {

                        url += options.combo.start;

                        filenames.forEach(function(filename, i) {
                            url += filename + (i < filenames.length - 1 ? options.combo.seq : '');
                        });
                    }

                    var query = querystring.stringify(_self.query, options.query.seq, options.query.ass);
                    url += query ? (options.query.start + query) : '';

                    return url;
                },

                toUrlPars: function(filenameIndexes) {
                    var _self = this;
                    var urlPars = url.parse(this.toString(filenameIndexes));
                    urlPars.headers = {
                        host: _self.hostname
                    };
                    return urlPars;
                }
            };
            return Out;
        }())();

        (function protocol(o) {
            o.protocol = options.protocol;
        }(out));

        (function hostname(o) {
            o.hostname = hostPars[0];
        }(out));

        (function port(o) {
            o.port = hostPars[1] ? +hostPars[1] : 80;
        }(out));

        (function dirname(o) {
            if (hasC) {

                o.dirname = urlPath.substring(0, posC);
            } else {

                var pathname;
                if (hasQ) {

                    pathname = urlPath.substring(0, posQ);
                } else {

                    pathname = urlPath.substring(0, urlPath.length);
                }

                o.dirname = pathname.substring(0, pathname.lastIndexOf(options.combo.dir) + 1);
            }

            if (o.dirname.lastIndexOf(options.combo.dir) < o.dirname.length - 1) {
                o.dirname += options.combo.dir;
            }
        }(out));


        (function filenames(o) {
            var posS = urlPath.indexOf(o.dirname) + o.dirname.length,
                posE = urlPath.length;

            if (hasC) {
                posS += lenC;
            }

            if (hasQ) {
                posE = posQ;
            }

            var filenames = urlPath.substring(posS, posE);

            if (!filenames) {
                filenames = [];
            } else {
                if (hasC) {

                    filenames = filenames.split(options.combo.seq);
                } else {

                    filenames = [filenames];
                }
            }

            filenames.forEach(function(filename, i) {
                if (filename.indexOf(options.combo.dir) === 0) {
                    filenames[i] = filename.substring(1, filename.length);
                }
            });

            o.filenames = filenames;
        }(out));


        (function query(o) {
            if (hasQ) {

                o.query = querystring.parse(urlPath.substr(posQ + lenQ, urlPath.length),
                    options.query.seq, options.query.ass);
            } else {

                o.query = {};
            }
        }(out));

        return out;
    }
};
