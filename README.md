WordTree
========

This is an implementation of a [WordTree](http://www-958.ibm.com/software/data/cognos/manyeyes/page/Word_Tree.html) which uses [d3.js](http://d3js.org) for the front end, and [node.js](http://nodejs.org) for the backend. 

The data (in the keyWords.js file) is currently a list of all the lines from Shakespeare's sonnets, but the intention is that you replace this with content which is useful to you.

I intend to rewrite this as a d3 plugin in the future.

Installation
------------

1. Install [node.js](http://nodejs.org) 
2. For Windows, run the Node.js command prompt
3. run 'node index.js' from root directory of the project
4. navigate in your browser to localhost:8889/client/index.html

Dependencies
------------

### Node Modules
* restify
* dateformat
* querystring

### Other
* jQuery
