[NoInfoPath Home](http://gitlab.imginconline.com/noinfopath/noinfopath/wikis/home) | [NoInfoPath REST API](home)

___

*@version 2.0.20*

Copyright (c) 2017 The NoInfoPath Group, LLC.

Licensed under the MIT License. (MIT)

___


### MongoDB Bucket Storage (GridFSBucket) Properties
======================================

|Name|Description|
|----|-----------|
|storageType|Always `mgfsb`|
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

