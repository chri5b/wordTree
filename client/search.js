var maxKeyWords = 40;


function DataTree(phrase,value,matchingTermIndex) {

    this.name;
    this.value;
    this.matchingTermIndex;
    this.children = [];
    
    this.name = phrase[0];
    phrase.shift();
    
    if (phrase.length == 0) {
        this.value = value;
        this.matchingTermIndex = matchingTermIndex;
    }
    else {
        this.children.push(new DataTree(phrase,value,matchingTermIndex));
    }
}

DataTree.prototype.hasChild = function(Name)
{
    result = -1;
    for(var i=0;i<this.children.length;i++)
    {
        if (this.children[i].name == Name || this.children[i].name + 's' == Name || this.children[i].name == Name + 's') {result = i; break; }
    }
    return result;
};

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

function search(searchTerm,username,password,callback) {
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

function createTree(matchingTerms, searchTerm, callback) {

    var searchTermIndex = [];
    var postTree = [];
    var preTree = [];
    var postTreeData = [];
    var preTreedata = [];
    
    //If the search term has spaces in, we want to replace them with underscores because otherwise our logic to ensure the search term is at the root of all the trees is foiled
    if (searchTerm.indexOf(' ') != -1)
    {
        var originalSearchTerm = searchTerm;
        searchTerm = searchTerm.replace(/ /g,'_');
        for(var i=0;i<matchingTerms.length;i++)
            {
                if(matchingTerms[i]) {
                    //replace every instance of the old search term eg "droit constitutionnel" with "droit_constitutionnel"
                    matchingTerms[i].name = matchingTerms[i].name.replace(originalSearchTerm,searchTerm);
                }
            }
    }

    for(var i=0;i<matchingTerms.length;i++)
    {
		var error = false;
		var errorText = "";
		
		if(matchingTerms[i]) {
		matchingTerms[i].name = matchingTerms[i].name.toString().split(' ');
        
        //searchTerm: vice
        //vice de forme - goes straight into post tree
        //nullite de vice de forme - goes into both trees but needs to be pruned each way
        //something something vice - goes into pre-tree
        

        if(matchingTerms[i].name[matchingTerms[i].name.length] != searchTerm && matchingTerms[i].name[matchingTerms[i].name.length] != searchTerm+'s') //If the last word isn't the search term then put it into pre-Tree
            {
                var preTerm = {};
                preTerm.name = matchingTerms[i].name.slice(0);
                preTerm.value = matchingTerms[i].value;
		preTerm.matchingTermIndex = i;
                preTreedata.push(preTerm);
            }
        if(matchingTerms[i].name[0] != searchTerm && matchingTerms[i].name[0] != searchTerm +'s') //If the first word isn't the search term, then put it into post-Tree
            {
                var postTerms = {};
                postTerms.name = matchingTerms[i].name.slice(0);
                postTerms.name.reverse();
                postTerms.value = matchingTerms[i].value;
		postTerms.matchingTermIndex = i;
                postTreeData.push(postTerms);
            } 
		}
		else {
			//window.console && console.log("ERROR: matchingTerms["+i+"] doesn't exist: ", matchingTerms);
		}
    }
    
    postTree = nestTreeData(postTreeData,"post",searchTerm);
    if (postTree == undefined) { 
		error=true;
		errorText="Failed to process postTreeData";
		window.console && console.log("ERROR :" + errorText); 
	}

    preTree = nestTreeData(preTreedata,"pre",searchTerm);
    if (preTree == undefined) {
		error=true;
		errorText="Failed to process preTreeData";
	}

	callback(error,errorText,postTree,preTree,matchingTerms);
   
}

function nestTreeData(inputData,format,searchTerm) {

    var result = [];
    
    //go through each matching term and delete words at the front of the expression if they don't match the search term
    //necessary because both the pre and the post tree have expressions where the search term is in the middle.
    for (var i=0;i<inputData.length;i++) {
        while(inputData[i].name[0] != searchTerm && inputData[i].name[0] != searchTerm +'s' ) {
            if (inputData[i].name.length == 0) {break;}
            inputData[i].name.shift();
        }
    }
    //for each matching term, make a data tree
    for(var i=0;i<inputData.length;i++) {
        result[i] = new DataTree(inputData[i].name, inputData[i].value, inputData[i].matchingTermIndex);
    }
    
    //merge all the data trees together (unless there's only one result)
    var mergedTree;
    if(result.length > 1)
        {
        for(var i=1;i<result.length;i++) {
          mergedTree = mergeTrees(result[0],result[i]);  
        }
        return mergedTree;
    }
    return result[0];
}

function mergeTrees(tree1,tree2) {
    result = tree1;
    for (var i=0;i<tree2.children.length;i++) {
        commonChild = tree1.hasChild(tree2.children[i].name)
        if (commonChild != -1)
            {
                tree1.children[commonChild] = mergeTrees(tree1.children[commonChild],tree2.children[i]);
            }
        else
            {
                tree1.children.push(tree2.children[i]);
            }
    }
    return tree1;
}
