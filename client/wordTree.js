function wordTree(testMode) {
    var margins = [20,20,20,20],
        width = $(window).width() - margins[1] - margins[3],
        height = $(window).height() - margins[0] - margins[2],
        textSizeMultiplier = width/2000,
        maxSize =0,
        preTreeData = [],
        postTreeData = [],
        matchingTerms = [],
        nameAccessor = function(d) { return d.name; },
        valueAccessor = function(d) { return d.value; },
        onClick = function() {},
        maxResults = 40,
        maxDepth = 20,
        mouseoverText = function(d) { return d.cleanName; },
        useButtonNav = false,
        onButtonClick = function() {},
        buttonText = function() { return ["Go"]; };


    function my(selection) {
        selection.each(function(d) {

            var targetElementId = this.id;
            var targetElement = d3.select("#"+targetElementId);

            var preTreeData = my.preTreeData();
            var postTreeData = my.postTreeData();

            if($("#"+ targetElementId + "svg").length == 0){
                var svgElement = targetElement.append("svg:svg").attr("id",targetElementId + "svg");
				
                svgElement.append("svg:g").attr("id", targetElementId + "vis");
                svgElement.append("svg:g").attr("id", targetElementId + "previs");

            }

            var d3TreeLayout = d3.layout.tree();

            d3TreeLayout.size([my.height(), (my.width()/2) - my.margins()[1]]);

            d3.select("#"+ targetElementId + "svg")
                .attr("width", my.width() - (my.margins()[1] + my.margins()[3])+'px')
                .attr("height", (my.height() - (my.margins()[0] + my.margins()[2])) + 'px');
				
            d3.select("#"+ targetElementId + "previs")
                .attr("transform", "translate("+my.margins()[1]+"," + my.margins()[0] + ")");
				
            d3.select("#"+ targetElementId + "vis")
                .attr("transform", "translate(" + (((my.width())/2) + my.margins()[1]) + "," + my.margins()[0] + ")");



            if(preTreeData && postTreeData) {
                my.maxSize(Math.max(preTreeData.value,postTreeData.value));
            } else if (preTreeData && !postTreeData) {
                my.maxSize(preTreeData.value);
                //If there is no postTree data we still need the term to be displayed

            } else {
                my.maxSize(postTreeData.value);
                $("#"+ targetElementId + "previs").empty();
            }


            var previs = d3.select("#"+ targetElementId + "previs");
            var vis = d3.select("#"+ targetElementId + "vis");
            previs.empty();
            vis.empty();
            d3TreeLayout.size([my.height() - (my.margins()[0] + my.margins()[2]), my.width() - ((my.margins()[1] + my.margins()[3])/2)]);
            if (preTreeData) {
                update(preTreeData,"pre",d3.select("#"+ targetElementId + "previs"),d3TreeLayout);
            }
            if (!postTreeData) {
                postTreeData = {
                    cleanName:searchTerm,
                    depth:0,
                    value:my.maxSize()
                }
            }
            update(postTreeData,"post",d3.select("#"+ targetElementId + "vis"),d3TreeLayout);
        });
    }

    my.mouseoverText = function(value) {
        if (!arguments.length) return mouseoverText;
        mouseoverText = value;
        return my;
    };

    my.maxSize = function(value) {
        if (!arguments.length) return maxSize;
        maxSize = value;
        return my;
    };

    my.onButtonClick = function(value) {
        if (!arguments.length) return onButtonClick;
        onButtonClick = value;
        return my;
    };

    my.useButtonNav = function(value) {
        if (!arguments.length) return useButtonNav;
        useButtonNav = value;
        return my;
    };

    my.buttonText = function(value) {
        if (!arguments.length) return buttonText;
        buttonText = value;
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
    };

    my.margins = function(value) {
        if (!arguments.length) return margins;
        margins = value;
        return my;
    };

    my.preTreeData = function(value) {
        if (!arguments.length) return preTreeData;
        preTreeData = value;
        return my;
    };

    my.postTreeData = function(value) {
        if (!arguments.length) return postTreeData;
        postTreeData = value;
        return my;
    };

    my.matchingTerms = function(value) {
        if (!arguments.length) return matchingTerms;
        matchingTerms = value;
        return my;
    };

    my.nameAccessor = function(value) {
        if (!arguments.length) return nameAccessor;
        nameAccessor = value;
        return my;
    };

    my.valueAccessor = function(value) {
        if (!arguments.length) return valueAccessor;
        valueAccessor = value;
        return my;
    };

    my.onClick = function(value) {
        if (!arguments.length) return onClick;
        onClick = value;
        return my;
    };

    my.searchTerm = function(value) {
        if (!arguments.length) return searchTerm;
        searchTerm = value;
        return my;
    };

    my.maxResults = function (value) {
        if (!arguments.length) return maxResults;
        maxResults = value;
        return my;
    };

    my.maxDepth = function(value) {
        if (!arguments.length) return maxDepth;
        maxDepth = value;
        return my
    };


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

    function update(source,preOrPost,visualisation,d3TreeLayout) {

        // Set vertical alignment of tree in the middle of the screen
        source.x0 = my.height() / 2;
        source.y0 = 0;

        // Set duration for transitions
        var duration = 500;

        // Compute the new tree layout.
        var nodes = d3TreeLayout.nodes(source).reverse();
        var rootNode = getRoot(nodes[0]);
        rootNode.value = my.maxSize(); //If the preTree has more data than the postTree, make sure the middle word is big enough.
        searchTermWidth = getTextWidth(rootNode.cleanName,rootNode.value); //How many pixels does the word searched for (in the middle of the tree) take up?


        var treeData = prepareTreeData(nodes,source,preOrPost,searchTermWidth);

        // use d3 to bind all the svg g elements which have the 'node' class to the tree data
        var d3NodeData = visualisation.selectAll("g.node,g.buttonnode")
            .data(treeData, function(d) { return d.id || (d.id = ++nodeIDCounter); });

        drawRootLink(searchTermWidth,my.height()/2);

        drawNodes(d3NodeData,preOrPost,source,duration);

        // Use d3 to bind all the svg path elements which have the 'link' class to the tree link data
        var d3LinkData = visualisation.selectAll("path.link,path.buttonlink")
            .data(d3TreeLayout.links(treeData), function(d) { return d.target.id; });

        drawLinks(d3LinkData,preOrPost,duration,source);

        // Stash the old positions for transition.
        d3NodeData.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    function prepareTreeData(nodes,source,preOrPost,searchTermWidth) {

        // Calculate width required for each level of depth in the graph
        var depthWidths = []; // For each level of depth in the tree, stores the maximum pixel width required
        nodes.forEach(function(d) {
            var widthForThisNode = getTextWidth(getNodeText(d,preOrPost),d.value);
            if(depthWidths[d.depth]) {
                if (depthWidths[d.depth] < widthForThisNode) {
                    depthWidths[d.depth] = widthForThisNode;
                }
            }
            else {
                depthWidths[d.depth] = widthForThisNode;
            }
        });
		
		var availableSpaceRatio = getAvailableSpaceRatio(depthWidths,getSpaceForTree(searchTermWidth));

        while(availableSpaceRatio > 1.1 || availableSpaceRatio < 0.9) {
            spaceForTree = getSpaceForTree(searchTermWidth);
			
            depthWidths = adjustDepthsForAvailableSpace(depthWidths, spaceForTree, availableSpaceRatio);
			if(availableSpaceRatio > 1.1) {
				searchTermWidth = searchTermWidth/availableSpaceRatio;
			}
			//recalculate availableSpaceRatio before looping back to the while statement
			availableSpaceRatio = getAvailableSpaceRatio(depthWidths, getSpaceForTree(searchTermWidth));
        }

        // Set the horizontal position for each node. Set vertical position for root node in the middle of the available space.
        nodes.forEach(function(d) {
            //If the node is deeper in the tree than maxDepth then delete it.
            d.y = getYPosition(d,searchTermWidth,depthWidths,preOrPost);
            if(d.depth > my.maxDepth()) {
                d.visible = false;
            } else {
                d.visible = true;
                if(d.depth==0) {
                    d.x = my.height()/2;
                }
            }
        });

        nodes = nodes.filter(function(d) {
            return (d.visible == true || d.isButton == true);
        });

        return nodes;
    }

    function getAvailableSpaceRatio(depthWidths, spaceForTree) {
        //What is the proportion of apace available to space needed? under 1 means we have more space than we need
        //Over 1 means we don't have enough space
        var maxDepth = my.maxDepth();
        var requiredSpace = 0;
        for (var i = 0; i < Math.min(maxDepth,depthWidths.length); i++) {
            requiredSpace += depthWidths[i];
        }
        var availableSpaceUsed = requiredSpace/spaceForTree;
        return availableSpaceUsed;
    }

    function adjustDepthsForAvailableSpace(depthWidths, spaceForTree, availableSpaceUsed) {
        //We need to try to fit the available content in the space available
        //Given the maxDepth we need to plot, does it fit nicely in the available space?

		// If we need to squeese things up or space them out, then do it
		for (var i = 0 ; i < Math.min(maxDepth,depthWidths.length); i++) {
			// reduce the available space
			depthWidths[i] = depthWidths[i]/availableSpaceUsed;
		}
		if (availableSpaceUsed > 1) { 
		// reduce the textSizeMultiplier so we actually need less space, if we're reducing space
			my.textSizeMultiplier(my.textSizeMultiplier()/availableSpaceUsed);
			
		}

        return depthWidths;
    }

    function highlightBothTrees(thisNode) {
        var expressionID = thisNode.matchingTermIndex;
        highlightTree("pre",expressionID);
        highlightTree("post",expressionID);
    }

    function highlightTree(preOrPost,expressionID) {
        var treeData = getTreeData(preOrPost);
        if(treeData) {
            recursivelySetHighlight(treeData,preOrPost,expressionID);
        }
    }

    function recursivelySetHighlight(node,preOrPost,expressionID) {
        setHighlightIfExpressionIDMatches(node,expressionID,preOrPost);
        for(var i = 0; i < node.children.length; i++) {
            recursivelySetHighlight(node.children[i],preOrPost,expressionID);
        }
    }

    function setHighlightIfExpressionIDMatches(node,expressionID,preOrPost) {
        if (node.isButton == false) {
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
        var result = false;
        if (preRoot) {
            result = getNodeById(id,preRoot);
        }
        if (result==false && postRoot){
            result = getNodeById(id,postRoot);
        }
        return result;
    }

    function getLeafArray(node,leafArray,firstTime,preOrPost) {

        if(firstTime) {
            if(node == getRoot(node)){
                //collect leaves from both trees because the user selected the central word
                var otherTreeData = getTreeData(getOther(preOrPost));
                if(otherTreeData) {
                    var otherTreeRoot = getRoot(otherTreeData);
                    leafArray.concat(getLeafArray(otherTreeRoot,leafArray,false,getOther(preOrPost))); //watch out for potential infinite loop here
                }
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
        if(node) {
            if(node.children.length>0) {
                for(var i = 0; i<node.children.length; i++) {
                    if (node.children[i].highlighted) {
                        result = getHighlightFromTree(node.children[i],preOrPost);
                    }
                }
            } else {
                result = node;
                result.name = result.name.replace(/_/g,' ');
            }
        }
        return result;
    }

    function getRoot(node) {
        //recursively climbs the tree until it gets to the root node and returns it.
        if(node) {
            if(node.depth == 0) {
                return node;
            }
            else {
                return getRoot(node.parent);
            }
        }
        return false;
    }

    function setHighlight(on,node,preOrPost) {
        node.highlighted = on;

        if(on) {
            $("#" + preOrPost + "-" + node.id).attr("class","link highlight");
            $("#" + preOrPost + "-link-" + node.id).attr("class","link highlight");
            if(node.depth == 0) {
                $("#rootnode").attr("class","link highlight");
                $("#rootlink").attr("class","link highlight");
            }
        }
        else 	{
            $("#" + preOrPost + "-" + node.id).attr("class","link");
            $("#" + preOrPost + "-link-" + node.id).attr("class","link");
            if(node.depth == 0) {
                $("#rootnode").attr("class","link");
                $("#rootlink").attr("class","link");
            }
        }

    }

    function removeHighlight(node,preOrPost) {
        //Looks for the child which is highlighted, 
        //  unhighlights it and then removes highlight from its children
        if(node) {
            setHighlight(false,node,preOrPost);
            for (var i = 0 ; i<node.children.length ; i++) {
                if(node.children[i].highlighted == true) {
                    removeHighlight(node.children[i],preOrPost);
                }
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
        if(thisSize == my.maxSize()) {
            return (Math.sqrt(( thisSize/my.maxSize() ) * 800 * my.textSizeMultiplier() ))+14;
        } else {
            return (Math.pow(thisSize * 3 * my.textSizeMultiplier() ,0.7)) + 14;
        }
    }

    function getTextWidth(text,thisSize) {

        //create a dummy element to pick up the CSS attributes from it. 
        //could refactor this out of this function to avoid doing all this work for all the nodes.
        //or first search for existing text elements and fall back to creating one if its missing.
        var element = $('<text>i</text>').css({'visibility':'hidden'}).appendTo($('#previs'));
        var marginForCircle = 20;
        var fontStyle = element.css('font-style');
        var fontVariant = element.css('font-variant');
        var fontWeight = element.css('font-weight');
        var fontFamily = element.css('font-family');
        element.remove();

        //build the font attribute with the correct attributes
        var font = fontStyle + " " + fontVariant + " " + fontWeight + " " + getFontSize(thisSize) + "px " + fontFamily;

        //Create a hidden div with the content and measure its width
        var o = $('<text>' + text + '</text>')
                .css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': font})
                .appendTo($('body')),
            width = o.width();

        o.remove();

        return width + marginForCircle;
    }

    function getYPosition(d,searchTermWidth,depthWidths,preOrPost) {
        //Calculates horizontal position of this node, given the information about how much space each level in the tree needs

        // ----------------------------------------- width -----------------------------------------------------------------//
        // -- margin -- //----------------------- availableSpace ---------------------------------------------//---margin---//
        //------- spaceForPreTree ---------//- searchTermWidth -//-- spaceForPostTree --------//
        //-- depth[2] --//--- depth [1] ---//- searchTermWidth -//-- depth[1] --//- depth[2] -//
        //-------preVisWidth --------------//------------postVisWidth-------------------------//

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

    function getSpaceForTree (searchTermWidth) {
        var margins = my.margins();
        var availableSpace = my.width() - (margins[1] + margins[3]);
        var spaceForTree = (availableSpace - searchTermWidth)/2;
        return spaceForTree;
    }

    function drawNodes(d3NodeData,preOrPost,source,duration) {
        addNewNodes(d3NodeData,preOrPost,source);
        transitionExistingNodes(d3NodeData);
        removeOldNodes(d3NodeData,duration,source);
    }

    function drawRootLink(searchTermWidth,height) {
        if($("#rootlink").length==0) {
            d3.select("#vis")
                .append("svg:line")
                .attr("x1", -searchTermWidth)
                .attr("x2", 0)
                .attr("y1", height)
                .attr("y2", height)
                .attr("id","rootlink")
                .attr("stroke-width", 30)
                .attr("class","link");
        } else {
            $("#rootlink")
                .attr("x1", -searchTermWidth)
                .attr("x2", 0)
                .attr("y1", height)
                .attr("y2", height);
        }
    }

    function drawLinks(d3LinkData,preOrPost,duration,source) {

        addNewLinks(d3LinkData,preOrPost,duration,source);
        transitionExistingLinks(d3LinkData,duration);
        removeOldLinks(d3LinkData,source,duration);

    }

    function addNewNodes(nodes,preOrPost,source) {

        //Add an svg group with the interactive behaviour and the appropriate position
        var onClickBehaviour = my.onClick();
        var onButtonClickBehaviour = my.onButtonClick();

        var mouseoverText = my.mouseoverText();

        var nodeEnter = nodes.enter().append("svg:g")
            .attr("class", function(d) { return d.isButton ? "buttonnode" : "node";})
            .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
            .on("mouseover", showLinkButton)
            .on("mouseout", hideLinkButton)
            .on("click", onClickBehaviour);

        //Add the circle
        nodeEnter.append("svg:circle")
            .attr("r", 1e-6)
            .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
            .style("opacity", function(d) { return d.isButton ? 0 : 1; }); //hide the circle for buttons

        //Add the text at the appropriate position, size.
        nodeEnter.append("svg:rect")
            .attr("height",function(d) { return getFontSize(d.value) + 4 })
            .attr("width",function(d) {return getTextWidth(getNodeText(d,preOrPost),d.value) * 0.9})
            .attr("x", function(d) { return (preOrPost == "pre") ? 0 : -getTextWidth(getNodeText(d,preOrPost),d.value) * 0.9; })

            .attr("y", function(d) { return getFontSize(d.value) / -2 })
            .attr("ry","3px")
            .attr("rx","3px")
            .attr("opacity",function(d) { return d.isButton ? 0.15 : 0 })
            .attr("id", function(d) { return preOrPost + "-" + d.id + "rect" ; })
            .attr("class", function(d)  { return d.isButton ? "buttonnode" : "node";});

        nodeEnter.append("svg:text")
            .attr("x", function(d) { return (preOrPost == "pre") ? 10 : -10; })
            .attr("dy", ".35em")
            .attr("text-anchor", function(d) { return (preOrPost == "pre") ? "start" : "end"; })
            .attr("font-size",function(d) { return getFontSize(d.value)})
            .attr("opacity",function(d) { return d.isButton ? 0.15 : Math.sqrt(d.value/my.maxSize())>0.25 ? 1 : 0.5 })
            .attr("id", function(d) { return preOrPost == "pre" ? preOrPost + "-" + d.id : (d.depth == 0 ? "rootnode" : "post-" + d.id); })
            .text(function(d) { return getNodeText(d,preOrPost);})
            .style("fill-opacity", 1e-6)
            .append("svg:title")
            .text(mouseoverText);
    }

    function getNodeText(d,preOrPost) {
        var result = "";
        var name = "";
        if (d.pluralAndSingular) { //If we have plural and singular forms on the same branch (i.e. ball and balls) then we should show ball(s)
            name = d.ambiguousName;
        } else {
            name = d.cleanName;
        }
        name = name.replace(/_/g,' '); //substitute any underscores with spaces (for multi-word search terms)
        if (d.depth == 0 && preOrPost == "pre") { //don't show the search term on the preTree, because its already present on the postTree
            result = "";
        } else {
            result = name;
        }
        return result;
    }

    function transitionExistingNodes(nodes,duration) {

        // Transition nodes to their new position.
        var nodeUpdate = nodes.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

        //Add the circle   
        nodeUpdate.select("circle")
            .attr("r", function(d) { if(my.textSizeMultiplier() > 0.5) { return 4.5; } else {return 0;}} )
            .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
            .style("stroke", function(d) { return d.cleanName == "" ? "#fff" : "steelblue"; });

        nodeUpdate.select("text")
            .attr("font-size",function(d) { return getFontSize(d.value); })
            .style("fill-opacity", 1);
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

        d3LinkData.enter().insert("svg:path", "g")
            .attr("class", function(d) { return d.target.isButton ? "buttonlink" : "link";})
            .attr("opacity", function(d) { return d.target.isButton ? 0 : 0.2;})
            .attr("id",function(d) { return d.depth == 0 ? "rootlink" : preOrPost + "-link-" + d.target.id; })
            .attr("d", function(d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            })
            .attr("stroke-width",function(d) { return (Math.sqrt(d.target.value/my.maxSize()*1000)); })
            .on("mouseover", showLinkButton)
            .on("mouseout", hideLinkButton)
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

    function showLinkButton(d){
        if(d.target) { d = d.target; } // If mouse is over a link then reset the d variable to point to a node
        setLinkButtonVisibilityTo.call(this,true,d);
    }

    function hideLinkButton(d) {
        if(d.target) { d = d.target; }
        setLinkButtonVisibilityTo.call(this,false,d);
    }

    function setLinkButtonVisibilityTo(On,d) {
        var id = this.id||this.lastChild.id;
        var preOrPost = id.substr(0,id.indexOf("-"));
        var childButtonIds = [];
        findChildButtons(d,childButtonIds);
        if(preOrPost + "-" + childButtonIds[0] == id) {
            //the mouse is over the button - highlight the appropriate trail
            if(On) {
                highlightBothTrees(this.__data__);
            } else {
                var root = getRoot(this.__data__);
                var otherTreeData = getTreeData(getOther(preOrPost));
                var otherTreeRoot = getRoot(otherTreeData);
                removeHighlight(root,preOrPost);
                removeHighlight(otherTreeRoot,getOther(preOrPost));
            }
        }
        var opacity = On ? 1 : 0.15;
        for (var i = 0 ; i < childButtonIds.length ; i++) {
            $("#" + preOrPost + "-" + childButtonIds[i].toString()).attr("opacity",opacity);
            $("#" + preOrPost + "-" + childButtonIds[i].toString() + "rect").attr("opacity",opacity);
        }
    }

    function findChildButtons(node,childButtonIds) {
        if(node.isButton) {
            childButtonIds.push(node.id);
        }
        for(var i = 0; i < node.children.length; i++) {
            childButtonIds = findChildButtons(node.children[i],childButtonIds);
        }
        return childButtonIds;
    }

    var nodeIDCounter = 0;

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    if(!testMode) {
        return my;
    } else {
        return {
            my:my,
            lastWordIsNotSearchTerm:lastWordIsNotSearchTerm,
            firstWordIsNotSearchTerm:firstWordIsNotSearchTerm,
            removeTrailingPunctuation:removeTrailingPunctuation,
            pruneTerm:pruneTerm,
            mergeTrees:mergeTrees,
            nestTreeData:nestTreeData,
            createTerm:createTerm,
            processTreeData:processTreeData,
            handleSpacesInMultiWordSearchTerm:handleSpacesInMultiWordSearchTerm,
            createTree:createTree
        }
    }
}
