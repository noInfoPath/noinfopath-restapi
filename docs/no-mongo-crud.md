[NoInfoPath Home](http://gitlab.imginconline.com/noinfopath/noinfopath/wikis/home) | [NoInfoPath REST API](home)

___

*@version 2.0.20*

Copyright (c) 2017 The NoInfoPath Group, LLC.

Licensed under the MIT License. (MIT)

___

[NoInfoPath REST API *@version 2.0.13*](home)
=============================================

MongoDB CRUD Provider Configuration
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

