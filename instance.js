/**
#convention
:Rule
.name: string
.from: string|RegExp
.to  : string
/convention

@exports: function(rules, options){
    rules  : Array<Rule> | undefined | null
    options: Object 
           .request >> ./request >> @exports.parse >> options
           .response: Object
           | undefined | null
           
    @return: function(req, res, nex){
        req: http.IncomingMessage
        res: http.ClientRequest
        nex: function(){} | undefined | null
    }
}
**/

module.exports = (function(http, fs, merge, request, try2do, log){
    
    return function(rules, options){
        /** 格式化参数 **/
        (function format(){
            if(!rules){ 
                rules = []; 
            }
            
            if(!options){ 
                options = {}; 
            }
            
            /** configurable **/
            options = merge.recursive({
                response: {
                    encoding: 'utf8'
                },
                after: function(req, res){
                    
                },
                error: function(req, res){
                    res.writeHead(500, { 'Content-Type': 'text/html' });
                    res.write('<h1>500 Error</h1>', this.response.encoding);
                    log('OK');
                }
            }, options);
        }());
        
        return function(req, res){
            
            var reqPars = request.parse(req, options.request);
                                        
            function next(){
                try2do(options.after.bind(options, req, res), 
                       options.error.bind(options, req, res));
                
                try2do(res.end.bind(res));
            }
            
            console.log(reqPars);
            
            next();
        };
    };
}(require('http'), 
  require('fs'), 
  require('merge'), 
  require('./request'), 
  require('./try2do'), 
  require('./log')
 ));