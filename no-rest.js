/*
*	Route Configuration
*	-------------------
*
*	> NOTE: NoInfoPath Configuration (@noinfopath/noinfopath-config) should be used in conjuction with the feature. The the noinfopath-config `readme.md` for more information.
*
*	The NoInfoPath route configuration files make it simple to create new REST End-Points for you application. The files contain all of the information require to establish
*	the end-points, define what type of backend storage system will be implmented by the end-points, along with any storage type specific configurations.
*
*	Typically you create a configuration file for each namespace that needs be to expose as a REST interface. A `namespace` is a route's URI prefix. For example given a
*	namespace name of `foo` and a collection named `bar`, the uri would be `/foo/bar`
*
*	When the configuration files are processed the HTTP URI's GET, POST, PUT, and DELETE are created. There are a few additional uri's created for Bucket storage.
*	Bucket type stores add two `-metadata` `GET` end-points. (e.g. `/foo/bar-metadata`, `/foo/bar-metadata/:id`)
*
*	#### Storage Types
*
*	The primary configuration property is `storageType`. It defines which CRUD (Create, Read, Update, and Delete) provider is used by a given end-point.
*
*	**Supported Storage Types**
*
*	|Name|Type|Value|Description|
*	|----|----|-----|-----------|
*	|MongoDB|Collection|mongo|This provider is used to expose a single MongoDB Collection (object store.)|
*	|MongoDB Bucket Storage|Bucket|mgfsb|This provider is used to expose MongoDB's large object storage known as GridFSBucket. Use this provider when you are storing object larger than 16KB.|
*	|Google Cloud Storage|Bucket|gcs|This provider is used to expose a Google Cloud Storage Bucket.|
*	|Amazon Web Services S3|Bucket|awss3|This provider is used to expose an AWS S3 Bucket.|
*
*	#### Example Route Configuration
* ```json
*		{
*			"storageType": "gcs",
*			"uri": "dtc/NoInfoPath_FileUploadCache",
*			"bucketName": "file_cache.noinfopath.net",
*			"folderName": "rm-efr2-test/",
*			"fileNameProperty": "name",
*			"primaryKey": "FileID",
*			"metadata": ["CreatedBy", "DateCreated", "FileID", "ModifiedBy", "ModifiedDate", "name", "size", "type"],
*			"ContentType": "application/json"
*		}
*		{
*			"storageType": "awss3",
*			"uri": "dtc/NoInfoPath_FileUploadCache",
*			"bucketName": "file-cache.noinfopath.net",
*			"folderName": "rm-efr2-test/",
*			"fileNameProperty": "name",
*			"primaryKey": "FileID",
*			"metadata": [
*				"CreatedBy",
*				"DateCreated",
*				"FileID",
*				"ModifiedBy",
*				"ModifiedDate",
*				"name",
*				"size",
*				"type"
*			],
*			"contentType": "application/json"
*		},
*		{
*			"mongoDbUrl": "mongodb://localhost:27017/efr2_dtc",
*			"uri": "dtc/log",
*			"collectionName": "logs",
*			"primaryKey": "_id"
*	    }
*	]
*	```
*/
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
	},
	storageTypes = {
		"mgfsb": "./no-mongo-crud-lo",
		"gcs": "./no-gcs-crud",
		"awss3": "./no-awss3-crud"
	},
	base64url = require("base64url");

/**
 *	## POST (Create) Handler
 *
 *	### Storage Types
 *
 *	Currently supported storage types are Amazon AWS (aws),
 *	Google Clound storage (gcs) and MongoDB GridFSBucket (mgfsb).
 */

function _isBucketStorage(storageType) {
	return !!storageTypes[storageType];
}

function _error(op, res, err) {
	//console.error(err.message.code);
	res.statusMessage = err.message.message;
	res.statusCode = err.message.code;
	res.end();
}

function _get(crud, schema, req, res, next) {
	// console.log("odata", req);


	crud.execute(schema, crud.operations.READ, null, req.odata)
		.then(function (results) {
			if (results.length || results["odata.metadata"]) {
				res.send(200, results);
			} else if (results.pipe) {
				res.setHeader('content-type', 'application/json');
				results.pipe(res).on('finish', function () {
					res.statusMessage = "OK";
					res.status = 200;
					res.end();
					results.db.close();
				});
			} else {
				res.send(404);
			}
		})
		.catch(_error.bind(null, "GET", res))
		.then(function () {
			next();
		});
}

function _getOne(crud, schema, req, res, next) {
	
	crud.execute(schema, crud.operations.READ, null, req.params.id)
		.then(function (results) {

			try{
				var stream, contentType = "application/json";

				if(!!results){
					if(!!results.stream) {
						stream = results.stream;
						contentType = results.metadata.ContentType || results.metadata.contentType;
					} else if(!!results.pipe){
						stream = results;
					}
				}

				if (!!stream) { //checks if results is a stream
					res.setHeader('content-type', contentType);

					stream.pipe(res).on('finish', function () {
						res.statusMessage = "OK";
						res.status = 200;
						res.end();
						if (!!results.db) results.db.close();

					}).on("error", function (err) {
						res.send(500, err);

					});
				} else if (results.length) {
					res.setHeader('content-type', contentType);
					res.send(200, results[0]);
				} else {
					res.send(404);
				}

			} catch(err) {
				res.statusMessage = err;
				res.status = 500;
				res.end();
				console.error(err);
			}
		})
		.catch(_error.bind(null, "GET", res))
		.then(function () {
			next();

		});

}

function _getOneMeta(crud, schema, req, res, next) {
	crud.execute(schema, crud.operations.READMETA, null, req.params.id)
		.then(function (results) {
			if (!!results.pipe) { //checks if results is a stream
				if (schema.contentType) res.setHeader('content-type', schema.contentType);

				results.pipe(res).on('finish', function () {
					res.statusMessage = "OK";
					res.status = 200;
					res.end();
					if (!!results.db) results.db.close();
				}).on("error", function (err) {
					_error("GET", res, err);
				});
			} else if (results.length) {
				res.send(200, results[0]);
			} else {
				res.send(404);
			}
		})
		.catch(_error.bind(null, "GET", res))
		.then(function () {
			next();
		});

}

function _putByPrimaryKey(crud, schema, req, res, next) {
	console.log("_putByPrimaryKey", crud.type);
	var routeID = req.params.id,
		filter = {},
		b = typeof (req.body) === "string" ? JSON.parse(req.body) : req.body;

	if (b._id) {
		delete b._id;
		req.body = JSON.stringify(b);
		//console.log("b", b);
	}

	filter[schema.primaryKey] = routeID;

	crud.execute(schema, crud.operations.UPDATE, req.body, filter)
		.then(function (results) {
			res.send(200, results);
		})
		.catch(_error.bind(null, "PUT", res))
		.then(function () {
			next();
		});

}

function _post(crud, schema, req, res, next) {
	var data = _isBucketStorage(schema.storageType) ? req : req.body;

	//console.log(req.body);
	console.log("POST", req.url, "crud.type", crud.type);
	//console.log("POST", req.headers);
	if (!!req.body[schema.primaryKey]) req.body._id = req.body[schema.primaryKey];

	crud.execute(schema, crud.operations.CREATE, data)
		.then(function (results) {
			console.log(results);
			res.statusMessage = "OK";
			res.statusCode = 200;
			res.end(results);
			//			res.send(200, results);
			console.log("post was successful");
		})
		.catch(_error.bind(null, "POST", res))
		.then(function () {
			next();
		});

}

function _delete(crud, schema, req, res, next) {
	crud.execute(schema, crud.operations.DELETE, null, req.params.id)
		.then(function (results) {
			res.send(200, results);
		})
		.catch(_error.bind(null, "DELETE", res))
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
			if (results.length > 0) {
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

function _getCurrentVersionNo(crud, schema) {
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
		.then(function (data) {
			var d = data.length > 0 ? data[0] : {
				ts: new Timestamp()
			};

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
	for (var c = 0; c < changeset.length; c++) {
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
		this.version = NoBSONTimestamp.toNumber(change.ts);
		this.operation = operations[change.op];
		this.changedPKID = record[schema.primaryKey];
		this.values = record;
	}

	var result = {
		namespace: schema.namespace.split(".")[0],
		changes: [],
		version: 0
	};

	for (var c = 0; c < changeContext.changeSet.length; c++) {
		var change = changeContext.changeSet[c],
			record = changeContext.changeSetRecords[c];

		if (record) {
			result.changes[c] = new NoChange(change, record);
			//console.log(result.changes[c]);
		}
	}

	return _getCurrentVersionNo(crud, schema)
		.then(function (version) {

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
	var secret = base64url.decode(config.auth0.secret),
		jwtCheck = jwt({
			secret: secret,
			audience: config.auth0.audience
		}),
		storageType = storageTypes[schema.storageType],
		crudProv = !!storageType ? require(storageType) : crudProvider;
		//pattern = new RegExp("^(\/" + schema.uri.replace("/", "\/") + "-metadata\/)(.*)");


	console.log("Configuring route ", schema.uri, "as Storage Type", storageType || "Mongo Collection");
	if(storageType) {
		//server.get(schema.uri + "-metadata", jwtCheck, _get.bind(null, crudProv, schema));
		server.get(schema.uri + "-metadata/:id", jwtCheck, _getOneMeta.bind(null, crudProv, schema));
	} else {
		server.get(schema.uri, jwtCheck, _get.bind(null, crudProv, schema));
	}
	server.get(schema.uri + "/:id", jwtCheck, _getOne.bind(null, crudProv, schema));
	server.put(schema.uri + "/:id", jwtCheck, _putByPrimaryKey.bind(null, crudProv, schema));
	server.patch(schema.uri + "/:id", jwtCheck, _putByPrimaryKey.bind(null, crudProv, schema));
	server.del(schema.uri + "/:id", jwtCheck, _delete.bind(null, crudProv, schema));
	server.post(schema.uri, jwtCheck, _post.bind(null, crudProv, schema));

	if (schema.versionUri) server.get(schema.versionUri, jwtCheck, _checkVersion.bind(null, crudProvider, schema));
	if (schema.changesUri) server.get(schema.changesUri + "/:version", jwtCheck, _getChanges.bind(null, crudProvider, schema));
}

module.exports = function (server, crudProvider, schemas) {
	schemas.forEach(_configRoute.bind(null, server, crudProvider));
};
