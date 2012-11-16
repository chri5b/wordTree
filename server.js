var http = require("http");
var url = require("url");
var fs = require("fs");
var util = require("util");

function start(route, handle) {
  function onRequest(request, response) {
	
	util.log("request starting...");
	console.time("request");
	var filePath = request.url;
	
	var content = route(handle, filePath, response);
	console.timeEnd("request");
  }

  http.createServer(onRequest).listen(8889);
  util.log("Server has started.");
  
}
util.log("Server running at localhost:8889");

exports.start = start;
