<!DOCTYPE html>
<html>
<head>
	<link rel="stylesheet" href="qunit-1.10.0.css" />
	<script src="qunit-1.10.0.js"></script>
    <script src="../client/d3.js"></script>
    <script src="../client/d3.layout.js"></script>
    <script src="../client/jQuery-1.8.1.js"></script>
	<script src="../plugin/wordTree.js"></script>
	<script>
    var subject = wordTree(true);
    
	function testWordIsNotSearchTerm(first,wordArray) {
        var testableWordTree = wordTree(true);
        var myFunction;
		if(first == true) {
			myFunction = testableWordTree.firstWordIsNotSearchTerm;
		} else {
			myFunction = testableWordTree.lastWordIsNotSearchTerm;
		}
		var singleWordArray = ["words"];
		equal(myFunction(wordArray,"balloon"),false,"first/last word is search term function should return false");
		equal(myFunction(wordArray,"balloons"),false,"search term is plural form of first/last word");
		equal(myFunction(wordArray,"Balloon"),false,"first/last word has different capitalisation");
		equal(myFunction(wordArray,"balloon,"),false,"search term has trailing punctuation");
		equal(myFunction(wordArray,"moon"),true,"search term is in wordArray but not first/last word");
		equal(myFunction(wordArray,""),true,"search term is empty string");
		equal(myFunction(wordArray,"the"),true,"search term is first/last word");
		equal(myFunction(wordArray,null),true,"search term is null");
		equal(myFunction(singleWordArray,"word"),false,"word array has one word, word is singular form of search term");
		equal(myFunction(singleWordArray,"words"),false,"word array has one word");
		equal(myFunction(singleWordArray,"foo"),true,"word array has one word, doesn't match search term");
	}
	
	test("lastWordIsNotSearchTerm test", function() {
		var wordArray = ["the","moon","is","a","balloon"];
		testWordIsNotSearchTerm(false,wordArray);
	});
	
	test("firstWordIsNotSearchTerm test", function() {
		var wordArray = ["balloon","a","is","moon","the"];
		testWordIsNotSearchTerm(true,wordArray);			
	});
	
	test("removeTrailingPunctuation test", function() {
		equal(subject.removeTrailingPunctuation("hello"),"hello","don't alter word with no trailing punctuation");
		equal(subject.removeTrailingPunctuation("Hello"),"hello","to lower case");	
		equal(subject.removeTrailingPunctuation("hello,"),"hello","remove trailing comma");		
		equal(subject.removeTrailingPunctuation("hello."),"hello","remove trailing period");	
		equal(subject.removeTrailingPunctuation("hello:"),"hello","remove trailing colon");	
		equal(subject.removeTrailingPunctuation("hello;"),"hello","remove trailing semicolon");	
		equal(subject.removeTrailingPunctuation("hello'"),"hello","remove trailing single quote");	
		equal(subject.removeTrailingPunctuation("hello?"),"hello","remove trailing question mark");	
		equal(subject.removeTrailingPunctuation("hello!"),"hello","remove trailing exclamation");
		equal(subject.removeTrailingPunctuation("hello,,"),"hello","remove multiple trailing punctuation marks");			
		equal(subject.removeTrailingPunctuation(""),"","empty string");
		equal(subject.removeTrailingPunctuation(null),null,"null input");	
	});
	
	test("prune term", function() {
		var wordArray = ["balloon","a","is","moon","the"];
		var test1Array = wordArray.slice(), 
			test2Array = wordArray.slice(), 
			test3Array = wordArray.slice(),
			test4Array = wordArray.slice(), 
			test5Array = wordArray.slice();
		
		var singleWordArray = ["balloon"];
		deepEqual(subject.pruneTerm(test1Array,2),["is","moon","the"],"strip initial words if they don't match exactly");
		deepEqual(subject.pruneTerm(test2Array,0),["balloon","a","is","moon","the"],"do nothing if first word matches");
	});
    
    test("create dataTree", function() {
    
        var phrase1 = "Tennis ball";
        var phrase2 = "Lots and lots and lots and lots of words in the phrase";
        var phrase3 = "some  values";
        var phrase4 = "some 1 numeric values";
        var phrase5 = "word";
        var phrase6 = "Tennis ball";
        
        var buttonText = function(d) {return d.name;}
    
        var cleanPhrase1 = ["Tennis","ball"];
        var cleanPhrase2 = ["lots","and","lots","and","lots","and","lots","of","words","in","the","phrase"];
        var cleanPhrase3 = ["some",null,"values"];
        var cleanPhrase4 = ["some",1,"numeric","values"];
        var cleanPhrase5 = ["word"];
        var cleanPhrase6 = ["Tennis","ball"];

        var actualResult1 = new DataTree(phrase1,cleanPhrase1,1,0,0,1,false,false,buttonText,null);
        testDataTree(actualResult1,"Tennis",1,1,"ball",1,0,"basic test");
        var actualResult2 = new DataTree(phrase2,cleanPhrase2,1,0,0,15,false,false,buttonText,null);
        testDataTree(actualResult2,"lots",1,1,"and",1,0,"long phrase");
        equal(actualResult2.children[0].children[0].children[0].children[0].children[0].children[0].children[0].children[0].children[0].children[0].children[0].cleanName,"phrase","long phrase : last word");
        var actualResult3 = new DataTree(phrase3,cleanPhrase3,1,0,0,1,false,false,buttonText,null);
        testDataTree(actualResult3,"some",1,1,null,1,0,"null value");
        var actualResult4 = new DataTree(phrase4,cleanPhrase4,1,0,0,1,false,false,buttonText,null);
        testDataTree(actualResult4,"some",1,1,"1",1,0,"numeric value");
        var actualResult5 = new DataTree(phrase5,cleanPhrase5,1,0,0,1,false,false,buttonText,null);
        testDataTree(actualResult5,"word",0,1,1,0,undefined,"one word phrase");
        var actualResult6 = new DataTree(phrase6,cleanPhrase6,9283,100,0,1,false,false,buttonText,null);
        testDataTree(actualResult6,"Tennis",1,9283,"ball",9283,100,"value and matchingTermIndex");
    });
    
    function testDataTree(actualResult,expectedname,expectedChildren,expectedRootValue,expectedFirstChildName,expectedFirstChildValue,expectedFirstChildMatchingTermIndex,description) {
        equal(actualResult.cleanName,expectedname,description + " : test name")
        equal(actualResult.children.length,expectedChildren,description + " : number of children");
        equal(actualResult.value,expectedRootValue,description + " : root value");
        if(actualResult.children.length>0) {
            equal(actualResult.children[0].cleanName,expectedFirstChildName,description + " : first child name");
            equal(actualResult.children[0].value,expectedFirstChildValue,description + " : first child value");    
            equal(actualResult.children[0].matchingTermIndex,expectedFirstChildMatchingTermIndex,description + " : first child matchingTermIndex");
        }
    }

    test("merge tree", function() {
        //name (matchingTermIndex)
        //Input
        //  tennis ball (0)
        //  tennis racket (1)
        //  tennis racket strings (2)
        //Output
        //  tennis ("0,1,2") 
        //      ball ("0")
        //      racket ("1,2")
        //          strings ("2")
        var buttonText = function(d) {return d.name;}
        var tree1 = new DataTree("tennis ball",["tennis","ball"],1,0,0,1,false,false,buttonText,null);
        var tree2 = new DataTree("tennis racket",["tennis","racket"],1,1,0,1,false,false,buttonText,null);
        var mergedTrees = subject.mergeTrees(tree1,tree2);
        testDataTree(mergedTrees,"tennis",2,2,"ball",1,0,"mergedTree");
        strictEqual(mergedTrees.children[1].cleanName,"racket","second child name");   
        var tree3 = new DataTree("tennis racket strings",["tennis","racket","strings"],20,2,0,4,false,false,buttonText,null);
        var secondGenerationMerge = subject.mergeTrees(mergedTrees,tree3);
        testDataTree(secondGenerationMerge,"tennis",2,22,"ball",1,0,"second generation merged tree");
        strictEqual(secondGenerationMerge.children[1].cleanName,"racket","second child name"); 
        strictEqual(secondGenerationMerge.children[1].children[0].cleanName,"strings","grandchild name");
        strictEqual(secondGenerationMerge.matchingTermIndex,"0,1,2","root level matching term index");
        strictEqual(secondGenerationMerge.children[0].matchingTermIndex,"0","first child matching term index");
        strictEqual(secondGenerationMerge.children[1].matchingTermIndex,"1,2","second child matching term index");
        strictEqual(secondGenerationMerge.children[1].children[0].matchingTermIndex,"2","grandchild matching term index");
    });
    
    test("DataTree.getChildIndex", function () {
        var buttonText = function(d) {return d.name;}
        var tree1 = new DataTree("tennis ball",["tennis","ball"],1,0,0,1,false,false,buttonText,null);
        var tree2 = new DataTree("tennis racket",["tennis","racket"],1,1,0,1,false,false,buttonText,null);
        var mergedTrees = subject.mergeTrees(tree1,tree2);
        var tree3 = new DataTree("tennis racket strings",["tennis","racket","strings"],20,2,0,4,false,false,buttonText,null);
        var secondGenerationMerge = subject.mergeTrees(mergedTrees,tree3);
        
        strictEqual(tree1.getChildIndex("ball"),0,"simple positive case");
        strictEqual(tree1.getChildIndex("foo"),-1,"simple negative case");
        strictEqual(mergedTrees.getChildIndex("racket"),1,"positive testing with two children");
        strictEqual(mergedTrees.getChildIndex(null),-1,"pass null");
        strictEqual(secondGenerationMerge.getChildIndex("racket"),1,"testing with grandchildren");
    });
    
    test("nestTreeData", function () {
        var inputData = [
                {"name":"tennis ball","cleanName":["tennis","ball"],"value":1,"matchingTermIndex":0},
                {"name":"tennis racket,","cleanName":["tennis","racket"],"value":1,"matchingTermIndex":1},
                {"name":"Tennis racket strings","cleanName":["tennis","racket","strings"],"value":20,"matchingTermIndex":2},
                {"name":"tennis Ball Bounciness!","cleanName":["tennis","ball","bounciness"],"value":5,"matchingTermIndex":3},
                {"name":"Tennis umpire seat","cleanName":["tennis","umpire","seat"],"value":7,"matchingTermIndex":4},
                {"name":"tennis score ","cleanName":["tennis","score",""],"value":13,"matchingTermIndex":5}                
            ];
        testDataTree(subject.nestTreeData(inputData,"tennis"),"tennis",4,47,"ball",6,"0,3","nestTreeData positive case");
        
        var inputData1 = [{"cleanName":["tennis","ball"],"value":1,"matchingTermIndex":0}];
        testDataTree(subject.nestTreeData(inputData1,"tennis"),"tennis",1,1,"ball",1,"0","nestTreeData single term");
        
        var inputData2 = [{"cleanName":["tennis"],"value":1,"matchingTermIndex":0}];
        testDataTree(subject.nestTreeData(inputData2,"tennis"),"tennis",0,1,undefined,undefined,undefined,"nestTreeData single word term");
    });
    
    test("create term", function() {
        var matchingTerm = {
                name:"Bouncy tennis ball",
                cleanName:["bouncy","tennis","ball"],
                value:1
            };
        var matchingTermIndex = 0;
        var searchTerm = "tennis";
        var isPost = false;
        
        var actualResult = subject.createTerm(matchingTerm,matchingTermIndex,searchTerm,isPost);
      
        equal(actualResult.cleanName[0],"ball","pre: first word in name");
        equal(actualResult.cleanName[1],"tennis","pre: second word in name");
        equal(actualResult.value,1,"pre: value");
        equal(actualResult.matchingTermIndex,"0","pre: matchingTermIndex");
        
        var actualResult1 = subject.createTerm(matchingTerm,matchingTermIndex,searchTerm,true);
        equal(actualResult1.cleanName[0],"bouncy","post: first word in name");
        equal(actualResult1.cleanName[1],"tennis","post: second word in name");
        equal(actualResult1.value,1,"post: value");
        equal(actualResult1.matchingTermIndex,"0","post: matchingTermIndex");
    });
    
    test("processTreeData", function() {
        var searchTerm = "tennis";
        var postTreeData1 = [], preTreeData1 = [];
        var matchingTerms1 = [
                {"name":"tennis ball",value:1},
                {"name":"bouncy tennis ball",value:13},
                {"name":"tennis racket",value:7}
            ];
        var postTreeData2 = [], preTreeData2 = [];
        var matchingTerms2 = [
                {"name":"Tennis ball",value:1},
                {"name":"bouncy, tennis ball",value:13},
                {"name":"tennis  racket.",value:7}
            ];
        var actualResult1 = subject.processTreeData(matchingTerms1,searchTerm,postTreeData1,preTreeData1);
        var actualResult2 = subject.processTreeData(matchingTerms2,searchTerm,postTreeData2,preTreeData2);
        
        equal(postTreeData1[0].cleanName[0],"tennis","base case: post tree root name");
        equal(postTreeData1[1].cleanName[1],"ball","base case: post tree other name");
        equal(postTreeData1[0].matchingTermIndex,"0","base case : post tree root matchingTermIndex");
        equal(preTreeData1[0].cleanName[0],"tennis","base case: pre tree root name");
        equal(preTreeData1[0].cleanName[1],"bouncy","base case: pre tree other name");
        equal(preTreeData1[0].matchingTermIndex,"1","base case : pre tree root matchingTermIndex");
        
        equal(postTreeData2[0].cleanName[0],"tennis","advanced case: post tree root name");
        equal(postTreeData2[1].cleanName[1],"ball","advanced case: post tree other name");
        equal(postTreeData2[0].matchingTermIndex,"0","advanced case : post tree root matchingTermIndex");
        equal(preTreeData2[0].cleanName[0],"tennis","advanced case: pre tree root name");
        equal(preTreeData2[0].cleanName[1],"bouncy","advanced case: pre tree other name");
        equal(preTreeData2[0].matchingTermIndex,"1","advanced case : pre tree root matchingTermIndex");
        
    });
    
    test("handleSpacesInMultiWordSearchTerm test", function() {
        var searchTerm = "Tennis ball";
        var matchingTerms = [
            {"name":"There was once a Tennis ball from Tipperary"},
            {"name":"Tennis ball, Tennis ball, how fair thou art"},
            {"name":"tennis ball hello"},
            {"name":"tennis ball"}
        ];
        var actualResult = 
        subject.handleSpacesInMultiWordSearchTerm(searchTerm,matchingTerms);
        
        deepEqual(matchingTerms[0],{"name":"There was once a Tennis_ball from Tipperary"},"basic case");
        deepEqual(matchingTerms[1],{"name":"Tennis_ball, Tennis_ball, how fair thou art"},"multiple examples of search term");
        deepEqual(matchingTerms[2],{"name":"Tennis_ball hello"},"different capitalisation");
        deepEqual(matchingTerms[3],{"name":"Tennis_ball"},"just search term present");
    });
    
    test("create tree test", function() {
        var searchTerm1 = "tennis";
        var matchingTerms1 = [
            {"name":"tennis ball","value":1},
            {"name":"bouncy, tennis ball fun","value":7}
        ];
        var expectedPostTree1 = 
            {
                "children": [
                    {
                        "children": [
                            {
                            "children": [],
                            "name":"bouncy, tennis ball fun",
                            "cleanName":"fun",
                            "value":7,
                            "matchingTermIndex":"1"
                            }
                        ],
                        "name":"tennis ball",
                        "cleanName":"ball",
                        "value":8,
                        "matchingTermIndex":"0,1"
                    }
                ],
                "name":"tennis ball",
                "cleanName":"tennis",
                "value":8,
                "matchingTermIndex":"0,1",
            };
            
        var searchTerm2 = "tennis";
        var matchingTerms2 = [
            {"name":"Tennis ball","value":1},
            {"name":"bouncy, TENNIS court fun","value":7}
        ];
        var expectedPostTree2 = 
            {
                "children": [
                    {
                        "children": [],
                        "name":"Tennis ball",
                        "cleanName":"ball",
                        "value":1,
                        "matchingTermIndex":"0"
                    },
                    {
                        "children": [
                            {
                            "children": [],
                            "name":"bouncy, TENNIS court fun",
                            "cleanName":"fun",
                            "value":7,
                            "matchingTermIndex":"1"
                            }
                        ],
                        "name":"bouncy, TENNIS court fun",
                        "cleanName":"court",
                        "value":7,
                        "matchingTermIndex":"1"
                    }
                ],
                "name":"Tennis ball",
                "cleanName":"tennis",
                "value":8,
                "matchingTermIndex":"0,1",
            };
        
    function createTreeTestHelper(matchingTerms,searchTerm,expectedPostTree) {
        function myCallback(error,errorText,postTree,preTree,matchingTerms) {
            equal(error,false,"no error");
            equal(errorText,"","no errorText");
            equal(postTree.name,expectedPostTree.name,"root name equal");
            equal(postTree.cleanName, expectedPostTree.cleanName, "root cleanName equal");
            equal(postTree.value,expectedPostTree.value,"root value equal");
            equal(postTree.matchingTermIndex, expectedPostTree.matchingTermIndex, "root matchingTermIndex equal");
            equal(postTree.children.length,expectedPostTree.children.length, "root number of children");
            equal(postTree.children[0].name,expectedPostTree.children[0].name, "first child name");
            equal(postTree.children[0].cleanName,expectedPostTree.children[0].cleanName, "first child cleanName");
            equal(postTree.children[0].children.length,expectedPostTree.children[0].children.length, "first child number of children");
            equal(postTree.children[0].value,expectedPostTree.children[0].value, "first child value");
            equal(postTree.children[0].matchingTermIndex,expectedPostTree.children[0].matchingTermIndex, "first child matchingTermIndex");
        }
        subject.createTree(matchingTerms,searchTerm,myCallback);
        }
        
        createTreeTestHelper(matchingTerms1,searchTerm1,expectedPostTree1);
        createTreeTestHelper(matchingTerms2,searchTerm2,expectedPostTree2);
    });
   
	</script>
</head>
<body>
	<div id="qunit"></div>
</body>
</html>