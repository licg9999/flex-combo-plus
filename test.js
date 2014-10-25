(function(){
    
    var http = require('http');

    var main = require('./index.js');

    var server = http.createServer(function(req, res){
        var comboFn = main([

        ], {
        });

        comboFn(req, res);
    });

    server.listen(8080);
}());
