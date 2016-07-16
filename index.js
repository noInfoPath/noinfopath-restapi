var config = require("./config"),
	restify = require("restify"),
	MongoClient = require('mongodb').MongoClient,
	parser = require("odata-parser"),
	querystring = require('querystring'),
	createFilter = require('odata-v4-mongodb').createFilter,
	CRUD = {},
	CREATE = "create",
	READ = "read",
	UPDATE = "update",
	DELETE = "delete";

function _readDocument(collection, data, filter) {
	console.log(filter);
	return collection.find(filter).toArray();
}
CRUD[READ] = _readDocument;

function _insertDocument(collection, data, filter) {
	return collection.insertOne(data);
}
CRUD[CREATE] = _insertDocument;

function _updateDocument(collection, data, filter){
	return collection(collection).update(filter, data);
}
CRUD[UPDATE] = _updateDocument;

function _deleteDocument(collection, data, filter) {
	return collection.deleteOne(filter);
}
CRUD[DELETE] = _deleteDocument;

function beginMongoTransaction(type, dbName, collectionName, data, filter) {
	var _db;

	function executeTransaction(type, data, filter, collection) {
		//console.log(data, id, collection);

		return CRUD[type](collection, data, filter);
	}

	function resolveCollection(collectionName, db) {
		_db = db;

		return db.collection(collectionName);
	}

	return new Promise(function(dbName, resolve, reject) {
		MongoClient.connect(config.mongo[dbName])
			.then(resolveCollection.bind(null, collectionName))
			.then(executeTransaction.bind(null, type, data, filter))
			.then(resolve)
			.catch(reject);
	}.bind(null, dbName));
}

var server = restify.createServer();

server.use(restify.queryParser());

server.use(restify.bodyParser());

server.use(function(req, res, next){
	//console.log(req.query);
	//console.log(req.params, req.body, req.query);
	//console.log(req.body);
	if(!!req.body) req.data = JSON.parse(req.body);

	next();
});

server.listen(config.server.port, function() {
  console.log('%s listening at %s', server.name, server.url);
});

server.get("/AppConfig", function(req, res, next){
	var filter = createFilter(req.query.$filter);

	beginMongoTransaction(READ, "NoInfoPath_AppStore", "AppConfigs", null, filter)
		.then(function(results){
			res.send(200, results);
		})
		.catch(function(err){
			console.error(err);
			res.send(500);
		});
});

server.get("/AppConfig/:id", function(req, res, next){
	var filter = {};

	filter[config.schema.AppConfigs.pk] = req.params.id;

	beginMongoTransaction(READ, "NoInfoPath_AppStore", "AppConfigs", null, filter)
		.then(function(results){
			if(results.length > 0){
				res.send(200, results[0]);
			} else {
				res.send(404);
			}

		})
		.catch(function(err){
			console.error(err);
			res.send(500);
		});
});

server.put("AppConfig/:id", function(req, res, next, obj){
	beginMongoTransaction(UPDATE, "NoInfoPath_AppStore", "AppConfigs", req.body, req.id)
		.then(function(results){
			res.send(200);
		})
		.catch(function(err){
			console.error(err);
			res.send(500);
		});
});

server.post("AppConfig", function(req, res, next, obj){
	beginMongoTransaction(CREATE, "NoInfoPath_AppStore", "AppConfigs", req.data)
		.then(function(results){
			res.send(200);
		})
		.catch(function(err){
			console.error(err);
			res.send(500);
		});
});

server.del("AppConfig/:id", function(req, res, next){
	beginMongoTransaction(DELETE, "NoInfoPath_AppStore", "AppConfigs", null, req.id)
		.then(function(results){
			res.send(200);
		})
		.catch(function(err){
			console.error(err);
			res.send(500);
		});
});
