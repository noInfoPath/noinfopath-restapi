/*
 *	### MongoDB Bucket Storage (GridFSBucket) Properties
 *
 *	|Name|Description|
 *	|----|-----------|
 *	|storageType|Always `mongo`|
 *	|mongoDbUrl|A url that points to the mongodb server, and the database to connect to.|
 *	|uri|The URI that use to configure the route for the end-point.|
 *	|collectionName|The name of the collection within the database specified by the `mongoDbUrl`|
 *	|primaryKey|The property (column) that defined the collections primary key.|
 *	|fileNameProperty|Defines which metadata property is used as the file name for saving objects to a bucket.|
 *	|metadata|An array of property names that are extracted from an incoming object, and stored as metadata association with a bucket object.|
 *
 *	*Sample Configuration*
 *
 *	```json
 *	{
 *		"storageType": "mgfsb",
 *		"mongoDbUrl": "mongodb://localhost:27017/efr2_dtc",
 *		"uri": "dtc/changes",
 *		"collectionName": "changes",
 *		"primaryKey": "ChangeID",
 *		"fileNameProperty": "ChangeID",
 *		"metadata": [
 *			"ChangeID",
 *			"CreatedBy",
 *			"DateCreated",
 *			"ModifiedBy",
 *			"ModifiedDate",
 *			"namespace",
 *			"state",
 *			"timestamp",
 *			"transactionId",
 *			"userId"
 *		]
 *	}
 *	```
 */
var config = require("./config"),
	MongoClient = require('mongodb').MongoClient,
	GridStore = require('mongodb').GridStore,
	GridFSBucket = require('mongodb').GridFSBucket,
	CRUD = {},
	CRUD_OPERATIONS = {
		"CREATE": "create",
		"READ": "read",
		"READMETA": "readmeta",
		"UPDATE": "update",
		"DELETE": "delete",
		"COUNT": "count"
	};

function _resolveData(indata) {
	var d = indata;
	if (typeof (d) === "string") {
		d = JSON.parse(d);
	}
	return d;
}

function _countDocuments(collection, data, filter) {

	return collection.count(filter.query)
		.then(function (data) {
			//console.log(data);
			return data;
		});
}
CRUD[CRUD_OPERATIONS.COUNT] = _countDocuments;

function _readDocument(payload, data, filter, db) {
	var schema = this;
	console.log("_readDocument", filter);
	return new Promise(function (resolve, reject) {

		var pkid = filter.query[schema.primaryKey],
			bucket = new GridFSBucket(db, {
				bucketName: schema.collectionName
			}),
			downloadStream = bucket.openDownloadStream(pkid);

		downloadStream.db = db;

		resolve(downloadStream);
	});
}
CRUD[CRUD_OPERATIONS.READ] = _readDocument;

function _readDocumentMeta(payload, data, filter, db) {
	try {
		// console.log("_readDocumentMeta", colName, payload, filter, collection);

		var schema = this,
			colName = schema.collectionName + ".files",
			collection = db.collection(colName);


		return collection.find(filter.query, filter.fields, filter.options).toArray()
			.then(function (data) {
				var retval = {};
				retval.value = data;
				if (filter.getTotal) {
					return _countDocuments(collection, data, filter)
						.then(function (total) {
							retval["odata.metadata"] = true;
							retval["odata.count"] = total;


							return retval;
						});
				} else {
					return data;
				}
			})
			.catch(function (err) {
				console.error("CRUD_OPERATIONS.READ", err);
			});
	} catch (err) {
		console.error(err);
	}

}
CRUD[CRUD_OPERATIONS.READMETA] = _readDocumentMeta;


function _insertDocument(payload, data, filter, db) {
	var schema = this;
	console.log("_insertDocument", schema.primaryKey, data[schema.primaryKey], schema.fileNameProperty, data[schema.fileNameProperty]);
	return new Promise(function (resolve, reject) {
		var d = JSON.stringify(data),
			bucket = new GridFSBucket(db, {
				bucketName: schema.collectionName
			}); // data.ChangeID, "f" + data.ChangeID + ".json", "w", payload

		var uploadStream = bucket.openUploadStreamWithId(data[schema.primaryKey], data[schema.fileNameProperty] + ".json", payload);

		uploadStream.once("finish", function (err) {
			db.close();
			resolve();
		});


		uploadStream.once("error", function (err) {
			db.close();
			console.error(err);
			reject(err);
		});

		uploadStream.write(d, function (err) {
			if (err) {
				console.error(err);
			} else {
				console.log("working in write");
			}
		});

		uploadStream.end();

	});

}
CRUD[CRUD_OPERATIONS.CREATE] = _insertDocument;

function _updateDocument(collection, data, filter, db) {
	//console.log("XXXXXXX", filter);
	return Promise.resolve();
}

CRUD[CRUD_OPERATIONS.UPDATE] = _updateDocument;

function _deleteDocument(payload, data, filter, db) {
	var schema = this;
	//remember to close

	console.log("_deleteDocument", filter);
	var pkid = filter,
		bucket = new GridFSBucket(db, {
			bucketName: schema.collectionName
		});

	return bucket.delete(pkid)
		.then(function () {
			db.close();
		});

}
CRUD[CRUD_OPERATIONS.DELETE] = _deleteDocument;

function MongoConnection(schema, type, data, filter) {
	var _db;

	function executeTransaction(type, data, filter, payload) {
		//console.log(arguments);
		try {
			console.log("executeTransaction on Grid Store", type);

			return CRUD[type].call(this, payload, data, filter, _db);
		} catch (err) {
			_error(err);
		}
	}

	function resolveGridStoreMetadata(collectionName, schema, data, db) {

		return new Promise(function (resolve, reject) {

			console.info("Resolving GridStore", collectionName);
			_db = db;


			var payload = {
				"contentType": "application/json",
				"metadata": {}
			};

			if (data) {
				for (var i = 0; i < schema.metadata.length; i++) {
					var colName = schema.metadata[i],
						datum = data[colName];

					if (datum) payload.metadata[colName] = datum;
				}
			}

			resolve(payload);

		});

	}

	function closeConnection() {
		if (_db)
			_db.close();
		//console.info("Connection closed ", schema.collectionName);
	}

	this.run = function () {
		return new Promise(function (resolve, reject) {

			MongoClient.connect(schema.mongoDbUrl)
				.then(resolveGridStoreMetadata.bind(schema, schema.collectionName, schema, data))
				.then(executeTransaction.bind(schema, type, data, filter))
				.then(resolve)
				.catch(function (err) {
					var m = err.errmsg || JSON.stringify(err);
					//console.error(m);
					reject({
						source: "MongoDB",
						message: m
					});
				});
		});

	};

}

function beginMongoTransaction(schema, type, data, filter) {
	var mc = new MongoConnection(schema, type, data, filter);

	return mc.run();
}

module.exports = {
	type: "CRUD-LO",
	execute: beginMongoTransaction,
	operations: CRUD_OPERATIONS
};
