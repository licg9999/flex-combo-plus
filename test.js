var http = require('http');

var main = require('./index.js');

var server = http.createServer(main([

], {
    error: function(req, res){
        console.log('error');
        res.end();
    },
    prev: function(req, res){
        console.log('prev');
    },
    next: function(req, res){
        console.log('next');
        res.end();
    },
}));

server.listen(8080);