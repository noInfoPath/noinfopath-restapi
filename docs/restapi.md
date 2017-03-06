NoInfoPath REST API
===================
*@version 2.0.11*

Copyright (c) 2017 The NoInfoPath Group, LLC.

Licensed under the MIT License. (MIT)

___

Overview
--------
Exposes MongoDB, Google Cloud Storage, and AWS S3 via ODATA/CRUD HTTP
interface. Use JWT to secure communications.

Installation
------------
> npm install @noinfopath/noinfopath-restapi

Route Configuration
-------------------

> NOTE: NoInfoPath Configuration (@noinfopath/noinfopath-config) should be used in conjuction with the feature. The the noinfopath-config `readme.md` for more information.

The NoInfoPath route configuration files make it simple to create new REST End-Points for you application. The files contain all of the information require to establish
the end-points, define what type of backend storage system will be implmented by the end-points, along with any storage type specific configurations.

Typically you create a configuration file for each namespace that needs be to expose as a REST interface. A `namespace` is a route's URI prefix. For example given a
namespace name of `foo` and a collection named `bar`, the uri would be `/foo/bar`

When the configuration files are processed the HTTP URI's GET, POST, PUT, and DELETE are created. There are a few additional uri's created for Bucket storage.
Bucket type stores add two `-metadata` `GET` end-points. (e.g. `/foo/bar-metadata`, `/foo/bar-metadata/:id`)

#### Storage Types

The primary configuration property is `storageType`. It defines which CRUD (Create, Read, Update, and Delete) provider is used by a given end-point.

**Supported Storage Types**

|Name|Type|Value|Description|
|----|----|-----|-----------|
|MongoDB|Collection|mongo|This provider is used to expose a single MongoDB Collection (object store.)|
|MongoDB Bucket Storage|Bucket|mgfsb|This provider is used to expose MongoDB's large object storage known as GridFSBucket. Use this provider when you are storing object larger than 16KB.|
|Google Cloud Storage|Bucket|gcs|This provider is used to expose a Google Cloud Storage Bucket.|
|Amazon Web Services S3|Bucket|awss3|This provider is used to expose an AWS S3 Bucket.|

#### Example Route Configuration
```json
	{
		"storageType": "gcs",
		"uri": "dtc/NoInfoPath_FileUploadCache",
		"bucketName": "file_cache.noinfopath.net",
		"folderName": "rm-efr2-test/",
		"fileNameProperty": "name",
		"primaryKey": "FileID",
		"metadata": ["CreatedBy", "DateCreated", "FileID", "ModifiedBy", "ModifiedDate", "name", "size", "type"],
		"ContentType": "application/json"
	}
	{
		"storageType": "awss3",
		"uri": "dtc/NoInfoPath_FileUploadCache",
		"bucketName": "file-cache.noinfopath.net",
		"folderName": "rm-efr2-test/",
		"fileNameProperty": "name",
		"primaryKey": "FileID",
		"metadata": [
			"CreatedBy",
			"DateCreated",
			"FileID",
			"ModifiedBy",
			"ModifiedDate",
			"name",
			"size",
			"type"
		],
		"contentType": "application/json"
	},
	{
		"mongoDbUrl": "mongodb://localhost:27017/efr2_dtc",
		"uri": "dtc/log",
		"collectionName": "logs",
		"primaryKey": "_id"
    }
]
```


CRUD Provider Configuration
-----------------------------
A CRUD provider's configuration consist of required and optional configuration properties.
And, each may have properties specific to themselves. This section explains
how and when to use them.

### MongoDB Properties

|Name|Description|
|----|-----------|
|storageType|Always `mongo`|
|mongoDbUrl|A url that points to the mongodb server, and the database to connect to.|
|uri|The URI that use to configure the route for the end-point.|
|collectionName|The name of the collection within the database specified by the `mongoDbUrl`|
|primaryKey|The property (column) that defined the collections primary key.|

**Sample Configuration**

```json
{
	"storageType": "mongo",
	"mongoDbUrl": "mongodb://localhost:27017/efr2_dtc",
	"uri": "dtc/changes-metadata",
	"collectionName": "changes.files",
	"primaryKey": "_id"
}
```

### MongoDB Bucket Storage (GridFSBucket) Properties

|Name|Description|
|----|-----------|
|storageType|Always `mongo`|
|mongoDbUrl|A url that points to the mongodb server, and the database to connect to.|
|uri|The URI that use to configure the route for the end-point.|
|collectionName|The name of the collection within the database specified by the `mongoDbUrl`|
|primaryKey|The property (column) that defined the collections primary key.|
|fileNameProperty|Defines which metadata property is used as the file name for saving objects to a bucket.|
|metadata|An array of property names that are extracted from an incoming object, and stored as metadata association with a bucket object.|

*Sample Configuration*

```json
{
	"storageType": "mgfsb",
	"mongoDbUrl": "mongodb://localhost:27017/efr2_dtc",
	"uri": "dtc/changes",
	"collectionName": "changes",
	"primaryKey": "ChangeID",
	"fileNameProperty": "ChangeID",
	"metadata": [
		"ChangeID",
		"CreatedBy",
		"DateCreated",
		"ModifiedBy",
		"ModifiedDate",
		"namespace",
		"state",
		"timestamp",
		"transactionId",
		"userId"
	]
}
```

