(function(http, colors, instance, log){
    
    var i = 1;
    
    http.createServer(instance([
        {
            name: 'test1',
            from: '/kissy/k/d/(\\d+\\.){2}\\d+/', 
            to  : '/Users/uno/Temp/d/',
            disabled: false
        },
        {
            name: 'test2',
            from: '/kissy/k/(\\d+\\.){2}\\d+/', 
            to  : '/Users/uno/Temp/',
            disabled: false
        },
        {
            name: 'test3',
            from: '/Programs/css/',
            to  : '/Users/uno/Programs/css/',
            disabled: false
        }
    ], {
        request: {
            /**
             * 允许设置到本地的反向代理，但由用户自己注意保证监听端口与目标端口不同
             */
            remote: {
                'localhost': '127.0.0.1:8088'
            }
        },
        after: function(req, res){
            res.end();
            console.log('request number: ' + i++);
        }
    })).listen(80);
    
    log('Service started'.green);
    
}(require('http'), require('colors'), require('./instance'), require('./log')));
