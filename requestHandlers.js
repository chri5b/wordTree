//Core node libraries
var http = require("http");
var url = require("url");
var path = require("path");
var fs = require("fs");
var util = require("util");
//Node Package Dependencies
var restify = require("restify");
var querystring = require("querystring");
var dateFormat = require("dateformat");
//Project Dependencies
var keyWords = require("./keyWords");
var dickens = require("./dickens");
var joyce = require("./joyce");
var tolstoy = require("./tolstoy");
var austen = require("./austen");
var kipling = require("./kipling");
var treeProcessor = require("./treeProcessor");
//Config parameters
var maxKeyWords = 10;
var minValue = 2;

function staticFiles(pathname, response) {
	util.log("Request handler 'staticFiles' was called.");
	
	//Ignore the querystring while mapping to a static resource
	pathname = pathname.split('?')[0];
	
	var filePath = '.' + pathname;
	if (filePath == './client/') {filePath = './client/index.htm'}
	
	var extname = path.extname(filePath);
	var dictTypes = {
		'.js': 'text/javascript',
		'.css': 'text/css'
	};

	var contentType = dictTypes[extname] || 'text/html';
		
	path.exists(filePath, function(exists) {
		if(exists) {
			response.writeHead(200, {
				"Content-Type": contentType
				,"Date":getDateFormat(0)
				,"Expires":getDateFormat(1)		
			});
			fs.createReadStream(filePath, {
				'flags':'r',
				'bufferSize': 4 * 1024
			}).addListener('data', function(chunk) {
				response.write(chunk, 'binary');
			}).addListener('close', function() {
				response.end();
			});
		}
		else {
			response.writeHead(404);
			response.end();
		}
	});
		
}

function keyWordSearch(pathname, response) {
    util.log("Request handler 'keyWordSearch' was called");
    var thisUrl = url.parse(pathname,true);
    var thisQuery = thisUrl.query;
    var thisSearch = thisQuery.q;
    var thisBook = thisQuery.book;
    var thisUsername = thisQuery.username;
    var thisPassword = thisQuery.password;
    var thisReferrer = thisQuery.referrer;

    var rawKeyWords;
    if(thisBook) {
        switch (thisBook) {
            case "ulysses":
                rawKeyWords = joyce.ulysses();
                break;
            case "copperfield":
            case "":
                rawKeyWords = dickens.copperfield();
                break;
            case "warAndPeace":
                rawKeyWords = tolstoy.warAndPeace();
                break;
            case "jungle":
                rawKeyWords = kipling.jungle();
                break;
            case "pride":
                rawKeyWords = austen.pride();;
                break;
            default:
                response.writeHead(500,{"Content-Type": "text/plain"});
                response.write("invalid book parameter");
                response.end();
                break;
        }
    } else {
        rawKeyWords = joyce.ulysses();
    }
        var myKeyWords = [];
        //very ugly but necessary because otherwise each filter resulted in the list of keywords being whittled down.
		copyKeyWords(rawKeyWords,myKeyWords,thisSearch, function(copiedKeyWords,searchTerm) {
			filterKeyWords(copiedKeyWords,searchTerm, function(filteredKeyWords) {
				if(filteredKeyWords.length == 0) {
					console.log("ERROR: search returned no results: ",thisSearch);
					response.writeHead(404, {"Content-Type": "text/plain"});
					response.write("no results for "+ thisSearch);
					response.end();
				}
				else {
					/*
					if(filteredKeyWords.length > maxKeyWords)
					{
						console.log("INFO: pruning filtered keywords from " + filteredKeyWords.length + " to " + maxKeyWords);
						filteredKeyWords.length = maxKeyWords;
					}
					*/
				}
                treeProcessor.createTree(filteredKeyWords,searchTerm,maxKeyWords,function(error,errorText,postTreeData,preTreeData,d) {
                    if(error) {
                        response.writeHead(500,{"Content-Type": "text/plain"});
                        response.write(errorText);
                        response.end();
                    } else
                    {
                        var responseData = {};
                        responseData.matchingTerms = extractName(d);
                        responseData.preTree = preTreeData;
                        responseData.postTree = postTreeData;
                        response.writeHead(200, {"Content-Type": "text/plain"});
                        response.write(JSON.stringify(responseData,null,2));
                        response.end();
                    }
                });
			});
		});
    }

function copyKeyWords(chapters,myKeyWords,searchTerm,callback) {
            var paraCounter = 0;
	        for(var i=0;i<chapters.length;i++) {
                for(var j=0;j<chapters[i].paragraphs.length; j++) {
                    var newPara = {};
                    newPara.name = chapters[i].paragraphs[j].text;
                    newPara.value = 1;
                    myKeyWords[paraCounter] = newPara;
                    paraCounter++;
                }

            }
			callback(myKeyWords,searchTerm);
}

function filterKeyWords(keyWords,searchTerm,callback) {
		console.time("filterKeyWords");
        //only whole words will match. We also try to match against the search term with s on the end to naively catch plurals.
        var regex = new RegExp("(^|\\s)"+searchTerm+"(s)?(\\s|$|[,.?:!;'])","i");

        var filteredKeyWords = keyWords.filter(function(keyword) {
            return keyword.name.toString().search(regex) != -1;
        });
		
        util.log("INFO: found " + filteredKeyWords.length + " matches for " + searchTerm);
		console.timeEnd("filterKeyWords");
		callback(filteredKeyWords);
		
}

function getDateFormat(mins) {
	var now = new Date();
	var soon = new Date(now.getTime() + (mins*60*1000));
	return dateFormat(soon, "ddd, dd mmm yyyy HH:MM:ss 'GMT'");
}

function extractName(d) {
    var nameArray = [];
    for(var i = 0; i< d.length ; i ++) {
        nameArray.push(d[i].name);
    }
    return nameArray;
}

exports.staticFiles = staticFiles;
exports.keyWordSearch = keyWordSearch;
