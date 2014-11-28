(function(http, colors, instance, log, assert){
    
    var i = 1;
    
    http.createServer(instance([
        {
            name: 'test1',
            from: '/kissy/k/(\\d+\\.){2}\\d+/', 
            to  : 'D:/Temp/01/',
            disabled: false
        },
        {
            name: 'test2',
            from: '/asdfasd/adsfa/', 
            to  : 'D:/Temp/',
            disabled: false
        },
        {
            name: 'test2',
            from: /^\/kissy\/k\/1.4.2\//,
            to  : 'D:/Temp/',
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