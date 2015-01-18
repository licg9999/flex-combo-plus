(function(http, colors, instance, log, assert){
    
    var i = 1;
    
    http.createServer(instance([
        {
            name: 'test1',
            from: '/kissy/k/(\\d+\\.){2}\\d+/', 
            to  : '/home/uno/Temp/d/',
            disabled: false
        },
        {
            name: 'test2',
            from: '/kissy/k/(\\d+\\.){2}\\d+/', 
            to  : '/home/uno/Temp/',
            disabled: false
        }
    ], {
        request: {
            remote: {
            }
        },
        after: function(req, res){
            console.log('request number: ' + i++);
        }
    })).listen(80);
    
    log('Service started'.green);
    
}(require('http'), require('colors'), require('./instance'), require('./log'), require('assert')));
