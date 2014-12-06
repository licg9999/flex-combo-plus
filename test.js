(function(http, colors, instance, log, assert){
    
    var i = 1;
    
    http.createServer(instance([
        {
            name: 'test1',
            from: '/kissy/k/(\\d+\\.){2}\\d+/', 
            to  : 'D:/Temp/01/',
            disabled: true
        },
        {
            name: 'test2',
            from: /^\/kissy\/k\/1\.4\.2\//,
            to  : 'D:/Temp/',
            disabled: true
        },
        {
            name: 'test4',
            to  : 'src/',
            gitlab: {
                url   : 'your-gitlab-url',
                token : 'your-private-token',
                tag: {
                    pre: 'publish',
                    mid: '/'
                }
            },
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