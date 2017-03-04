var config = require("./config"),
	gcs = require('@google-cloud/storage')({
		projectId: config.googleApis.gcs.projectId,
		keyFilename: config.googleApis.gcs.keyFilename
	}),
	objStreamer = require('./object-streamer'),
	CRUD = {},
	CRUD_OPERATIONS = {
		"CREATE": "create",
		"READ": "read",
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

function _readDocument(payload, req, filter) {
	var schema = this;

	return new Promise(function (resolve, reject) {
		var bucket = gcs.bucket(schema.bucketName),
			path = schema.folderName + filter.query[schema.primaryKey],
			file = bucket.file(path);

		// file.getMetadata().then(function (data) {
		// 	var metadata = data[0];
		// 	var apiResponse = data[1];
		//
		// 	console.log(data);
		//
		// });
		resolve(file.createReadStream());


	});
}
CRUD[CRUD_OPERATIONS.READ] = _readDocument;

function _insertDocument(payload, req, filter) {
	var schema = this;
	//console.log("_insertDocument", schema.primaryKey, data[schema.primaryKey], schema.largeObjectHandler.fileName, data[schema.largeObjectHandler.fileName]);
	return new Promise(function (resolve, reject) {

		var bucket = gcs.bucket(schema.bucketName),
			path = schema.folderName + payload.metadata.metadata[schema.fileNameProperty],
			file = bucket.file(path);
		//d = JSON.stringify(data);
		console.log(path);

		objStreamer(req.body).pipe(file.createWriteStream())
			.on('error', function (err) {
				console.error("Something went wrong.", err);
				reject(err);
			})
			.on('finish', function () {
				console.log("It worked!");
				resolve();
			});

	});

}
CRUD[CRUD_OPERATIONS.CREATE] = _insertDocument;

function _updateDocument(collection, data, filter, db) {
	return Promise.reject("PUT/PATCH/MERGE are not support by the Google Cloud Storage Provider.");
}
CRUD[CRUD_OPERATIONS.UPDATE] = _updateDocument;

function _deleteDocument(payload, data, filter, db) {
	var schema = this;
	//remember to close

	console.log("_deleteDocument", filter);
	var bucket = gcs.bucket(schema.bucketName),
		path = schema.folderName + filter,
		file = bucket.file(path);

	return file.delete()
		.then(function () {
			console.log("delete successful");
		});

}
CRUD[CRUD_OPERATIONS.DELETE] = _deleteDocument;

function GCSConnection(schema, type, data, filter) {
	var _db;

	function executeTransaction(type, data, filter, payload) {
		//console.log(arguments);
		console.log("executeTransaction on Grid Store", type);

		return CRUD[type].call(this, payload, data, filter);
	}

	function resolveMetadata(collectionName, schema, req) {

		return new Promise(function (resolve, reject) {
			try {
				var payload = {
						metadata: {
							metadata: {}
						}
					},
					data;

				if (req) {
					data = req.body;
					payload.metadata.contentType = req.contentType();
				}

				if (data) {
					for (var i = 0; i < schema.metadata.length; i++) {
						var colName = schema.metadata[i],
							datum = data[colName];
						if (!!datum) payload.metadata.metadata[colName] = data[colName];
					}
				}

				resolve(payload);
			} catch (err) {
				reject(err);
			}
		});

	}

	this.run = function () {
		return new Promise(function (resolve, reject) {

			resolveMetadata(schema.collectionName, schema, data)
				.then(executeTransaction.bind(schema, type, data, filter))
				.then(resolve)
				.catch(function (err) {
					reject({
						source: "gcs",
						message: err
					});
				});
		});

	};

}

function beginGCSTransaction(schema, type, data, filter) {
	var mc = new GCSConnection(schema, type, data, filter);

	return mc.run();
}

module.exports = {
	type: "gcs",
	execute: beginGCSTransaction,
	operations: CRUD_OPERATIONS
};
