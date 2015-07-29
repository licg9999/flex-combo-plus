/**
#convention
:ResponseWrapper
.write: function(chunk){
    chunk: Buffer
}
.end: function(){}
/convention

@exports: Object
        .wrap: function(response, options){
            response: http.ServerResponse,
            options : Object
            @return : ResponseWrapper
        }
**/
module.exports = (function(merge){
    
    function ResponseWrapper(response, options){
        this._value   = response;
        this._options = options;
    }
    ResponseWrapper.prototype = {

        writeHead: function(statusCode, headers){
            var _self = this;
            _self._value.writeHead(statusCode, headers);
        },
        
        write: function(chunk){
            var _self = this;
            _self._value.write(chunk);
        }
    };
    
    return {
        wrap: function(response, options){
            
            return new ResponseWrapper(response, options);
        }
    };
}(require('merge')));
