/**
#convention
:UrlParts
.protocal : string <! 'http'
.hostname : string
.port     : number << 80
.dirname  : string
.filenames: Array<string>
.query    : Object
/convention

@exports: Object
        .parse: function(request, options){
            request: http.IncomingMessage, 
            options: Object
                   .protocal: string <! 'http'
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
            (function format(){
                if(!options){
                    options = {};
                }
                
                /** configurable **/
                options = merge.recursive({
                    combo: {
                        start: '??',
                        seq  : ','
                    },
                    query: {
                        start: '?',
                        seq  : '&',
                        ass  : '='
                    }
                }, options);

                /** unconfigurable **/
                merge.recursive(options, {
                    protocal: 'http',
                    host    : {
                        seq: ':'
                    },
                    combo   : {
                        dir: '/'
                    }
                });
            }());

            
            var hostPars = request.headers.host.split(options.host.seq),
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
            
            (function protocal(o){
                o.protocal = options.protocal;
            }(out));
            
            (function hostname(o){
                o.hostname = hostPars[0];
            }(out));

            (function port(o){
                o.port = hostPars[1]? +hostPars[1]: 80;
            }(out));

            
            (function dirname(o){
                if(hasC){

                    o.dirname = urlPath.substring(0, posC);
                }else{

                    var pathname;
                    if(hasQ){

                        pathname = urlPath.substring(0, posQ);
                    }else{

                        pathname = urlPath.substring(0, urlPath.length);
                    }

                    o.dirname = pathname.substring(0, pathname.lastIndexOf(options.combo.dir) + 1);
                }
                
                if(o.dirname.lastIndexOf(options.combo.dir) < o.dirname.length - 1){
                    o.dirname += options.combo.dir;
                }
            }(out));

            
            (function filenames(o){
                var posS = urlPath.indexOf(o.dirname) + o.dirname.length,
                    posE = urlPath.length;

                if(hasC){
                    posS += lenC;
                }

                if(hasQ){
                    posE = posQ;
                }

                var filenames = urlPath.substring(posS, posE);

                if(!filenames){
                    filenames = [];
                }else{
                    if(hasC){

                        filenames = filenames.split(options.combo.seq);
                    }else{

                        filenames = [filenames];
                    }
                }
                

                o.filenames = filenames;
            }(out));
            

            (function query(o){
                if(hasQ){

                    o.query = querystring.parse(urlPath.substr(posQ + lenQ, urlPath.length), 
                                             options.query.seq, options.query.ass);
                }else{

                    o.query = {};
                }
            }(out));
            
            (function methods(o){
                o.toString = function(filenames){
                    var url = o.protocal + '://' + o.hostname + (o.port === 80? '': (options.host.seq + o.port)) + o.dirname;
                    if(!filenames){
                        filenames = o.filenames;
                    }
                    
                    if(filenames.length === 1){
                        
                        url += filenames[0];
                        
                    }else if(filenames.length > 1){
                        
                        url += options.combo.start;
                        
                        filenames.forEach(function(filename, i){
                            url += filename + (i < filenames.length - 1? options.combo.seq: '');
                        });
                    }
                    
                    var query = querystring.stringify(o.query, options.query.seq, options.query.ass);
                    url += query? (options.query.start + query): '';
                    
                    return url;
                };
            }(out));

            return out;
        }
    };
    
}(require('querystring'), 
  require('merge')
 ));