/**
@exports: Object
        .get: function(urlStr, options){
            urlStr : string
            options >> ./request.fopts >> @exports >> options
            @return: Promise
        }
**/
module.exports = (function(http, url, Promise, colors, log){
    
    return {
        get: function(urlStr, options){
            
            
            return new Promise(function(resolve, reject){
                
                var urlPars = url.parse(urlStr),
                    hostname = options.remote.reversed[urlPars.hostname];
                
                if(hostname){
                    urlPars.headers = { host: hostname };
                }else{
                    // 因为请求已经通过绑定转发到本地，但是配置项中没有任何对该主机的描述，
                    // 如果放任不管继续下行，将循环请求，所以这里要阻断
                    log('\n' + 
                        ('Unconfigured Remote(' + urlPars.hostname + ')').red +
                        (': [' + urlStr + ']').grey + 
                        '\n');
                    reject();
                    return;
                }
                
                http.get(urlPars, function(res){
                    
                    log(('Dispatched to Remote(' + hostname + ')').magenta +
                        (': [' + urlStr + ']').grey);
                    resolve(res);
                    
                }).on('error', function(e){
                    
                    reject(e);
                });
            });
        }
    };
}(require('http'), require('url'), require('promise'), require('colors'), require('./log')));
