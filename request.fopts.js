/**
@exports: function (options){
    options: Object
           .remote: Object 
                  .reversed: Object
           .protocal: string <! 'http'
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
                'g.tbcdn.cn'               : '115.238.23.240',
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
            protocal: 'http',
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
            assert.notEqual(v, '127.0.0.1', 'Misconfigured Remote(' + k + '  ' + v +')');
            /** assertions -end- **/
            if(v !== options.remote.reversed){
                options.remote.reversed[v] = k;
            }
        }
        
        
        return options;
    };
}(require('assert'), require('merge')));