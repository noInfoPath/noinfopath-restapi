/*
 *	[NoInfoPath Home](http://gitlab.imginconline.com/noinfopath/noinfopath/wikis/home)
 *
 *	Copyright (c) 2017 The NoInfoPath Group, LLC.
 *
 *	Licensed under the MIT License. (MIT)
 *
 *	___
 *
 *	[NoInfoPath REST API *@version 2.0.13*](home)
 *	=============================================
 *
 *	### Google Cloud Storage (GCS) Properties
 *
 *	|Name|Description|
 *	|----|-----------|
 *	|storageType|Always `gcs`|
 *	|uri|The URI that use to configure the route for the end-point.|
 *	|bucketName|The name of the bucket  S3 to store objects.|
 *	|folderName|The name of the folder under the S3 Bucket to store objects. Must always end wth a forward slash (/). If the root is desired set it to and empty string. Nested folders are supported.|
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
 *			 "name",
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
		var bucket = gcs.bucket(schema.bucketName),
			path = filter,
			file = bucket.file(schema.folderName + path);

		try {

			file.getMetadata(function (err, data) {


				if (err) {
					reject(err);
				} else {
					resolve({stream: file.createReadStream(), metadata: data});
				}

			});
		} catch(err) {
			reject(err);
		}


	});
}
CRUD[CRUD_OPERATIONS.READ] = _readDocument;

function _readDocumentMeta(payload, data, filter, db) {
	var schema = this;

	return new Promise(function (resolve, reject) {
		try {
			var bucket = gcs.bucket(schema.bucketName),
				path = schema.folderName + filter,
				file = bucket.file(path);

			file.getMetadata(function (err, metadata, apiResponse) {
				if (err) {
					reject(err);
				} else {
					resolve([metadata]);
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

		var bucket = gcs.bucket(schema.bucketName),
			path = schema.folderName + payload.metadata[schema.fileNameProperty],
			file = bucket.file(path);
		//d = JSON.stringify(data);
		//console.log(path);



		objStreamer(req.body).pipe(file.createWriteStream())
			.on('error', function (err) {
				console.error("Something went wrong.", err);
				reject(err);
			})
			.on('finish', function () {

				file.setMetadata(payload, function(err, apiResponse) {
					if(err) {
						reject(err);
					} else {
						resolve();
					}
				});


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
					payload.metadata["Content-Type"] = req.contentType();
				}

				if (data) {
					for (var i = 0; i < schema.metadata.length; i++) {
						var colName = schema.metadata[i],
							datum = data[colName];
						if (!!datum) payload.metadata[colName] = data[colName];
						if(colName === "type") payload.metadata["Content-Type"] = datum;
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
