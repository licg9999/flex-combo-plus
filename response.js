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

module.exports = {
    wrap: function(response, options){
        return new ResponseWrapper(response, options);
    }
};
