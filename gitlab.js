/**
#convention
:GitlabConfig
.url  : string
.token: string
/convention
**/

/**
@exports: Object
        .file: function(config, params){
            config: GitlabConfig
            params: Object
                  .project : string
                  .branch  : string
                  .filename: string
            @return  : Promise
        }
**/
module.exports = (function(Gitlab, Promise, log){
    var cache = {};
    function instance(config){
        var key = config.host + config.token;
        if(cache[key]){
            return cache[key];
        }else {
            return (cache[key] = new Gitlab(config));
        }
    }
    
    return {
        file: function(config, params){
            return new Promise(function(resolve, reject){
                instance(config).projects.repository.showFile({
                    projectId: params.project,
                    ref      : params.branch,
                    file_path: params.filename
                }, function(data){
                    if(data){
                        log(('Dispatched to gitlab(' + config.url + ')').magenta +
                            (': ' + JSON.stringify(params)).grey);
                        resolve(new Buffer(data.content, data.encoding));
                    }else {
                        
                        reject();
                    }
                });
            });
        }
    };
}(require('gitlab'), require('promise'), require('./log')));
