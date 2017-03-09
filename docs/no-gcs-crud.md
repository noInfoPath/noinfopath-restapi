[NoInfoPath Home](http://gitlab.imginconline.com/noinfopath/noinfopath/wikis/home)

Copyright (c) 2017 The NoInfoPath Group, LLC.

Licensed under the MIT License. (MIT)

___

[NoInfoPath REST API *@version 2.0.13*](home)
=============================================

### Google Cloud Storage (GCS) Properties

|Name|Description|
|----|-----------|
|storageType|Always `gcs`|
|uri|The URI that use to configure the route for the end-point.|
|bucketName|The name of the bucket  S3 to store objects.|
|folderName|The name of the folder under the S3 Bucket to store objects. Must always end wth a forward slash (/). If the root is desired set it to and empty string. Nested folders are supported.|
|primaryKey|The property (column) that defined the collections primary key.|
|fileNameProperty|Defines which metadata property is used as the file name for saving objects to a bucket.|
|metadata|An array of property names that are extracted from an incoming object, and stored as metadata association with a bucket object.|

*Sample Configuration*

```json
{
 	"storageType": "gcs",
 	"uri": "gcs/NoInfoPath_FileUploadCache",
 	"bucketName": "file_cache.noinfopath.net",
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
}
```

