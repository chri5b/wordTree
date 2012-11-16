var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");;

var handle = {};
handle[""] = requestHandlers.staticFiles;
handle["/keyWord"] = requestHandlers.keyWordSearch;

server.start(router.route, handle);
