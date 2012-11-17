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

function createTree(matchingTerms, searchTerm, callback) {

    var postTree = [];
    var preTree = [];
    var postTreeData = [];
    var preTreeData = [];
	var error = false;
	var errorText = "";
    
	if (searchTerm.indexOf(' ') != -1) {
		handleSpacesInMultiWordSearchTerm(searchTerm,matchingTerms)
	}
    processTreeData(matchingTerms,searchTerm,postTreeData,preTreeData);

	postTree = nestTreeData(postTreeData,"post",searchTerm);
	if (postTree == undefined) { 
		error=true;
		errorText="Failed to process postTreeData";
		window.console && console.log("ERROR :" + errorText); 
	}

	preTree = nestTreeData(preTreeData,"pre",searchTerm);
	if (preTree == undefined) {
		error=true;
		errorText="Failed to process preTreeData";
	}

	callback(error,errorText,postTree,preTree,matchingTerms);
}

function nestTreeData(inputData,format,searchTerm) {

    var result = [];
    

	
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

function handleSpacesInMultiWordSearchTerm(searchTerm,matchingTerms){
    //If the search term has spaces in, we want to replace them with underscores because our logic to 
	//  ensure the search term is at the root of all the trees depends on splitting terms by space.
    var originalSearchTerm = searchTerm;
    searchTerm = searchTerm.replace(/ /g,'_');
    for(var i=0;i<matchingTerms.length;i++) {
		if(matchingTerms[i]) {
			//replace every instance of the old search term eg "droit constitutionnel" with "droit_constitutionnel"
			matchingTerms[i].name = matchingTerms[i].name.replace(originalSearchTerm,searchTerm);
		}
	}
}

function processTreeData(matchingTerms,searchTerm,postTreeData,preTreeData) {
	//We're going to draw two trees, so we need two sets of data, one for the tree which precedes the search term, one for the tree which follows it.
	//input
	//  searchTerm: 		vice
	//  matchingTerms[0]: 	vice de forme - goes straight into post tree
	//  matchingTerms[1]: 	nullite de vice de forme - goes into both trees but needs to be pruned each way
	//  matchingTerms[2]: 	something something vice - goes into pre-tree, but needs to be reversed because each tree expects the search term to be the first word
	//output
	//  postTreeData :		['vice de forme','vice de forme']
	//  preTreeData :		['vice de nullite','vice something something']for(var i=0;i<matchingTerms.length;i++) {
	for(var i = 0; i < matchingTerms.length ; i++) {
		if(matchingTerms[i]) {
			matchingTerms[i].name = matchingTerms[i].name.toString().split(' ');

			//If the last word isn't the search term then put it into pre-Tree
			if(lastWordIsNotSearchTerm(matchingTerms[i].name,searchTerm)) {
				var preTerm = {};
				preTerm.name = matchingTerms[i].name.slice(0);
				preTerm.name = pruneTerm(preTerm.name,searchTerm);
				preTerm.value = matchingTerms[i].value;
				preTerm.matchingTermIndex = i;
				preTreeData.push(preTerm);
			}
			//If the first word isn't the search term, then put it into post-Tree 
			if(firstWordIsNotSearchTerm(matchingTerms[i].name,searchTerm)) {
				var postTerm = {};
				postTerm.name = matchingTerms[i].name.slice(0);
				postTerm.name.reverse();
				postTerm.name = pruneTerm(postTerm.name,searchTerm);
				postTerm.value = matchingTerms[i].value;
				postTerm.matchingTermIndex = i;
				postTreeData.push(postTerm);
			} 
		}
		else {
			//window.console && console.log("ERROR: matchingTerms["+i+"] doesn't exist: ", matchingTerms);
		}
	}
}


function pruneTerm(termToPrune,searchTerm) {
	//delete words at the front of the expression if they don't match the search term
	//necessary because both the pre and the post tree have expressions where the search term is in the middle.
	while(termToPrune[0] != searchTerm && termToPrune[0] != searchTerm +'s' ) {
		if (termToPrune.length == 0) {break;}
		termToPrune.shift();
	}
	return termToPrune;
}

function lastWordIsNotSearchTerm(wordArray,searchTerm) {
	return wordArray[wordArray.length] != searchTerm && wordArray[wordArray.length] != searchTerm+'s'
}

function firstWordIsNotSearchTerm(wordArray,searchTerm) {
	return wordArray[0] != searchTerm && wordArray[0] != searchTerm +'s'
}

