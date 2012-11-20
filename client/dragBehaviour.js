var userDragging = false;

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
	if(node.children.length>0) {
		for(var i = 0; i<node.children.length; i++) {
			if (node.children[i].highlighted) {
				result = getHighlightedWords(node.children[i]);	
			}
		}
	}
    result = node.name;
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
		treeData = preTreeData;
	} else {
		treeData = postTreeData;
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
