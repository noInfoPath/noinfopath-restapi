var mongodb = require("mongodb"),
	config = require("./config.json"),
	NoBSONTimestamp = require("noinfopath-bson-timestamp"),
	jwt = require('restify-jwt'),
	MongoClient = mongodb.MongoClient,
	Timestamp = mongodb.Timestamp,
	operations = {
		"i": "I",
		"u": "U",
		"d": "D"
	};

function _get(crud, schema, req, res, next) {
	//console.log("_get", req.odata);
	crud.execute(schema, crud.operations.READ, null, req.odata)
		.then(function (results) {
			//console.log(results);
			if(results.length) {
				res.send(200, results);
			} else {
				res.send(404);
			}
		})
		.catch(function (err) {
			//console.error(err);
			res.send(500, err);
		})
		.then(function () {
			next();
		});
}

function _getOne(crud, schema, req, res, next) {
	req.odata.query[schema.primaryKey] = req.params.id;
	crud.execute(schema, crud.operations.READ, null, req.odata)
		.then(function (results) {
			if(results.length) {
				res.send(200, results[0]);
			} else {
				res.send(404);
			}
		})
		.catch(function (err) {
			console.error(err);
			res.send(500, err);
		})
		.then(function () {
			next();
		});

}

function _putByPrimaryKey(crud, schema, req, res, next) {
	var routeID = req.params.id,
		filter = {},
		b = typeof (req.body) === "string" ? JSON.parse(req.body) : req.body;

	if(b._id) {
		delete b._id;
		req.body = JSON.stringify(b);
		//console.log("b", b);
	}

	filter[schema.primaryKey] = routeID;

	crud.execute(schema, crud.operations.UPDATE, req.body, filter)
		.then(function (results) {
			res.send(200, results);
		})
		.catch(function (err) {
			console.error(err);
			res.send(500, err);
		})
		.then(function () {
			next();
		});

}

function _post(crud, schema, req, res, next) {
	//console.log(req.body);
	console.log("POST", req.url);
	console.log(req.headers);
	req.body._id = req.body[schema.primaryKey];

	crud.execute(schema, crud.operations.CREATE, req.body)
		.then(function (results) {
			res.send(200, results);
		})
		.catch(function (err) {
			console.error(err);
			res.send(500, err);
		})
		.then(function () {
			next();
		});

}

function _delete(crud, schema, req, res, next) {
	crud.execute(schema, crud.operations.DELETE, null, req.params.id)
		.then(function (results) {
			res.send(200, results);
		})
		.catch(function (err) {
			console.error(err);
			res.send(500, err);
		})
		.then(function () {
			next();
		});
}

function _checkVersion(crud, schema, req, res, next) {

	var clientNS = schema.namespace.split(".")[0],
		checkSchema = {
			"mongoDbUrl": config.mongoDbUrl + "/local",
			//"uri": "NoInfoPath_AppStore/appConfigs",
			"collectionName": "oplog.rs",
			"primaryKey": "h",
			// "versionUri": "changes/version",
			// "changesUri": "changes"
		},
		rx = new RegExp(clientNS + ".[^$cmd]"),
		mongoq = {
			query: {
				ns: rx
			},
			fields: {
				"ts": 1
			},
			options: {
				limit: 1,
				sort: [["ts", "descending"]]
			}
		};

	crud.execute(checkSchema, crud.operations.READ, null, mongoq)
		.then(function (results) {
			if(results.length > 0) {
				var r = results[0];
				res.send(200, {
					namespace: clientNS,
					version: r.NoBSONTimestamp.toNumber(results.ts)
				});
			} else {
				res.send(500);
			}

		})
		.catch(function (err) {
			console.error(err);
			res.send(500, err);
		})
		.then(function () {
			next();
		});
}

function _getCurrentVersionNo(crud, schema){
	var clientNS = schema.namespace.split(".")[0],
		checkSchema = {
			"mongoDbUrl": config.mongoDbUrl + "/local",
			//"uri": "NoInfoPath_AppStore/appConfigs",
			"collectionName": "oplog.rs",
			"primaryKey": "h",
			// "versionUri": "changes/version",
			// "changesUri": "changes"
		},
		rx = new RegExp(clientNS + ".[^$cmd]"),
		mongoq = {
			query: {
				ns: rx
			},
			fields: {
				"ts": 1
			},
			options: {
				limit: 1,
				sort: [["ts", "descending"]]
			}
		};

	return crud.execute(checkSchema, crud.operations.READ, null, mongoq)
		.then(function(data){
			var d = data.length > 0 ? data[0] : {ts: new Timestamp()};

			return NoBSONTimestamp.toNumber(d.ts);
		});

}

function _getChangeSet(crud, schema, req) {
	var ts = NoBSONTimestamp.fromNumber(req.params.version),
		clientNS = schema.namespace.split(".")[0],
		checkSchema = {
			"mongoDbUrl": config.mongoDbUrl + "/local",
			//"uri": "NoInfoPath_AppStore/appConfigs",
			"collectionName": "oplog.rs",
			"primaryKey": "h",
			// "versionUri": "changes/version",
			// "changesUri": "changes"
		},
		rx = new RegExp(clientNS + ".[^$cmd]"),
		mongoq = {
			query: {

				"ns": {
					"$regex": rx
				},
				"ts": {
					"$gt": ts
				}

			},
			fields: null,
			options: {
				//limit: 1,
				sort: [["ts", "ascending"]]
			}
		};

	console.log("_getChangeSet::start", ts);

	return crud.execute(checkSchema, crud.operations.READ, null, mongoq)
		.then(function (data) {
			console.log("_getChangeSet::success", data);
			return data;
		})
		.catch(function (err) {
			console.error("_getChangeSet::error", err);
		});

}

function _getChangeSetRecords(crud, schema, changeset) {
	console.log("_getChangeSetRecords");


	var clientNS = schema.namespace.split(".")[0],
		mongoq = {
			query: {},
			fields: null,
			options: null
		},
		changeIDs = [];
	for(var c = 0; c < changeset.length; c++) {
		var change = changeset[c];
		changeIDs[c] = change.o._id;
	}

	mongoq.query[schema.primaryKey] = {
		"$in": changeIDs
	};

	console.log("_getChangeSetRecords", mongoq);

	return crud.execute(schema, crud.operations.READ, null, mongoq)
		.then(function (data) {
			var r = {
				changeSet: changeset,
				changeSetRecords: data
			};
			console.log("_getChangeSetRecords::success", data.length);
			return r;
		})
		.catch(function (err) {
			console.log("_getChangeSetRecords::error", err);

			//console.error(err);
		});


}

function _createChangeSetResults(crud, schema, changeContext) {
	//console.log("_createChangeSetResults::schema",  schema);
	function NoChange(change, record) {
		console.log("change", change, "record", record);
		var nsParts = change.ns.split(".");

		this.tableName = nsParts[1];
		this.version = NoBSONTimestamp.toNumber(change.ts) ;
		this.operation = operations[change.op];
		this.changedPKID = record[schema.primaryKey];
		this.values = record;
	}

	var result = {
		namespace: schema.namespace.split(".")[0],
		changes: [],
		version: 0
	};

	for(var c = 0; c < changeContext.changeSet.length; c++) {
		var change = changeContext.changeSet[c],
			record = changeContext.changeSetRecords[c];

		if(record) {
			result.changes[c] = new NoChange(change, record);
			//console.log(result.changes[c]);
		}
	}

	return _getCurrentVersionNo(crud, schema)
		.then(function(version){

			result.version = version;

			return result;
		});


}

function _getChanges(crud, schema, req, res, next) {
	_getChangeSet(crud, schema, req)
		.then(_getChangeSetRecords.bind(null, crud, schema))
		.then(_createChangeSetResults.bind(null, crud, schema))
		.then(function (changes) {
			res.send(200, changes);
		})
		.catch(function (err) {
			console.log("_getChanges::error", err);
			res.send(500, err);
		})
		.then(function () {
			next();
		});

	// console.log("changes", results);
	// if(results.length > 0){
	// 	for(var i=0; i<results.length; i++) {
	// 		var result = results[i],
	// 			change = {
	// 				"tableName": result.ns.split(".")[1],
	// 				"version": result.v,
	// 				"operation": operations[result.op]
	// 				"changedPKID": result.o
	// 			};
	// 	}
	//
	// 	res.send(200, results);

}

function _configRoute(server, crudProvider, schema) {
	var jwtCheck = jwt({
		secret: new Buffer(config.auth0.secret, "base64"),
		audience: config.auth0.audience
	});

	console.log("Configuring route ", schema.uri);
	server.get(schema.uri, jwtCheck, _get.bind(null, crudProvider, schema));
	server.get(schema.uri + "/:id", jwtCheck, _getOne.bind(null, crudProvider, schema));
	server.put(schema.uri + "/:id", jwtCheck, _putByPrimaryKey.bind(null, crudProvider, schema));
	server.del(schema.uri + "/:id", jwtCheck, _delete.bind(null, crudProvider, schema));
	server.post(schema.uri, jwtCheck, _post.bind(null, crudProvider, schema));

	if(schema.versionUri) server.get(schema.versionUri, jwtCheck, _checkVersion.bind(null, crudProvider, schema));
	if(schema.changesUri) server.get(schema.changesUri + "/:version", jwtCheck, _getChanges.bind(null, crudProvider, schema));
}

module.exports = function (server, crudProvider, schemas) {
	schemas.forEach(_configRoute.bind(null, server, crudProvider));
};
