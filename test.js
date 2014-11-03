(function(http, instance){
    
    var i = 1;
    
    http.createServer(instance([
        {
            from: /^\/asdfasd\/adsfa\//, 
            to  : 'D:/Temp/'
        }
    ], {
        after: function(req, res){
            console.log('request number: ' + i++);
        }
    })).listen(80);
    
}(require('http'), require('./instance')));