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
		try {
			var S3 = require('aws-sdk/clients/s3'),
				config = require("./config"),
				s3 = new S3(config.amazonApis.s3),
				path = schema.folderName + filter.query[schema.primaryKey],
				file, url, params = {};

			params.Bucket = schema.bucketName;
			params.Key = path;

			file = s3.getObject(params);

			resolve(file.createReadStream());

		} catch (err) {
			reject(err);
		}
	});
}
CRUD[CRUD_OPERATIONS.READ] = _readDocument;

function _insertDocument(payload, req, filter) {
	var schema = this;
	//console.log("_insertDocument", schema.primaryKey, data[schema.primaryKey], schema.largeObjectHandler.fileName, data[schema.largeObjectHandler.fileName]);
	return new Promise(function (resolve, reject) {

		try {
			var S3 = require('aws-sdk/clients/s3'),
				config = require("./config"),
				s3 = new S3(config.amazonApis.s3),
				path = schema.folderName + payload.Metadata[schema.fileNameProperty],
				file, url, params = {};


			params.Bucket = schema.bucketName;
			params.Key = path;
			params.Metadata = payload.MetaData;
			params.Body = JSON.stringify(req.body);

			file = s3.putObject(params, function (err, data) {
				if (!!err) {
					reject(err);
				} else {
					console.log(data);
					resolve();
				}
			});

		} catch (err) {
			reject(err);
		}

	});

}
CRUD[CRUD_OPERATIONS.CREATE] = _insertDocument;

function _updateDocument(collection, data, filter, db) {
	return Promise.reject("PUT/PATCH/MERGE are not support by the Google Cloud Storage Provider.");
}
CRUD[CRUD_OPERATIONS.UPDATE] = _updateDocument;

function _deleteDocument(payload, data, filter, db) {
	var schema = this;

	return new Promise(function (resolve, reject) {
		try {
			var S3 = require('aws-sdk/clients/s3'),
				config = require("./config"),
				s3 = new S3(config.amazonApis.s3),
				path = schema.folderName + filter,
				file, url, params = {};

			params.Bucket = schema.bucketName;
			params.Key = path;

			s3.deleteObject(params, function (err, data) {
				if (!!err) {
					reject(err);
				} else {
					console.log(data);
					resolve();
				}
			});


		} catch (err) {
			reject(err);
		}
	});
}
CRUD[CRUD_OPERATIONS.DELETE] = _deleteDocument;

function S3Connection(schema, type, data, filter) {
	var _db;

	function executeTransaction(type, data, filter, payload) {
		//console.log(arguments);
		console.log("executeTransaction", type);

		return CRUD[type].call(this, payload, data, filter);
	}

	function resolveMetadata(schema, req) {
		return new Promise(function (resolve, reject) {
			try {
				var payload = {
						Bucket: schema.bucketNane,
						Metadata: {

						}
					},
					data;

				if (req) {
					data = req.body;
				}

				if (data) {
					for (var i = 0; i < schema.metadata.length; i++) {
						var colName = schema.metadata[i],
							datum = data[colName];
						if (!!datum) payload.Metadata[colName] = data[colName];
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

			resolveMetadata(schema, data)
				.then(executeTransaction.bind(schema, type, data, filter))
				.then(resolve)
				.catch(function (err) {
					reject({
						source: "awss3",
						message: err
					});
				});
		});

	};

}

function beginS3Transaction(schema, type, data, filter) {
	var mc = new S3Connection(schema, type, data, filter);

	return mc.run();
}

module.exports = {
	type: "awss3",
	execute: beginS3Transaction,
	operations: CRUD_OPERATIONS
};
