/**
@exports: function (options){
    options: Object
           .remote: Object 
                  .reversed: Object
           .protocol: string <! 'http'
           .host : Object
                 .seq  : string <! ':'
           .combo: Object
                 .start: string << '??'
                 .seq  : string << ','
                 .dir  : string <! '/'
           .query: Object
                 .start: string << '?'
                 .seq  : string << '&'
                 .ass  : string << '='
           | undefined | null
    @return >> options
}
**/

module.exports = (function(assert, merge){
    
    return function(options){
        if(!options){
            options = {};
        }

        /** configurable **/
        options = merge.recursive({
            remote:{ 
                'g.alicdn.com'             : '110.75.114.8',
                'g-assets.daily.taobao.net': '10.101.73.189',
                'g.tbcdn.cn'               : '140.205.132.240',
                'g.assets.daily.taobao.net': '10.101.73.189'
            },
            combo: {
                start: '??',
                seq  : ','
            },
            query: {
                start: '?',
                seq  : '&',
                ass  : '='
            }
        }, options);

        /** unconfigurable **/
        merge.recursive(options, {
            protocol: 'http',
            host    : {
                seq: ':'
            },
            combo   : {
                dir: '/'
            }
        });

        var k, v;
        options.remote.reversed = {};
        for(k in options.remote){
            v = options.remote[k];
            /** assertions start **/
            /**
             * if(listenPort === 80){
             *     assert.notEqual(v, '127.0.0.1', 'Misconfigured Remote(' + k + '  ' + v +')');
             * }
             * assert.notEqual(v, '127.0.0.1:' + listenPort, 'Misconfigured Remote(' + k + '  ' + v +')');
             */
            /** assertions -end- **/
            if(v !== options.remote.reversed){
                options.remote.reversed[v] = k;
            }
        }
        
        
        return options;
    };
}(require('assert'), require('merge')));
