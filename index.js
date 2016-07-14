var restify = require("restify"),
	MongoClient = require('mongodb').MongoClient,
	Promise = require('es6-promise').Promise,
	url = "gitlab.img.local/NoInfoPath_AppStore";

function respond(req, res, next) {
  res.send('hello ' + req.params.name);
  next();
}

var server = restify.createServer();
server.get('/hello/:name', respond);
server.head('/hello/:name', respond);

server.listen(4001, function() {
  console.log('%s listening at %s', server.name, server.url);
});

server.get("/:id", function(req, res, next, obj){
	res.send("Get");
});

server.head("/:id", function(req, res, next){
	res.send("Head");
});

server.put("/:id", function(req, res, next, obj){
	res.send("put");
});

server.post("/", function(req, res, next, obj){
	//console.log(req);
	//console.log(next);
	//console.log(obj);
	res.send(200);

	//NEXT THING TO DO IS FIND OUT WHERE IN THE REQ IS THE DATA

	// MongoClient.connect(url)
	// 	.then(function(db) {
	// 		db.collection("changes").insertOne(obj)
	// 			.then(function(){
	// 				res.send(200);
	// 			})
	// 			.catch(function(err){
	// 				console.err("Failed to insert");
	// 				res.send(500);
	// 			})
	// 			.finally(function() {
	// 				db.close();
	// 				console.log("markTransactionProcessed::dbclosed");
	// 			});
	// 	})
	// 	.catch(reject);
});


server.del("/:id", function(req, res, next){
	res.send("Del");
});
