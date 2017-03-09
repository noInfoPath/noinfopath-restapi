[NoInfoPath Home](http://gitlab.imginconline.com/noinfopath/noinfopath/wikis/home)

Copyright (c) 2017 The NoInfoPath Group, LLC.

Licensed under the MIT License. (MIT)

___

[NoInfoPath REST API *@version 2.0.13*](home)
=============================================

## Amazon Web Services - Simple Storage Service (AWS S3) Properties

|Name|Description|
|----|-----------|
|storageType|Always `awss3`|
|uri|The URI that use to configure the route for the end-point.|
|bucketName|The name of the bucket in S3 to store objects.|
|folderName|The name of the folder under the GCS Bucket to store objects. Must always end wth a forward slash (/). If the root is desired set it to and empty string. Nested folders are supported.|
|primaryKey|The property (column) that defined the collections primary key.|
|fileNameProperty|Defines which metadata property is used as the file name for saving objects to a bucket.|
|metadata|An array of property names that are extracted from an incoming object, and stored as metadata association with a bucket object.|

*Sample Configuration*

```json
{
 	"storageType": "awss3",
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

