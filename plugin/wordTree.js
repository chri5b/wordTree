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
        
        var dimensions = calculateDimensions(my.height(),my.width(),my.maxSize(),my.textSizeMultiplier(),my.margins());           
        d3TreeLayout.size([dimensions.h, dimensions.w/2]);
	
        d3.select("#svg")
            .attr("width", dimensions.w - (dimensions.m[1] + dimensions.m[3])+'px')
            .attr("height", (dimensions.h - (dimensions.m[0] + dimensions.m[2])) + 'px');
        
        d3.select("#vis")
            .attr("transform", "translate(" + (((dimensions.w)/2) + 200) + "," + dimensions.m[0] + ")");	
        
        d3.select("#previs")
            .attr("transform", "translate(200," + dimensions.m[0] + ")");
            
        var relevantData = extractRelevantData(d,my.nameAccessor(),my.valueAccessor(),my.maxResults());

        createTree(relevantData,searchTerm,function(error,errorText,postTreeData,preTreeData,d) {
            my.preTreeData(preTreeData);
            my.postTreeData(postTreeData);
            
            var previs = d3.select("#previs");
            var vis = d3.select("#vis");
            previs.empty();
            vis.empty();
        
            update(preTreeData,"pre",d3.select("#previs"),d3TreeLayout,dimensions,onClick); 
            update(postTreeData,"post",d3.select("#vis"),d3TreeLayout,dimensions,onClick);        
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
    
    function extractRelevantData(inputData,nameAccessFunction,valueAccessFunction,maxResults) {
        var extractedData = [];
        var iteratorLimit = Math.min(inputData.length,maxResults);
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

    function update(source,preOrPost,visualisation,d3TreeLayout,dimensions,onClick) {

        // Set vertical alignment of tree in the middle of the screen
        source.x0 = dimensions.h / 2;
        source.y0 = 0;
      
        // Set duration for transitions
        var duration = 500;

        var treeData = prepareTreeData(d3TreeLayout,source,preOrPost,dimensions); 
        
        // use d3 to bind all the svg g elements which have the 'node' class to the tree data
        var d3NodeData = visualisation.selectAll("g.node")
                .data(treeData, function(d) { return d.id || (d.id = ++nodeIDCounter); });

        var dragBehaviour = defineDragBehaviour(preOrPost);

        drawNodes(d3NodeData,preOrPost,dragBehaviour,dimensions.maxSize,dimensions.textSizeMultiplier,source,duration,onClick);

        // Use d3 to bind all the svg path elements which have the 'link' class to the tree link data
        var d3LinkData = visualisation.selectAll("path.link")
                .data(d3TreeLayout.links(treeData), function(d) { return d.target.id; });

        drawLinks(d3LinkData,preOrPost,dimensions.maxSize,duration,source);

        // Stash the old positions for transition.
        d3NodeData.forEach(function(d) {
                d.x0 = d.x;
                d.y0 = d.y;
        });
    }

    function calculateDimensions(height,width,maxSize,textSizeMultiplier,margins) {
        var dimensions = {
                m:margins
                ,w:width
                ,h:height
                ,textSizeMultiplier:textSizeMultiplier
                ,maxSize:maxSize 
            };

        return dimensions;
    }

    function prepareTreeData(tree,source,preOrPost,dimensions) {
         // Compute the new tree layout.
        var nodes = tree.nodes(source).reverse();
        var rootNode = getRoot(nodes[0]);
        dimensions.maxSize = rootNode.value;
        // Calculate width required for each level of depth in the graph
        var depthWidths = []; // For each level of depth in the tree, stores the maximum pixel width required
        var searchTermWidth = 0;
        nodes.forEach(function(d) {
            var widthForThisNode = getTextWidth(d.cleanName,dimensions.textSizeMultiplier,dimensions.maxSize,d.value);
            if(depthWidths[d.depth]) {
                if (depthWidths[d.depth] < widthForThisNode) {
                    depthWidths[d.depth] = widthForThisNode;
                }
            }
            else {
                depthWidths[d.depth] = widthForThisNode;
            }
            }); 
        
        searchTermWidth = getTextWidth(rootNode.cleanName,dimensions.textSizeMultiplier,1,1); //How many pixels does the word searched for (in the middle of the tree) take up?
        
        // Set the horizontal position for each node. Set vertical position for root node in the middle of the available space.
            nodes.forEach(function(d) {
                    d.y = getYPosition(d,searchTermWidth,dimensions.w,depthWidths,preOrPost);
                    if(d.depth==0) {
                            d.x = dimensions.h/2;
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
        leafArray = getLeafArray(d,leafArray);


        d3.select("#dragSlider")
            .attr("transform","translate(-2," + limitedVerticalDistance + ")");
            

        var spacePerSibling = dragLimit/leafArray.length;
        //Highlight the immediate children
        removeHighlight(getRoot(d),preOrPost);
        for (var i = 0; i < leafArray.length ; i++) {
            var thisNode = getNodeById(leafArray[i],d);
            if((limitedVerticalDistance > (i * spacePerSibling)) && (limitedVerticalDistance < (i + 1) * spacePerSibling)) {
                setHighlight(true,thisNode,preOrPost);
                highlightAncestors(thisNode,preOrPost);
                highlightOtherTree(thisNode,preOrPost);		
            }
            else {
                setHighlight(false,thisNode,preOrPost);
            }
        }
    }
    

    function highlightOtherTree(thisNode,preOrPost) {
        //For an expression like "divorce par consentement mutuel", when we highlight "mutuel" in one tree, we want "divorce par" to highlight in the other tree. 
        var matchingExpressionIndex = thisNode.matchingTermIndex;
        var otherTreeData = getTreeData(getOther(preOrPost));
        var otherTreeRoot = getRoot(otherTreeData);
        var leafNodes = [];
        leafNodes = getLeafArray(otherTreeRoot,leafNodes);
        var otherTreePreOrPost = preOrPost=="pre"?"post":"pre";
        removeHighlight(otherTreeRoot,otherTreePreOrPost);
        for (var i = 0 ; i < leafNodes.length ; i++) {
            var thisNode = getNodeById(leafNodes[i],otherTreeRoot);
            thisNode.highlighted = true;
            if(testForCommonExpressionIndices(thisNode.matchingTermIndex,matchingExpressionIndex)) {
                setHighlight(true,thisNode,otherTreePreOrPost);
                highlightAncestors(getNodeById(leafNodes[i],otherTreeRoot),otherTreePreOrPost);
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
        if(node.children.length==0) {
            if (node.id==id) { 
                return node; 
            }
            else {
                return false;
            }
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

    function getLeafArray(node,leafArray) {
        if(node.children.length==0) {
            leafArray.push(node.id);
        }
        else { 
            for(var i = 0; i<node.children.length; i++) {
                leafArray.concat(getLeafArray(node.children[i],leafArray));
            }
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
            var result = "";
            var root = getRoot(d);
            var otherTreeData = getTreeData(getOther(preOrPost));
            var otherTreeRoot = getRoot(otherTreeData);
            result += getHighlightedWords(root,preOrPost);		
            removeHighlight(root,preOrPost);
            removeHighlight(otherTreeRoot,getOther(preOrPost));
            console.log("search for '" + result);
    }

    function getHighlightedWords(node,preOrPost) {
        var result = "";
        result = node.name; 
        if(node.children.length>0) {
            for(var i = 0; i<node.children.length; i++) {
                if (node.children[i].highlighted) {
                    result = getHighlightedWords(node.children[i]);	
                }
            }
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

    function highlightAncestors(node,preOrPost) {
        //recursively sets highlight to true from a leaf all the way up to the root node.
        if(node.parent) {
            setHighlight(true,node.parent,preOrPost);
            highlightAncestors(node.parent,preOrPost);
        }
    }

    function removeHighlight(node,preOrPost) {
        //assumes that there is only one path in the hierarchy which is highlighted. Looks for the child which is highlighted, 
        /// unhighlights it and then removes highlight from its children
        for (var i = 0 ; i<node.children.length ; i ++) {
            if(node.children[i].highlighted == true) {
                setHighlight(false,node.children[i],preOrPost);
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

    function getFontSize(thisSize,maxSize,textSizeMultiplier){
        return (Math.sqrt((thisSize/maxSize)*800*textSizeMultiplier))+8;

    }

    function getTextWidth(text,textSizeMultiplier,maxSize,thisSize) {
        var marginForCircle = 25;
        var font = getFontSize(thisSize,maxSize,textSizeMultiplier) + "px Helvetica";	
        //Create a hidden div with the content and measure its width
        var o = $('<div>' + text + '</div>')
                    .css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': font})
                    .appendTo($('body')),
            width = o.width();

        o.remove();

        return width + marginForCircle;
    }

    function getYPosition(d,searchTermWidth,w,depthWidths,preOrPost) {
        //Calculates horizontal position of this node, given the information about how much space each level in the tree needs
        var yPosition = 0;
            for (var i = d.depth ; i > 0; i--) {
                    yPosition += depthWidths[i];
            }

        if(preOrPost == "pre") {
            return w/2 - yPosition - searchTermWidth;
        }
        else {
            return yPosition;
        }
    }

    function drawNodes(d3NodeData,preOrPost,dragBehaviour,maxSize,textSizeMultiplier,source,duration,onClick) {
        addNewNodes(d3NodeData,preOrPost,dragBehaviour,maxSize,textSizeMultiplier,source,onClick);
        transitionExistingNodes(d3NodeData,maxSize,textSizeMultiplier);
        removeOldNodes(d3NodeData,duration,source);
    }

    function drawLinks(d3LinkData,preOrPost,maxSize,duration,source) {

        addNewLinks(d3LinkData,preOrPost,maxSize,duration,source);
        transitionExistingLinks(d3LinkData,duration);
        removeOldLinks(d3LinkData,source,duration);

    }

    function addNewNodes(nodes,preOrPost,dragBehaviour,maxSize,textSizeMultiplier,source,onClick) {
        
        //Add an svg group with the interactive behaviour and the appropriate position
        var nodeEnter = nodes.enter().append("svg:g")
                .attr("class", "node")
                .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
                .attr("onmouseover", function(d,i) {return "showDragAffordance(" + d.id + "," + d.x + "," + d.y + ",'" + preOrPost + "')";})
                .attr("onmouseout", function() {return "hideDragAffordance()"; })
                .on("click", onClick);
        
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
                .attr("font-size",function(d) { return getFontSize(d.value,maxSize,textSizeMultiplier)})
                .attr("opacity",function(d) { return Math.sqrt(d.value/maxSize)>0.25 ? 1 : 0.5 })
                .attr("id", function(d) { return preOrPost == "pre" ? preOrPost + "-" + d.id : (d.depth == 0 ? "rootnode" : "post-" + d.id); })
                .text(function(d) { return preOrPost == "pre" ? (d.depth == 0 ? "" : d.cleanName.replace(/_/g,' ')) : d.cleanName.replace(/_/g,' ') ; })
                .call(dragBehaviour)
                .style("fill-opacity", 1e-6)
            .append("svg:title")
                .text(function(d) { if(d.value>1) {return d.value + ' expressions use this word';} else {return '1 expression uses this word';}});
    }

    function transitionExistingNodes(nodes,maxSize,textSizeMultiplier,duration) {

        // Transition nodes to their new position.
        var nodeUpdate = nodes.transition()
                .duration(duration)
                .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

        nodeUpdate.select("circle")
                .attr("r", 4.5)
                .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
                .style("stroke", function(d) { return d.cleanName == "" ? "#fff" : "steelblue"; });

        nodeUpdate.select("text")
                .attr("font-size",function(d) { return (((Math.sqrt(d.value/maxSize*800)))*textSizeMultiplier)+8;})
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

    function addNewLinks(d3LinkData,preOrPost,maxSize,duration,source) {

        // Enter any new links at the parent's previous position.
        d3LinkData.enter().insert("svg:path", "g")
                .attr("class", "link")
                .attr("opacity", function(d) { return d.target.cleanName == "" ? 0 : 0.2; })
                .attr("id",function(d) { return preOrPost + "-link-" + d.target.id; })
            .attr("d", function(d) {
                    var o = {x: source.x0, y: source.y0};
                    return diagonal({source: o, target: o});
                })
                .attr("stroke-width",function(d) { return (Math.sqrt(d.target.value/maxSize*1000)); })
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
    
    this.name = originalPhrase;
    this.cleanName = phrase[0];
    phrase.shift();

    if (phrase.length != 0) {
        this.children.push(new DataTree(originalPhrase,phrase,value,matchingTermIndex));
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
        