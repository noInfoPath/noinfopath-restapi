var config = require("./config"),
	restify = require("restify"),
	crud = require("./no-mongo-crud"),
	odataParser = require("./no-odata"),
	schemas = require("./schemas")(),
	configureREST = require("./no-rest");

var server = restify.createServer();

server.use(restify.queryParser());

server.use(restify.jsonBodyParser());

server.use(odataParser());

configureREST(server, crud, schemas);

// server.get("/AppConfig", function(req, res, next){
// 	var filter = createFilter(req.query.$filter);
//
// 	beginMongoTransaction(READ, "NoInfoPath_AppStore", "AppConfigs", null, filter)
// 		.then(function(results){
// 			res.send(200, results);
// 		})
// 		.catch(function(err){
// 			console.error(err);
// 			res.send(500);
// 		});
// });
//
// server.get("/AppConfig/:id", function(req, res, next){
// 	var filter = {};
//
// 	filter[config.schema.AppConfigs.pk] = req.params.id;
//
// 	beginMongoTransaction(READ, "NoInfoPath_AppStore", "AppConfigs", null, filter)
// 		.then(function(results){
// 			if(results.length > 0){
// 				res.send(200, results[0]);
// 			} else {
// 				res.send(404);
// 			}
//
// 		})
// 		.catch(function(err){
// 			console.error(err);
// 			res.send(500);
// 		});
// });
//
// server.put("AppConfig/:id", function(req, res, next, obj){
// 	beginMongoTransaction(UPDATE, "NoInfoPath_AppStore", "AppConfigs", req.body, req.id)
// 		.then(function(results){
// 			res.send(200);
// 		})
// 		.catch(function(err){
// 			console.error(err);
// 			res.send(500);
// 		});
// });
//
// server.post("AppConfig", function(req, res, next, obj){
// 	beginMongoTransaction(CREATE, "NoInfoPath_AppStore", "AppConfigs", req.data)
// 		.then(function(results){
// 			res.send(200);
// 		})
// 		.catch(function(err){
// 			console.error(err);
// 			res.send(500);
// 		});
// });
//
// server.del("AppConfig/:id", function(req, res, next){
// 	beginMongoTransaction(DELETE, "NoInfoPath_AppStore", "AppConfigs", null, req.id)
// 		.then(function(results){
// 			res.send(200);
// 		})
// 		.catch(function(err){
// 			console.error(err);
// 			res.send(500);
// 		});
// });

server.listen(config.server.port, function() {
  console.log('%s listening at %s', server.name, server.url);
});
