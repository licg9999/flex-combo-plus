/**
@exports: function (options){
    options: Object
           .remote: Object 
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
                'g.assets.daily.taobao.net': '10.101.73.189',
                'assets.alicdn.com'        : '115.238.23.240',
                'assets.daily.taobao.net'  : '10.101.73.189'
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
        
        return options;
    };
}(require('assert'), require('merge')));
