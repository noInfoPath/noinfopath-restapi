/*
 *	### Amazon Web Services - Simple Storage Service (AWS S3) Properties
 *
 *	|Name|Description|
 *	|----|-----------|
 *	|storageType|Always `awss3`|
 *	|uri|The URI that use to configure the route for the end-point.|
 *	|bucketName|The name of the bucket in S3 to store objects.|
 *	|folderName|The name of the folder under the GCS Bucket to store objects. Must always end wth a forward slash (/). If the root is desired set it to and empty string. Nested folders are supported.|
 *	|primaryKey|The property (column) that defined the collections primary key.|
 *	|fileNameProperty|Defines which metadata property is used as the file name for saving objects to a bucket.|
 *	|metadata|An array of property names that are extracted from an incoming object, and stored as metadata association with a bucket object.|
 *
 *	*Sample Configuration*
 *
 *	```json
 * {
 *	 	"storageType": "gcs",
 *	 	"uri": "gcs/NoInfoPath_FileUploadCache",
 *	 	"bucketName": "file_cache.noinfopath.net",
 *	 	"folderName": "rm-efr2-test/",
 *	 	"fileNameProperty": "name",
 *	 	"primaryKey": "FileID",
 *	 	"metadata": [
 *		 	"CreatedBy",
 *		 	"DateCreated",
 *		 	"FileID",
 *		 	"ModifiedBy",
 *		 	"ModifiedDate",
 *		 	"name",
 *		 	"size",
 *		 	"type"
 *	 	],
 *	 	"contentType": "application/json"
 * }
 *	```
 */

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



			s3.headObject(params, function(err, data){
				if(err) {
					reject(err);
				} else {
					file = s3.getObject(params);
					resolve({stream: file.createReadStream(), metadata: data});
				}
			});

		} catch (err) {
			reject(err);
		}
	});
}
CRUD[CRUD_OPERATIONS.READ] = _readDocument;

function _readDocumentMeta(payload, data, filter, db) {
	var schema = this;

	return new Promise(function (resolve, reject) {
		try {
			var S3 = require('aws-sdk/clients/s3'),
				config = require("./config"),
				s3 = new S3(config.amazonApis.s3),
				path = schema.folderName + filter.query[schema.primaryKey],
				url, params = {};

			params.Bucket = schema.bucketName;
			params.Key = path;


			s3.headObject(params, function(err, data){
				if(err) {
					reject(err);
				} else {
					resolve([data]);
				}
			});
		} catch (err) {
			reject(err);
		}
	});
}
CRUD[CRUD_OPERATIONS.READMETA] = _readDocumentMeta;

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
