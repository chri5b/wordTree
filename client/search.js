var maxKeyWords = 40;

function getRequest(initialSearchTerm) {
    var request = $.ajax({
          url: "/keyWord?",
          type: "GET",
          data: {"q":initialSearchTerm},
          dataType: "json"
        });
    return request
}

function searchAndProcess(searchTerm,callback) {
        //only whole words will match. We also try to match against the search term with s on the end to naively catch plurals.
    var error = false;
	var errorText = "";
	var referrerHost = parseUri(document.referrer).host;
	
		$.ajax({
        		type:"GET",
        		url: "/keyWord?",
        		data: {
            			"q":searchTerm,
				"username":username,
				"password":password,
				"referrer":referrerHost
	            },
        dataType:"json",
        success: function(data) {
			data.length = maxKeyWords;
            createTree(data,searchTerm,function(error,errorText,postTree,preTree,data) { 

				callback(error,errorText,postTree,preTree,data);
			});
        },
        error: function(errorData,errorCode) {
			error = true;
			
			window.console && console.log(errorData);
			if(errorData.status==403)
				{
					window.console && console.log("username password combination not correct");
					errorText = "Username or password is incorrect";
								
				}
			else if (errorData.status==404)
				{
					errorText = "There is no content which matches your search";
					$("#errorDiv").html("No content matches your search").show().fadeOut(2000);				
				}
			else
				{
					errorText = "An error occurred on the server";
					$("#errorDiv").html("An error occurred on the server").show().fadeOut(2000);	
				}
			callback(error,errorText,null,null,null);
        }
    });
}

// parseUri 1.2.2
// // (c) Steven Levithan <stevenlevithan.com>
// // MIT License
//
 function parseUri (str) {
 	var	o   = parseUri.options,
 	m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
 	uri = {},
 	i   = 14;

 	while (i--) uri[o.key[i]] = m[i] || "";
	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});
	return uri;
};

parseUri.options = {
	strictMode: false,
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q:   {
		name:   "queryKey",
 		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
 	},
 	parser: {
 		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
 		loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
 	}
 };


