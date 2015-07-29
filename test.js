(function(http, colors, instance, log){
    
    var i = 1;
    
    http.createServer(instance([
        {
            name: 'test1',
            from: '/group/project/subpath/(\\d+\\.){2}\\d+/', 
            to  : '/Users/uno/Temp/d/',
            disabled: false
        },
        {
            name: 'test2',
            from: '/group/project/(\\d+\\.){2}\\d+/', 
            to  : '/Users/uno/Temp/',
            disabled: false
        }
    ], {
        request: {
            /**
             * 允许设置到本地的反向代理，但由用户自己注意保证监听端口与目标端口不同
             */
            remote: {
                'localhost': '127.0.0.1:8080'
            }
        },
        after: function(req, res){
            res.end();
            console.log('request number: ' + i++);
        }
    })).listen(80);
    
    log('Service started'.green);
    
}(require('http'), require('colors'), require('./instance'), require('./log')));
