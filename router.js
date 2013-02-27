var path = require("path");
var util = require("util");

function route(handle, pathname, response, db) {
	util.log("About to route a request for " + pathname);
	
	if (pathname.indexOf('/api/fingerPrintSearch?') !=-1)
		{
			handle['/fingerPrintSearch'](pathname, response);
		}
	else if (pathname.indexOf('/client/') !=-1)
		{
			var directory = pathname.substr(0,pathname.indexOf('/'));
			util.log("directory: ",directory);
		
			if (typeof handle[directory] === 'function') {
				handle[directory](pathname, response);
			}
			else
			{
				util.log("Request for file in client directory which isn't there: " + pathname);
				response.writeHead(404, {"Content-Type": "text/plain"});
				response.write("404 Not found");
				response.end();
			}
		}
	else if (pathname.indexOf('/test/') !=-1)
	{
		var directory = pathname.substr(0,pathname.indexOf('/'));
		util.log("directory: ",directory);
	
		if (typeof handle[directory] === 'function') {
			handle[directory](pathname, response);
		}
		else
		{
			util.log("Request for file in test directory which isn't there: " + pathname);
			response.writeHead(404, {"Content-Type": "text/plain"});
			response.write("404 Not found");
			response.end();
		}
	}
    else if (pathname.indexOf('/plugin/') !=-1)
	{
		var directory = pathname.substr(0,pathname.indexOf('/'));
		util.log("directory: ",directory);
	
		if (typeof handle[directory] === 'function') {
			handle[directory](pathname, response);
		}
		else
		{
			util.log("Request for file in plugin directory which isn't there: " + pathname);
			response.writeHead(404, {"Content-Type": "text/plain"});
			response.write("404 Not found");
			response.end();
		}
	}
	else
		{
			util.log("Invalid request received: " + pathname);
			response.writeHead(404, {"Content-Type": "text/plain"});
			response.write("404 Not found");
			response.end();
		}
}

exports.route = route;
