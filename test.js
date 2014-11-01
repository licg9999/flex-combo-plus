(function(http, instance){
    
    http.createServer(instance([

    ], {
        after: function(req, res){
            console.log('OK');
        }
    })).listen(8080);
    
}(require('http'), require('./instance')));
