var operations = {
	"i": "I",
	"u": "U",
	"d": "D"
};

function _get(crud, schema, req, res, next) {
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
			console.error(err);
			res.send(500, err);
		})
		.then(function () {
			next();
		});
}

function _getOne(crud, schema, req, res, next) {
	var filter = {};
	filter[schema.primaryKey] = req.params.id;

	crud.execute(schema, crud.operations.READ, null, filter)
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
			"mongoDbUrl": "mongodb://macbook:27017/local",
			//"uri": "NoInfoPath_AppStore/appConfigs",
			"collectionName": "oplog.rs",
			"primaryKey": "h",
			// "versionUri": "changes/version",
			// "changesUri": "changes"
		},
		mongoq = {
			query: {
				ns: schema.namespace
			},
			fields: {
				"v": 1
			},
			options: {
				limit: 1,
				sort: ["v"]
			}
		};

	crud.execute(checkSchema, crud.operations.READ, null, mongoq)
		.then(function (results) {
			if(results.length > 0) {
				var r = results[0];
				res.send(200, {
					namespace: clientNS,
					version: r.v
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

function _getChangeSet(crud, schema, req) {
	var clientNS = schema.namespace.split(".")[0],
		checkSchema = {
			"mongoDbUrl": "mongodb://macbook:27017/local",
			//"uri": "NoInfoPath_AppStore/appConfigs",
			"collectionName": "oplog.rs",
			"primaryKey": "h",
			// "versionUri": "changes/version",
			// "changesUri": "changes"
		},
		rx = new RegExp(clientNS),
		mongoq = {
			query: {
				"ns": {
					"$regex": clientNS
				},
				"v": {
					"$gt": Number(req.params.version)
				}
			},
			fields: null,
			options: null
		};

	return crud.execute(checkSchema, crud.operations.READ, null, mongoq)
		.then(function (data) {
			return data;
		})
		.catch(function (err) {
			console.error(err);
		});

}

function _getChangeSetRecords(crud, schema, changeset) {
	var clientNS = schema.namespace.split(".")[0],
		mongoq = {
			query: {},
			fields: null,
			options: null
		},
		changeIDs = [];
	for(var c = 0; c < changeset.length; c++) {
		var change = changeset[c];
		console.log(changeset);

		changeIDs[c] = change.o._id;
	}

	mongoq.query[schema.primaryKey] = {
		"$in": changeIDs
	};

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

function _createChangeSetResults(schema, changeContext) {
	function NoChange(change, record) {
		console.log("change", change, "record", record);
		var nsParts = change.ns.split(".");

		this.tableName = nsParts[1];
		this.version = change.v;
		this.operation = operations[change.o];
		this.changedPKID = change._id;
		this.values = record;
			// 	"tableName": "Cooperators",
			//   "version": 112027,
			//   "operation": "U",
			//   "changedPKID": "b6b6a7f5-7484-4566-ad51-fb8d6e0109a3",
			//   "values": {
			//     "CooperatorID": "b6b6a7f5-7484-4566-ad51-fb8d6e0109a3",
			//     "CooperatorName": "AgriCare test asd",
			//     "Account": "FCVDT14",
			//     "ContractReference": "This is a test edit",
			//     "Inactive": false,
			//     "Notes": "",
			//     "DateCreated": "2016-04-05T05:31:50.507",
			//     "ModifiedDate": "2016-08-12T20:47:15.153",
			//     "CreatedBy": "38a5fb33-8dc4-4d48-8d39-fad946230081",
			//     "ModifiedBy": "a715fb8c-d0af-40e1-acb6-7c20abf4e5ed"
			//   }
			//
			// {
			// 	"ts": Timestamp(1471053053, 1),
			// 	"h": NumberLong("-3287484221890838648"),
			// 	"v": 2,
			// 	"op": "i",
			// 	"ns": "NoInfoPath_AppStore.appConfigs",
			// 	"o": {
			// 		"_id": "45e6e73c-1343-43ac-a50d-89b83493cb64",
			// 		"shortName": "noinfopath",
			// 		"defaultScreen": "testapp.dashboard",
			// 		"noScreens": {},
			// 		"noRoutes": [{
			// 			"name": "noinfopath",
			// 			"url": "/noinfopath",
			// 			"templateUrl": "default.html",
			// 			"abstract": true
			// 		}, {
			// 			"name": "noinfopath.app",
			// 			"url": "/app",
			// 			"templateUrl": "app/index.html",
			// 			"abstract": true
			// 		}, {
			// 			"name": "noinfopath.app.designer",
			// 			"url": "/design",
			// 			"templateUrl": "app/designer/index.html"
			// 		}, {
			// 			"name": "noinfopath.app.init",
			// 			"url": "/init",
			// 			"templateUrl": "app/init/index.html"
			// 		}, {
			// 			"name": "noinfopath.dashboard",
			// 			"url": "/dashboard",
			// 			"templateUrl": "dashboard/index.html",
			// 			"controller": "dashboardController"
			// 		}, {
			// 			"name": "noinfopath.form",
			// 			"url": "/form",
			// 			"templateUrl": "form/index.html",
			// 			"abstract": true
			// 		}, {
			// 			"name": "noinfopath.form.designer",
			// 			"url": "/designer",
			// 			"templateUrl": "form/form-designer/form.designer.html",
			// 			"controller": "formDesignerController"
			// 		}, {
			// 			"name": "noinfopath.form.init",
			// 			"url": "/init",
			// 			"templateUrl": "form/form-init/form-init.html",
			// 			"controller": "formInitController"
			// 		}, {
			// 			"name": "noinfopath.form.viewer",
			// 			"url": "/viewer",
			// 			"templateUrl": "form/form-init/form.viewer.html",
			// 			"controller": "formViewerController"
			// 		}],
			// 		"CreatedBy": "2a1e4ce8-22de-4642-acda-e32ce81a76b9",
			// 		"noDataSources": {},
			// 		"DateCreated": "2016-08-13T01:50:41.4141",
			// 		"ModifiedDate": "2016-08-13T01:50:41.4141",
			// 		"ModifiedBy": "2a1e4ce8-22de-4642-acda-e32ce81a76b9",
			// 		"ID": "45e6e73c-1343-43ac-a50d-89b83493cb64"
			// 	}
			// }
	}

	var result = {
		namespace: schema.namespace.split(".")[0],
		changes: [],
		version: 0
	};

	for(var c = 0; c < changeContext.changeSet.length; c++) {
		var change = changeContext.changeSet[c],
			record = changeContext.changeSetRecords[c];

		result.changes[c] = new NoChange(change, record);
	}
	return Promise.resolve(result);
}

function _getChanges(crud, schema, req, res, next) {
	_getChangeSet(crud, schema, req)
		.then(_getChangeSetRecords.bind(null, crud, schema))
		.then(_createChangeSetResults.bind(null, schema))
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
	console.log("Configuring route ", schema.uri);

	server.get(schema.uri, _get.bind(null, crudProvider, schema));
	server.get(schema.uri + "/:id", _getOne.bind(null, crudProvider, schema));
	server.put(schema.uri + "/:id", _putByPrimaryKey.bind(null, crudProvider, schema));
	server.del(schema.uri + "/:id", _delete.bind(null, crudProvider, schema));
	server.post(schema.uri, _post.bind(null, crudProvider, schema));

	if(schema.versionUri) server.get(schema.versionUri, _checkVersion.bind(null, crudProvider, schema));
	if(schema.changesUri) server.get(schema.changesUri + "/:version", _getChanges.bind(null, crudProvider, schema));
}

module.exports = function (server, crudProvider, schemas) {
	schemas.forEach(_configRoute.bind(null, server, crudProvider));
};
