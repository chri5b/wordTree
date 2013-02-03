function nestTreeData(inputData,searchTerm) {
    //covered by qUnit
    //assuming pruned and cleaned input data with name as an array of words making up the phrase
    var result = [];

    //for each matching term, make a data tree
    for(var i=0;i<inputData.length;i++) {
        result[i] = new DataTree(inputData[i].name, inputData[i].cleanName, inputData[i].value, inputData[i].matchingTermIndex,0,10,false,null,null,null);
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
    //covered by qunit
    tree1.value = (+tree1.value) + (+tree2.value);
    tree1.matchingTermIndex = tree1.matchingTermIndex + "," + tree2.matchingTermIndex;
    for (var i=0;i<tree2.children.length;i++) {
        var commonChild = tree1.getChildIndex(tree2.children[i].cleanName);
        if (commonChild != -1)
        {
            tree1.children[commonChild] = mergeTrees(tree1.children[commonChild],tree2.children[i]);
        }
        else
        {
            tree1.children.push(tree2.children[i]);
        }
        commonChild = undefined;
    }
    return tree1;
}

function DataTree(originalPhrase,phrase,value,matchingTermIndex,depth,maxDepth,stopChildren,useButtonNav,buttonText,onButtonClick) {
    //covered by qUnit
    this.name;
    this.cleanName;
    this.value = value;
    this.matchingTermIndex = matchingTermIndex.toString();
    this.children = [];
    this.isLeaf = false;
    this.depth = depth;
    this.isButton = stopChildren;
    if(this.isButton) { this.onButtonClick = onButtonClick }
    this.name = originalPhrase;
    this.cleanName = phrase[0];
    phrase.shift();

    if (phrase.length != 0 && depth < maxDepth) {
        this.children.push(new DataTree(originalPhrase,phrase,value,matchingTermIndex,this.depth+1,maxDepth,false,useButtonNav,buttonText,onButtonClick));
    } else {
        this.isLeaf = true;
        var buttonTextString = [];
        buttonTextString.push("button");

        if ((depth == maxDepth || phrase.length==0) && !stopChildren && useButtonNav) {
            this.children.push(new DataTree(originalPhrase,buttonTextString,value,matchingTermIndex,this.depth+1,this.depth+1,true,useButtonNav,buttonText, onButtonClick));
        }
    }

}

DataTree.prototype.getChildIndex = function(Name) {
    //covered by qUnit
    var result = -1;
    for(var i=0;i<this.children.length;i++)
    {
        if (this.children[i].cleanName == Name) {
            result = i;
            break;
        }
        if (this.children[i].cleanName + 's' == Name) {
            result = i;
            this.children[i].pluralAndSingular = true;
            this.children[i].ambiguousName = this.children[i].cleanName + "(s)";
            break;
        }
        if (this.children[i].cleanName == Name + 's') {
            result = i;
            this.children[i].pluralAndSingular = true;
            this.children[i].ambiguousName = this.children[i].cleanName.substr(0,this.children[i].cleanName.length-1) + "(s)";
            break;
        }
    }
    return result;
};

function processTreeData(matchingTerms,searchTerm,postTreeData,preTreeData) {
    //covered in qUnit
    //We're going to draw two trees, so we need two sets of data, one for the tree which precedes the search term, one for the tree which follows it.
    //We also prune the phrases, lowercase them, and remove trailing punctuation.
    //input (ignoring value)
    //  searchTerm: 		tennis
    //  matchingTerms[0]: 	tennis ball - goes straight into post tree
    //  matchingTerms[1]: 	bouncy, tennis ball - goes into both trees but needs to be pruned each way
    //  matchingTerms[2]: 	all I want is Tennis! - goes into pre-tree, but needs to be reversed because both trees expect the search term to be the first word
    //output (ignoring value)
    //  postTreeData :		[['tennis','ball'],['tennis','ball']]
    //  preTreeData :		[['tennis','bouncy'],['tennis','is','want','i','all']]

    var newTerms = [];

    for(var i = 0; i < matchingTerms.length ; i++) {
        if(matchingTerms[i]) {
            matchingTerms[i].cleanName = matchingTerms[i].name.toString().split(' ');
            for(var j = 0 ; j< matchingTerms[i].cleanName.length ; j++) {
                matchingTerms[i].cleanName[j] = removeTrailingPunctuation(matchingTerms[i].cleanName[j]);
            }

            var foundSearchTerms = findSearchTerms(matchingTerms[i],searchTerm);

            for (var j = 0 ; j < foundSearchTerms.length ; j++) {
                if(j==0) {
                    matchingTerms[i].searchTermIndex = foundSearchTerms[j];
                } else {
                    //If the search term occurs multiple times in a single matching term then make a new term and index the appropriate search term.
                    var newTerm = {};
                    newTerm.cleanName = matchingTerms[i].cleanName.slice(0);
                    newTerm.name = matchingTerms[i].name;
                    newTerm.value = matchingTerms[i].value;
                    newTerm.searchTermIndex = foundSearchTerms[j];
                    newTerms.push(newTerm);
                }
            }
        }
    }
    var matchingTermsWithDuplicates = matchingTerms.concat(newTerms);

    for(var i = 0; i < matchingTermsWithDuplicates.length ; i++) {
        if(matchingTermsWithDuplicates[i]) {
            //If the last word isn't the search term then put it into pre-Tree
            if(firstWordIsNotSearchTerm(matchingTermsWithDuplicates[i].cleanName,searchTerm)) {
                var preTerm = createTerm(matchingTermsWithDuplicates[i],i,searchTerm,false);
                preTreeData.push(preTerm);
            }
            //If the first word isn't the search term, then put it into post-Tree
            if(lastWordIsNotSearchTerm(matchingTermsWithDuplicates[i].cleanName,searchTerm)) {
                var postTerm = createTerm(matchingTermsWithDuplicates[i],i,searchTerm,true);
                postTreeData.push(postTerm);
            }
        }
    }
}

function findSearchTerms(matchingTerm,searchTerm) {
    var foundTerms = [];
    for (var i = 0; i < matchingTerm.cleanName.length ; i++) {
        if (!wordIsNotSearchTerm(matchingTerm.cleanName,searchTerm,i)) {
            foundTerms.push(i);
        }
    }
    return foundTerms;
}

function firstWordIsNotSearchTerm(wordArray,searchTerm) {
    //covered by qUnit
    return wordIsNotSearchTerm(wordArray,searchTerm,0);
}

function lastWordIsNotSearchTerm(wordArray,searchTerm) {
    //covered by qUnit
    return wordIsNotSearchTerm(wordArray,searchTerm,wordArray.length-1);
}

function wordIsNotSearchTerm(wordArray,searchTerm,index) {
    //covered by qUnit

    if (searchTerm) {
        var cleanedSearchTerm = removeTrailingPunctuation(searchTerm);
        var word = removeTrailingPunctuation(wordArray[index]);
        if(word == cleanedSearchTerm) {
            return false;
        }
        var pluralForm = cleanedSearchTerm + 's';
        if(word == removeTrailingPunctuation(pluralForm)) {
            return false;
        }
        if(cleanedSearchTerm.charAt(cleanedSearchTerm.length-1) == 's') { //if the last letter of the search term is 's' then check to see if the word matches without the 's'
            var singularCleanedSearchTerm = cleanedSearchTerm.substr(0,cleanedSearchTerm.length-1);
            if(word == singularCleanedSearchTerm) {
                singularCleanedSearchTerm = undefined;
                return false;
            } else {
                singularCleanedSearchTerm = undefined;
            }
        }
    }
    cleanedSearchTerm = undefined;

    return true;
}

function removeTrailingPunctuation(word) {
    //covered by qunit
    if(word != null) {
        return word.replace(/[?:!.,;']*$/,"").toLowerCase();
    }
    return null;
}

function createTree(matchingTerms, searchTerm, maxTerms, callback) {
    //partially covered in qUnit
    var postTree = [];
    var preTree = [];
    var postTreeData = [];
    var preTreeData = [];
    var error = false;
    var errorText = "";

    if (searchTerm.indexOf(' ') != -1) {
        handleSpacesInMultiWordSearchTerm(searchTerm,matchingTerms);
        searchTerm = searchTerm.replace(/ /g,"_");
    }

    processTreeData(matchingTerms,searchTerm,postTreeData,preTreeData);

    postTree = nestTreeData(postTreeData,searchTerm);

    postTree = pruneToMaxNodes(postTree,maxTerms);

    if (postTree == undefined) {
        error=true;
        errorText="Failed to process postTreeData";
    }

    preTree = nestTreeData(preTreeData,searchTerm);
    preTree = pruneToMaxNodes(preTree,maxTerms);

    if (preTree == undefined) {
        error=true;
        errorText="Failed to process preTreeData";
    }

    callback(error,errorText,postTree,preTree,matchingTerms);
}

function pruneToMaxNodes(tree,maxNodes) {
		var minValue = 1;
		tree = removeNodesBelowMinValue(tree,minValue);
		
		while(countNodes(tree) > maxNodes)
		{
			minValue ++;
			tree = removeNodesBelowMinValue(tree,minValue);
			
		}
		return tree;
}

function countNodes(tree) {
	if(tree) {
		var counter = 0;
		if(tree.children.length == 0) {
			counter ++;
		} else {
			for(var i=0; i < tree.children.length ; i++) {
					counter = counter + countNodes(tree.children[i]);
			}
		}
		return counter;
	} else {
		return false;
	}
}

function removeNodesBelowMinValue(tree,minValue) {
    if(tree) {
        if(tree.value > minValue) {
            for(var i = 0 ; i < tree.children.length ; i++) {
                tree.children[i] = removeNodesBelowMinValue(tree.children[i],minValue);
            }
            tree.children = tree.children.filter(function(element,index,array) {
                return element != null;
            })

        } else {
            return null;
        }
        return tree;
    } else {
        return null;
    }
}

function createTerm(matchingTerm,matchingTermIndex,searchTerm,isPost) {
    //covered by qUnit
    //assumes cleaned and lowercase terms
    var newTerm = {};
    newTerm.name=matchingTerm.name;
    newTerm.cleanName =matchingTerm.cleanName.slice(0);
    var searchTermIndex = matchingTerm.searchTermIndex;
    if(!isPost) {
        newTerm.cleanName.reverse();
        searchTermIndex = (newTerm.cleanName.length-1) - searchTermIndex;
    }
    newTerm.cleanName= pruneTerm(newTerm.cleanName,searchTermIndex);
    newTerm.value=matchingTerm.value;
    newTerm.matchingTermIndex=matchingTermIndex;
    return newTerm;
}

function pruneTerm(wordArray,searchTermIndex) {
    //covered by qunit
    //delete words at the front of the expression if they don't match the search term
    //necessary because both the pre and the post tree have expressions where the search term is in the middle.
    var prunedArray = wordArray.splice(0,searchTermIndex);

    return wordArray;
}

exports. createTree = createTree;