var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");;

var handle = {};
handle[""] = requestHandlers.staticFiles;
handle["/fingerPrintSearch"] = requestHandlers.fingerPrintSearch;

server.start(router.route, handle);
