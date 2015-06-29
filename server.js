var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');


var cache = {};

function send404(response){
	//console.log(res);
	response.writeHead(404, { 'Content-Type': 'text/plain' });
	response.write('Error 404');
	response.end();
};

function sendFile(res, filePath, fileContent){
	res.writeHead(200, {'Content-Type': mime.lookup(path.basename(filePath))});
	res.end(fileContent);
};

function serveStatic(res, cache, absPath){
	if(cache[absPath]){
		sendFile(res, absPath, cache[absPath]);
	} else {
		fs.exists(absPath, function(exists){
			if(exists){
				fs.readFile(absPath, function(err, data){
					if(err){
						send404(res);
					} else {
						cache[absPath] = data;
						sendFile(res, absPath, data);
					}
				});
			} else {
				send404(res);
			}
		});
	}
};

var server = http.createServer(function(req, response){
	var filePath = false;
	if(req.url=='/'){
		filePath = 'public/index.html';
	}else {
		filePath = 'public'+req.url;
	}
	var absPath = './'+filePath;

	serveStatic(response, cache, absPath);
});

server.listen(3000, function(){
	console.log('Server listening on port 3000');
});

var chatServer=require('./lib/chat_server');
chatServer.listen(server);

