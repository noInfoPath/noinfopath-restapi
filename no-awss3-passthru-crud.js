/*
 *	[NoInfoPath Home](http://gitlab.imginconline.com/noinfopath/noinfopath/wikis/home) | [NoInfoPath REST API](home)
 *
 *	___
 *
 *	*@version 2.0.20*
 *
 *	Copyright (c) 2017 The NoInfoPath Group, LLC.
 *
 *	Licensed under the MIT License. (MIT)
 *
 *	___
 *
 *	Amazon Web Services - Simple Storage Service (AWS S3)
 *	=====================================================
 *
 *	### Setting up AWS S3
 *
 *	To setup AWS S3 for use with the NoInfoPath RESTAPI a private bucket needs
 *	to be create with a fully qualified host name. (i.e. file-cache.noinfopath.net)
 *	Optionally, you can create subfolders to further organize your file cache.
 *
 *	### Obtain an S3 ID & Secret
 *
 *	AWS recommends that you do not use root keys and secrets. Instead use IAM
 *	to create a group that has permissions to fully manage S3.  Then create a
 *	user and add it to that group. Then create an access key, and secret for that
 *	user.
 *
 *	### Add the Access Key & Secret to the Gruntfile
 *
 *	Add the access key and secret to the grunt file in options values property
 *	of the noinfopath_config tasks as required.
 *
 *	> NOTE: This not a secure way to handle this, because the keys are in an open source
 *	>		location. In a future release these values will be expected to exist
 *	>		in a secure location and at runtime by the RESTAPI.
 *
 *	### Add `amazonApis.s3` node to the config.json.tmpl
 *
 *	```json
 *		 {
 *			 "amazonApis": {
 *				 "s3": {
 *					 "apiVersion": "2006-03-01",
 *					 "region": "us-east-1",
 *					 "signatureVersion": "v4",
 *					 "credentials": {
 *						 "accessKeyId": "~AWS_S3_ID~",
 *						 "secretAccessKey": "~AWS_S3_SECRET~"
 *					 }
 *				 }
 *			 }
 *		 }
 *	```
 *
 *	### NoInfoPath S3 Configuration Properties
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
 *	 	"storageType": "awss3",
 *	 	"uri": "aws/NoInfoPath_FileUploadCache",
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
				path = schema.folderName + filter,
				file, url, params = {};

			params.Bucket = schema.bucketName;
			params.Key = path;

			var r = s3.headObject(params, function(err, data){
				if(err) {
					reject(err);
				} else {
					file = s3.getObject(params);
					s3.addExpect100Continue(file);
					resolve({file: file, stream: file.createReadStream(), metadata: data});
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
				path = schema.folderName + filter,
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
	//console.log(req.mydata);
	//console.log("_insertDocument", schema.primaryKey, data[schema.primaryKey], schema.largeObjectHandler.fileName, data[schema.largeObjectHandler.fileName]);
	return new Promise(function (resolve, reject) {
		function _url(folder, file) {
			var fileName = file.DocumentID + "." + file.ext,
				r = folder + fileName;
			return r;
		}

		try {
			var S3 = require('aws-sdk/clients/s3'),
				config = require("./config"),
				s3 = new S3(config.amazonApis.s3),
				path = _url(schema.folderName, req.mydata),
				file, url, params = {};

			params.Bucket = schema.bucketName;
			params.Key = path;
			params.ContentType = req.mydata.type;

			//console.log(config.amazonApis.s3, schema, path, params);
			//params.Metadata = payload.MetaData;
			//console.log(req.mydata.file.toString());
			params.Body = req.mydata.file;

			//console.log(params);

			file = s3.putObject(params, function (err, data) {
				if (!!err) {
					console.error("_insertDocument", err);
					reject(err.code);
				} else {
					//console.log(data);
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
					//console.log(data);
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
		//console.log("executeTransaction", type);

		return CRUD[type].call(this, payload, data, filter);
	}

	function resolveMetadata(schema, req) {

		return new Promise(function (resolve, reject) {
			try {
				var payload = {
						Bucket: schema.bucketName
					};

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
	type: "awss3-passthru",
	execute: beginS3Transaction,
	operations: CRUD_OPERATIONS
};
