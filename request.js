/**
#convention
:UrlParts
.hostname : string
.port     : number
.dirname  : string
.filenames: Array<string>
.query    : Object
/convention

@exports: Object
        .parse: function(request, options){
            request: http.IncomingMessage, 
            options: Object
                   .host : Object
                         .seq  : string <! ':'
                   .combo: Object
                         .start: string << '??'
                         .seq  : string << ','
                         .dir  : string <! '/'
                   .query: Object
                         .start: string << '?'
                         .seq  : string << '&'
                         .ass  : string << '='
                   | undefined | null
            @return: UrlParts
        }
**/

module.exports = (function(querystring, merge){
    
    return {
        parse: function(request, options){
            /** 格式化参数 **/
            (function format(){
                if(!options){
                    options = {};
                }
                
                /** configurable **/
                options = merge.recursive({
                    combo: {
                        start   : '??',
                        seq     : ','
                    },
                    query: {
                        start   : '?',
                        seq     : '&',
                        ass     : '='
                    }
                }, options);

                /** unconfigurable **/
                merge.recursive(options, {
                    host : {
                        seq     : ':'
                    },
                    combo: {
                        dir     : '/'
                    }
                });
            }());

            var hostParts = request.headers.host.split(options.host.seq),
                urlPath = request.url;

            var lenC = options.combo.start.length,
                posC = urlPath.indexOf(options.combo.start),
                hasC = posC >= 0;

            if(!hasC){
                posC -= lenC - 1; 
            }

            var lenQ = options.query.start.length,
                posQ = urlPath.substr(posC + lenC, urlPath.length).indexOf(options.query.start),
                hasQ = posQ >= 0;

            posQ += posC + lenC;
            if(!hasQ){
                posQ -= lenQ - 1;
            }


            var out = {};

            
            out.hostname = hostParts[0];

            
            out.port = +hostParts[1];

            
            out.dirname = (function(){
                if(hasC){

                    return urlPath.substring(0, posC);
                }else{

                    var pathname;
                    if(hasQ){

                        pathname = urlPath.substring(0, posQ);
                    }else{

                        pathname = urlPath.substring(0, urlPath.length);
                    }

                    return pathname.substring(0, pathname.lastIndexOf(options.combo.dir) + 1);
                }
            }());

            
            out.filenames = (function(){
                var posS = urlPath.indexOf(out.dirname) + out.dirname.length,
                    posE = urlPath.length;

                if(hasC){
                    posS += lenC;
                }

                if(hasQ){
                    posE = posQ;
                }

                var filenames = urlPath.substring(posS, posE);

                if(hasC){

                    filenames = filenames.split(options.combo.seq);
                }else{

                    filenames = [filenames];
                }

                return filenames;
            }());

            
            out.query = (function(){
                if(hasQ){

                    return querystring.parse(urlPath.substr(posQ + lenQ, urlPath.length), 
                                             options.query.seq, options.query.ass);
                }else{

                    return {};
                }
            }());

            return out;
        }
    };
    
}(require('querystring'), 
  require('merge')
 ));