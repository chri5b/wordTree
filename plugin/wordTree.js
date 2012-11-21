function wordTree() {
  var margins = [20,20,20,20],
      width = $(window).width() - margins[1] - margins[3],
      height = $(window).height() - margins[0] - margins[2],
      textSizeMultiplier = width/2000;
      maxSize =0;
      preTreeData = [];
      postTreeData = [];
      nameAccessor = function(d) { return d.name; };
      valueAccessor = function(d) { return d.value; };
      onClick = function(d) {};
      onDragEnd = function(d) { console.log(d.name + " selected"); };
      maxResults = 40;

  function my(selection) {
    selection.each(function(d,i) {
    
        var targetElementId = this.id;
        var targetElement = d3.select("#"+targetElementId);
        
        my.preTreeData([]);
        my.postTreeData([]);
        
        if($("#svg").length == 0){
            var svgElement = targetElement.append("svg:svg").attr("id","svg");
            
            svgElement.append("svg:g").attr("id","previs");
            svgElement.append("svg:g").attr("id","vis");
        }
        
        var d3TreeLayout = d3.layout.tree();
        
        d3TreeLayout.size([my.height(), my.width()/2]);
	
        d3.select("#svg")
            .attr("width", my.width() - (my.margins()[1] + my.margins()[3])+'px')
            .attr("height", (my.height() - (my.margins()[0] + my.margins()[2])) + 'px');
        
        d3.select("#vis")
            .attr("transform", "translate(" + (((my.width())/2) + my.margins()[1]) + "," + my.margins()[0] + ")");	
        
        d3.select("#previs")
            .attr("transform", "translate("+my.margins()[1]+"," + my.margins()[0] + ")");
            
        var relevantData = extractRelevantData(d);

        createTree(relevantData,searchTerm,function(error,errorText,postTreeData,preTreeData,d) {
            my.preTreeData(preTreeData);
            my.postTreeData(postTreeData);
            my.maxSize(Math.max(preTreeData.value,postTreeData.value));
            
            var previs = d3.select("#previs");
            var vis = d3.select("#vis");
            previs.empty();
            vis.empty();
            d3TreeLayout.size([my.height() - (my.margins()[0] + my.margins()[2]), my.width()/2 - (my.margins()[1] + my.margins()[3])]);
            update(preTreeData,"pre",d3.select("#previs"),d3TreeLayout); 
            update(postTreeData,"post",d3.select("#vis"),d3TreeLayout);        
        });
        

    });
 }

  my.maxSize = function(value) {
    if (!arguments.length) return maxSize;
    maxSize = value;
    return my;
  };
  
  my.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    textSizeMultiplier = value/2000;
    return my;
  };

  my.height = function(value) {
    if (!arguments.length) return height;
    height = value;
    return my;
  };
  
  my.textSizeMultiplier = function(value) {
    if (!arguments.length) return textSizeMultiplier;
    textSizeMultiplier = value;
    return my;
  }
  
  my.margins = function(value) {
    if (!arguments.length) return margins;
    margins = value;
    return my;
  }
  
  my.preTreeData = function(value) {
    if (!arguments.length) return preTreeData;
    preTreeData = value;
    return my;
  }
  
  my.postTreeData = function(value) {
    if (!arguments.length) return postTreeData;
    postTreeData = value;
    return my;
  }
  
  my.nameAccessor = function(value) {
    if (!arguments.length) return nameAccessor;
    nameAccessor = value;
    return my;
  }
  
  my.valueAccessor = function(value) {
    if (!arguments.length) return valueAccessor;
    valueAccessor = value;
    return my;
  }
  
  my.onClick = function(value) {
    if (!arguments.length) return onClick;
    onClick = value;
    return my;
  }
  
  my.onDragEnd = function(value) {
    if (!arguments.length) return onDragEnd;
    onDragEnd = value;
    return my;
  }
  
  my.searchTerm = function(value) {
    if (!arguments.length) return searchTerm;
    searchTerm = value;
    return my;
  }
  
  my.maxResults = function(value) {
    if (!arguments.length) return maxResults;
    maxResults = value;
    return my;
  }

  return my;


    function createTree(matchingTerms, searchTerm, callback) {
        //partially covered in qUnit
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

        postTree = nestTreeData(postTreeData,searchTerm);
        if (postTree == undefined) { 
            error=true;
            errorText="Failed to process postTreeData";
            window.console && console.log("ERROR :" + errorText); 
        }

        preTree = nestTreeData(preTreeData,searchTerm);
        if (preTree == undefined) {
            error=true;
            errorText="Failed to process preTreeData";
        }
        
        callback(error,errorText,postTree,preTree,matchingTerms);
    }
    
    function extractRelevantData(inputData) {
        var extractedData = [];
        var iteratorLimit = Math.min(inputData.length,my.maxResults());
        var nameAccessFunction = my.nameAccessor();
        var valueAccessFunction = my.valueAccessor();
        
        for(var i = 0 ; i < iteratorLimit ; i++ ) {
            var newItem = {};
            newItem.name = nameAccessFunction(inputData[i]);
            newItem.value = valueAccessFunction(inputData[i]);
            extractedData.push(newItem);
        }
        return extractedData;
    }
        
    function handleSpacesInMultiWordSearchTerm(searchTerm,matchingTerms){
        //covered in qUnit    
        //If the search term has spaces in, we want to replace them with underscores because our logic to 
        //  ensure the search term is at the root of all the trees depends on splitting terms by space.
        var originalSearchTerm = searchTerm;
        searchTerm = searchTerm.replace(/ /g,'_');

        var re = new RegExp(originalSearchTerm,"gi")
        
        for(var i=0;i<matchingTerms.length;i++) {
            if(matchingTerms[i]) {
                //replace every instance of the old search term eg "droit constitutionnel" with "droit_constitutionnel"
                matchingTerms[i].name = matchingTerms[i].name.replace(re,searchTerm);
            }
        }
    }
        
    function processTreeData(matchingTerms,searchTerm,postTreeData,preTreeData) {
        //covered in qUnit
        //We're going to draw two trees, so we need two sets of data, one for the tree which precedes the search term, one for the tree which follows it.
        //We also prune the phrases, lowercase them, and remove trailing punctuation.
        //input (ignoring value)
        //  searchTerm: 		tennis
        //  matchingTerms[0]: 	tennis ball - goes straight into post tree
        //  matchingTerms[1]: 	bouncy, tennis ball - goes into both trees but needs to be pruned each way
        //  matchingTerms[2]: 	all I want is Tennis! - goes into pre-tree, but needs to be reversed because both trees expects the search term to be the first word
        //output (ignoring value)
        //  postTreeData :		[['tennis','ball'],['tennis','ball']]
        //  preTreeData :		[['tennis','bouncy'],['tennis','is','want','i','all']]

        for(var i = 0; i < matchingTerms.length ; i++) {
            if(matchingTerms[i]) {
                matchingTerms[i].cleanName = matchingTerms[i].name.toString().split(' ');
                for(var j = 0 ; j< matchingTerms[i].cleanName.length ; j++) {
                    matchingTerms[i].cleanName[j] = removeTrailingPunctuation(matchingTerms[i].cleanName[j]);
                } 

                //If the last word isn't the search term then put it into pre-Tree
                if(lastWordIsNotSearchTerm(matchingTerms[i].cleanName,searchTerm)) {
                    var preTerm = createTerm(matchingTerms[i],i,searchTerm,false);
                    postTreeData.push(preTerm);
                }
                //If the first word isn't the search term, then put it into post-Tree 
                if(firstWordIsNotSearchTerm(matchingTerms[i].cleanName,searchTerm)) {
                    var postTerm = createTerm(matchingTerms[i],i,searchTerm,true);
                    preTreeData.push(postTerm);
                } 
            }
        }
    }

    function createTerm(matchingTerm,matchingTermIndex,searchTerm,isPost) {
        //covered by qUnit
        //assumes cleaned and lowercase terms
        var newTerm = {};
        newTerm.name=matchingTerm.name
        newTerm.cleanName =matchingTerm.cleanName.slice(0);
        if(isPost) {newTerm.cleanName.reverse();}
        newTerm.cleanName= pruneTerm(newTerm.cleanName,searchTerm);
        newTerm.value=matchingTerm.value;
        newTerm.matchingTermIndex=matchingTermIndex;
        return newTerm;
    }

    function nestTreeData(inputData,searchTerm) {
        //covered by qUnit
        //assuming pruned and cleaned input data with name as an array of words making up the phrase
        var result = [];
        
        //for each matching term, make a data tree
        for(var i=0;i<inputData.length;i++) {
            result[i] = new DataTree(inputData[i].name, inputData[i].cleanName, inputData[i].value, inputData[i].matchingTermIndex);
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

    function lastWordIsNotSearchTerm(wordArray,searchTerm) {
        //covered by qUnit
        return wordIsNotSearchTerm(wordArray,searchTerm,false);
    }

    function firstWordIsNotSearchTerm(wordArray,searchTerm) {
        //covered by qUnit
        return wordIsNotSearchTerm(wordArray,searchTerm,true);
    }

    function wordIsNotSearchTerm(wordArray,searchTerm,first) {
        //covered by qUnit
        var wordIndex;
        if (first==true) {
            wordIndex = 0;
        } else {
            wordIndex = wordArray.length-1;
        }
        
        if (searchTerm) {
            cleanedSearchTerm = removeTrailingPunctuation(searchTerm)
            var word = removeTrailingPunctuation(wordArray[wordIndex]);
            if(word == cleanedSearchTerm) {
                return false;
            }
            var pluralForm = cleanedSearchTerm + 's';
            if(word == removeTrailingPunctuation(pluralForm)) {
                return false;
            }
            if(cleanedSearchTerm.charAt(cleanedSearchTerm.length-1) == 's') { //if the last letter of the search term is 's' then check to see if the word matches without the 's'
                singlularCleanedSearchTerm = cleanedSearchTerm.substr(0,cleanedSearchTerm.length-1);
                if(word == singlularCleanedSearchTerm) {
                    return false;
                }
            }
        }
        return true;
    }

    function removeTrailingPunctuation(word) {
        //covered by qunit
        if(word != null) {
            return word.replace(/[?:!.,;']*$/,"").toLowerCase();
        }
        return null;
    }

    function pruneTerm(wordArray,searchTerm) {
        //covered by qunit
        //delete words at the front of the expression if they don't match the search term
        //necessary because both the pre and the post tree have expressions where the search term is in the middle.
        
        while(wordIsNotSearchTerm(wordArray,searchTerm,true)) {
            if (wordArray.length == 0) {break;}
            wordArray.shift();
        }
        return wordArray;
    }	

    function mergeTrees(tree1,tree2) {
        //covered by qunit
        result = tree1;
        tree1.value = (+tree1.value) + (+tree2.value);
        tree1.matchingTermIndex = tree1.matchingTermIndex + "," + tree2.matchingTermIndex;
        for (var i=0;i<tree2.children.length;i++) {
            commonChild = tree1.getChildIndex(tree2.children[i].cleanName)
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

    function update(source,preOrPost,visualisation,d3TreeLayout) {

        // Set vertical alignment of tree in the middle of the screen
        source.x0 = my.height() / 2;
        source.y0 = 0;
      
        // Set duration for transitions
        var duration = 500;

        var treeData = prepareTreeData(d3TreeLayout,source,preOrPost); 
        
        // use d3 to bind all the svg g elements which have the 'node' class to the tree data
        var d3NodeData = visualisation.selectAll("g.node")
                .data(treeData, function(d) { return d.id || (d.id = ++nodeIDCounter); });

        var dragBehaviour = defineDragBehaviour(preOrPost);

        drawNodes(d3NodeData,preOrPost,dragBehaviour,source,duration);

        // Use d3 to bind all the svg path elements which have the 'link' class to the tree link data
        var d3LinkData = visualisation.selectAll("path.link")
                .data(d3TreeLayout.links(treeData), function(d) { return d.target.id; });

        drawLinks(d3LinkData,preOrPost,duration,source);

        // Stash the old positions for transition.
        d3NodeData.forEach(function(d) {
                d.x0 = d.x;
                d.y0 = d.y;
        });
    }

    function prepareTreeData(tree,source,preOrPost) {
         // Compute the new tree layout.
        var nodes = tree.nodes(source).reverse();
        var rootNode = getRoot(nodes[0]);
        // Calculate width required for each level of depth in the graph
        var depthWidths = []; // For each level of depth in the tree, stores the maximum pixel width required
        var searchTermWidth = 0;
        nodes.forEach(function(d) {
            var widthForThisNode = getTextWidth(d.cleanName,d.value);
            if(depthWidths[d.depth]) {
                if (depthWidths[d.depth] < widthForThisNode) {
                    depthWidths[d.depth] = widthForThisNode;
                }
            }
            else {
                depthWidths[d.depth] = widthForThisNode;
            }
            }); 
        
        searchTermWidth = getTextWidth(rootNode.cleanName,my.maxSize()); //How many pixels does the word searched for (in the middle of the tree) take up?
        
        // Set the horizontal position for each node. Set vertical position for root node in the middle of the available space.
            nodes.forEach(function(d) {
                    d.y = getYPosition(d,searchTermWidth,depthWidths,preOrPost);
                    if(d.depth==0) {
                            d.x = my.height()/2;
                    }
            });

        return nodes;
    }

    function defineDragBehaviour(preOrPost) {
        //What happens when you drag depends on what tree you're dragging on, so this sets up the drag behaviour accordingly
        var drag = d3.behavior.drag()
                    .origin(Object);
                    if(preOrPost == "pre") {
                            drag
                                    .on("drag", dragmovePre)
                                    .on("dragend", dragendPre);
                    } else {
                            drag
                                    .on("drag", dragmovePost)
                                    .on("dragend", dragendPost);
                    }
        return drag;
    }
    
    function dragmovePre(d) {
        dragmove(d,"pre");
    }

    function dragmovePost(d) {
        dragmove(d,"post");
    }

    function dragmove(d,preOrPost) {
        userDragging = true;
        var verticalDistance = d.y - d3.event.y;
        var dragLimit = 200;
        var limitedVerticalDistance = Math.max(0,Math.min(-verticalDistance,dragLimit));
        var leafArray = [];	
        leafArray = getLeafArray(d,leafArray,true,preOrPost);

        d3.select("#dragSlider")
            .attr("transform","translate(-2," + limitedVerticalDistance + ")");
            
        var spacePerSibling = dragLimit/leafArray.length;
        //Highlight the immediate children
        var rootNode = getRoot(d);
        var otherTreeData = getTreeData(getOther(preOrPost));
        var otherTreeRoot = getRoot(otherTreeData);
        removeHighlight(rootNode,preOrPost);
        removeHighlight(otherTreeRoot,getOther(preOrPost));
        for (var i = 0; i < leafArray.length ; i++) {
            var thisNode = getNodeFromBothTrees(leafArray[i].id);
            if((limitedVerticalDistance > (i * spacePerSibling)) && (limitedVerticalDistance < (i + 1) * spacePerSibling)) {
                highlightBothTrees(thisNode);
            }
        }
    }
    
    function highlightBothTrees(thisNode) {
        var expressionID = thisNode.matchingTermIndex;
        highlightTree("pre",expressionID);
        highlightTree("post",expressionID);
    }
    
    function highlightTree(preOrPost,expressionID) {
        var treeData = getTreeData(preOrPost);
        recursivelySetHighlight(treeData,preOrPost,expressionID);
    }
    
    function recursivelySetHighlight(node,preOrPost,expressionID) {
        setHighlightIfExpressionIDMatches(node,expressionID,preOrPost);
        for(var i = 0; i < node.children.length; i++) {
            recursivelySetHighlight(node.children[i],preOrPost,expressionID);
        }   
    }
    
    function setHighlightIfExpressionIDMatches(node,expressionID,preOrPost) {
        var nodeTermIndexArray = node.matchingTermIndex.split(",");
        var expressionIDArray = expressionID.split(",");
        for (var i = 0 ; i < nodeTermIndexArray.length ; i++) {
            for (var j = 0 ; j < expressionIDArray.length ; j++) {
                if (nodeTermIndexArray[i] == expressionIDArray[j]) {
                    setHighlight(true,node,preOrPost);
                }
            }
        }
    }

    function testForCommonExpressionIndices(thisNodeTermIndices,matchingTermIndices) {
        //covered by qUnit
        var thisNodeTermIndexArray = thisNodeTermIndices.split(",");
        var matchingNodeTermIndexArray = matchingTermIndices.split(",");
        var matchFound = false;
        
        for(var i = 0; i < thisNodeTermIndexArray.length ; i++) {
            for(var j = 0 ; j < matchingNodeTermIndexArray.length ; j++) {
                if (thisNodeTermIndexArray[i]==matchingNodeTermIndexArray[j]) {
                    matchFound = true;
                    break;
                }
            }
        }
        return matchFound;
    }

    function getNodeById(id,node) {
        if (node.id==id) { 
            return node; 
        }
        else {
            for(var i = 0; i<node.children.length; i++) {
                var possibleResponse = getNodeById(id,node.children[i]);
                if (possibleResponse != false) {
                    return possibleResponse;
                }
            }
        }
        return false;
    }
    
    function getNodeFromBothTrees(id) {
        var preRoot = getRoot(getTreeData("pre"));
        var postRoot = getRoot(getTreeData("post"));
        var nodeFromPreRoot = getNodeById(id,preRoot);
        if(nodeFromPreRoot==false){
            return getNodeById(id,postRoot);
        } else {
            return nodeFromPreRoot;
        }
    }
    

    function getLeafArray(node,leafArray,firstTime,preOrPost) {
        
        if(firstTime) {
            if(node == getRoot(node)){
                //collect leaves from both trees because the user selected the central word
                var otherTreeData = getTreeData(getOther(preOrPost));
                var otherTreeRoot = getRoot(otherTreeData);
                leafArray.concat(getLeafArray(otherTreeRoot,leafArray,false,getOther(preOrPost))); //watch out for potential infinite loop here
            } else {
                //we want the user to be able to select any node on each tree to traverse the whole tree
                node = getRoot(node)
            }
        }
        
        if(node.isLeaf==true) {
            var newItem = {};
            newItem.id = node.id;
            newItem.preOrPost = preOrPost;
            leafArray.push(newItem);
        }
        
        for(var i = 0; i<node.children.length; i++) {
            leafArray.concat(getLeafArray(node.children[i],leafArray,false,preOrPost));
        }

        return leafArray;
    }
    
    
    
    function dragendPre(d) {
        dragend(d,"pre");
    }

    function dragendPost(d) {
        dragend(d,"post");
    }

    function dragend(d,preOrPost) {
            userDragging = false;
            hideDragAffordance();
            var result = {};
            var root = getRoot(d);
            var otherTreeData = getTreeData(getOther(preOrPost));
            var otherTreeRoot = getRoot(otherTreeData);
            result = getHighlightedLeaf(root,otherTreeRoot);		
            removeHighlight(root,preOrPost);
            removeHighlight(otherTreeRoot,getOther(preOrPost));
            var dragEndFunction = my.onDragEnd();
            dragEndFunction(result);
    }

    function getHighlightedLeaf(root,otherTreeRoot) {
        highlightedLeafInFirstTree = getHighlightFromTree(root);
        if(highlightedLeafInFirstTree == false) {
            return getHighlightFromTree(otherTreeRoot);
        }
        else {
            return highlightedLeafInFirstTree;
        }
    }
    
    function getHighlightFromTree(node,preOrPost) {
        var result = false;
        if(node.children.length>0) {
            for(var i = 0; i<node.children.length; i++) {
                if (node.children[i].highlighted) {
                    result = getHighlightFromTree(node.children[i],preOrPost);	
                }
            }
        } else {
            result = node;
        }
        return result;
    }
    
    function getRoot(node) {
        //recursively climbs the tree until it gets to the root node and returns it.
        if(node.depth == 0) {
            return node;
        }
        else {
            return getRoot(node.parent);
        }
    }

    function setHighlight(on,node,preOrPost) {
        node.highlighted = on;
        if(on) {
            d3.select("#" + preOrPost + "-" + node.id).attr("font-weight","bold");
            d3.select("#" + preOrPost + "-link-" + node.id).attr("style","stroke:#ff0000;");
        }
        else 	{
            d3.select("#" + preOrPost + "-" + node.id).attr("font-weight","normal");
            d3.select("#" + preOrPost + "-link-" + node.id).attr("style","stroke:#ccc;");
        }

    }

    function removeHighlight(node,preOrPost) {
        //Looks for the child which is highlighted, 
        //  unhighlights it and then removes highlight from its children
        setHighlight(false,node,preOrPost);
        for (var i = 0 ; i<node.children.length ; i++) {
            if(node.children[i].highlighted == true) {
                removeHighlight(node.children[i],preOrPost);
            }
        }
    }

    function getTreeData(preOrPost) {
        var treeData;
        if(preOrPost == "pre") {
            treeData = my.preTreeData();
        } else {
            treeData = my.postTreeData();
        } 
        return treeData
    }

    function getOther(preOrPost) {
        //covered in qUnit
        if(preOrPost.toLowerCase()=="pre") {
            return "post";
        } else if (preOrPost.toLowerCase()=="post") {
            return "pre";
        } else {
            var err = new Error();
            err.message = 'invalid input';
            throw err;
        }
    }

    function getFontSize(thisSize){
        return (Math.sqrt(( thisSize/my.maxSize() ) * 800 * my.textSizeMultiplier() ))+8;

    }

    function getTextWidth(text,thisSize) {
        var marginForCircle = 25;
        var font = getFontSize(thisSize) + "px Helvetica";	
        //Create a hidden div with the content and measure its width
        var o = $('<div>' + text + '</div>')
                    .css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': font})
                    .appendTo($('body')),
            width = o.width();

        o.remove();

        return width + marginForCircle;
    }

    function getYPosition(d,searchTermWidth,depthWidths,preOrPost) {
        //Calculates horizontal position of this node, given the information about how much space each level in the tree needs
        var yPosition = 0;
            for (var i = d.depth ; i > 0; i--) {
                    yPosition += depthWidths[i];
            }

        if(preOrPost == "pre") {
            return my.width()/2 - yPosition - searchTermWidth;
        }
        else {
            return yPosition;
        }
    }

    function drawNodes(d3NodeData,preOrPost,dragBehaviour,source,duration) {
        addNewNodes(d3NodeData,preOrPost,dragBehaviour,source);
        transitionExistingNodes(d3NodeData);
        removeOldNodes(d3NodeData,duration,source);
    }

    function drawLinks(d3LinkData,preOrPost,duration,source) {

        addNewLinks(d3LinkData,preOrPost,duration,source);
        transitionExistingLinks(d3LinkData,duration);
        removeOldLinks(d3LinkData,source,duration);

    }

    function addNewNodes(nodes,preOrPost,dragBehaviour,source) {
        
        //Add an svg group with the interactive behaviour and the appropriate position
        var onClickBehaviour = my.onClick();
        
        var nodeEnter = nodes.enter().append("svg:g")
                .attr("class", "node")
                .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
                .attr("onmouseover", function(d,i) {return "showDragAffordance(" + d.id + "," + d.x + "," + d.y + ",'" + preOrPost + "')";})
                .attr("onmouseout", function() {return "hideDragAffordance()"; })
                .on("click", onClickBehaviour);
        
        //Add the circle
        nodeEnter.append("svg:circle")
                .attr("r", 1e-6)
                .call(dragBehaviour)
                .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
        
        //Add the text at the appropriate position, size and drag behaviour. id is used to find and highlight the node during drag
        nodeEnter.append("svg:text")
                .attr("x", function(d) { return (preOrPost == "pre") ? 10 : -10; })
                .attr("dy", ".35em")
                .attr("text-anchor", function(d) { return (preOrPost == "pre") ? "start" : "end"; })
                .attr("font-size",function(d) { return getFontSize(d.value,my.maxSize(),my.textSizeMultiplier())})
                .attr("opacity",function(d) { return Math.sqrt(d.value/my.maxSize())>0.25 ? 1 : 0.5 })
                .attr("id", function(d) { return preOrPost == "pre" ? preOrPost + "-" + d.id : (d.depth == 0 ? "rootnode" : "post-" + d.id); })
                .text(function(d) { return preOrPost == "pre" ? (d.depth == 0 ? "" : d.cleanName.replace(/_/g,' ')) : d.cleanName.replace(/_/g,' ') ; })
                .call(dragBehaviour)
                .style("fill-opacity", 1e-6)
            .append("svg:title")
                .text(function(d) { if(d.value>1) {return d.value + ' expressions use this word';} else {return '1 expression uses this word';}});
    }

    function transitionExistingNodes(nodes,duration) {

        // Transition nodes to their new position.
        var nodeUpdate = nodes.transition()
                .duration(duration)
                .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

        nodeUpdate.select("circle")
                .attr("r", 4.5)
                .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
                .style("stroke", function(d) { return d.cleanName == "" ? "#fff" : "steelblue"; });

        nodeUpdate.select("text")
                .attr("font-size",function(d) { return (((Math.sqrt(d.value/ my.maxSize() *800)))* my.textSizeMultiplier() )+8;})
            .style("fill-opacity", 1);
    }
    
    function doSearch(searchTerm) {
	search(searchTerm,function(error,errorText,postTree,preTree,data) { 
		if(error)
			{
				$("#errorDiv").html(errorText).show().fadeOut(2000);	
			}
		else
			
			postTreeData = postTree;
			preTreeData = preTree;		
			rawData = data;
			redraw(preTreeData,postTreeData);

	});
}

    function removeOldNodes(nodes,duration,source) {
        
        // Transition exiting nodes to the parent's new position.
        var nodeExit = nodes.exit().transition()
                .duration(duration)
                .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
                .remove();

        // transition the circle to 0 radius
        nodeExit.select("circle")
                .attr("r", 1e-6);

        // fade out the text
        nodeExit.select("text")
                .style("fill-opacity", 1e-6);
    }

    function addNewLinks(d3LinkData,preOrPost,duration,source) {

        // Enter any new links at the parent's previous position.
        d3LinkData.enter().insert("svg:path", "g")
                .attr("class", "link")
                .attr("opacity", function(d) { return d.target.cleanName == "" ? 0 : 0.2; })
                .attr("id",function(d) { return preOrPost + "-link-" + d.target.id; })
                .attr("d", function(d) {
                    var o = {x: source.x0, y: source.y0};
                    return diagonal({source: o, target: o});
                })
                .attr("stroke-width",function(d) { return (Math.sqrt(d.target.value/my.maxSize()*1000)); })
                .transition()
                    .duration(duration)
                    .attr("d", diagonal);
    }

    function transitionExistingLinks(d3LinkData,duration) {
        
        // Transition links to their new position.
        d3LinkData.transition()
                .duration(duration)
                .attr("d", diagonal);
    }

    function removeOldLinks(d3LinkData,source,duration) {

        // Transition exiting nodes to the parent's new position.
        d3LinkData.exit().transition()
                .duration(duration)
                .attr("d", function(d) {
                    var o = {x: source.x, y: source.y};
                    return diagonal({source: o, target: o});
                })
                .remove();
    }
    
    
}

function DataTree(originalPhrase,phrase,value,matchingTermIndex) {
    //covered by qUnit
    this.name;
    this.cleanName;
    this.value = value;
    this.matchingTermIndex = matchingTermIndex.toString();
    this.children = [];
    this.isLeaf = false;
    
    this.name = originalPhrase;
    this.cleanName = phrase[0];
    phrase.shift();

    if (phrase.length != 0) {
        this.children.push(new DataTree(originalPhrase,phrase,value,matchingTermIndex));
    } else {
        this.isLeaf = true;
    }
}

DataTree.prototype.getChildIndex = function(Name) {
    //covered by qUnit
    result = -1;
    for(var i=0;i<this.children.length;i++)
    {
        if (this.children[i].cleanName == Name || this.children[i].cleanName + 's' == Name || this.children[i].cleanName == Name + 's') {result = i; break; }
    }
    return result;
};

function hideDragAffordance() {
        if(!userDragging) {
            d3.select("#dragAffordance").remove();
        }
    }

function showDragAffordance(id, x, y, preOrPost) {
        //partially covered by qUnit
        if(!userDragging) {
            
            var dragAffordanceGroup;		
            var thisX, thisY;
             
            dragAffordanceGroup = d3.select("#svg").append("svg:g");

            $("#svg").mousemove(function(e) {
                thisX = e.pageX - this.offsetLeft;
                thisY = e.pageY - this.offsetTop;
                if(!userDragging) {
                    dragAffordanceGroup
                        .attr("id","dragAffordance")
                        .attr("transform","translate("+ (thisX-15) +","+ (thisY-10) + ")")
                }
            });

            $("#"+preOrPost+"-"+id).attr("style","cursor:move;");

                    var sliderTrack = dragAffordanceGroup.append("svg:rect")
                            .attr("id","sliderTrack")
                            .attr("width",6)
                            .attr("rx",3)
                            .attr("ry",3)
                            .attr("fill","#ccc")
                            .attr("stroke","#aaa")
                            .attr("height",200)
                            .attr("opacity",0.1)
                .transition()
                    .delay(200)
                    .duration(500)
                    .attr("opacity",0.5);


            var slider = dragAffordanceGroup.append("svg:rect")
                .attr("transform","translate(-2,0)")
                .attr("id","dragSlider")
                .attr("width",10)
                .attr("height",10)
                .attr("rx",3)
                .attr("ry",3)
                .attr("fill","#dadada")
                .attr("stroke","#999")
                .attr("opacity",0.1).transition()
                    .delay(200)
                    .duration(500)
                    .attr("opacity",1);	
        }
    }


    
var userDragging = false;

var nodeIDCounter = 0;

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });
        