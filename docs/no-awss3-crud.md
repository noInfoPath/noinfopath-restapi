[NoInfoPath Home](http://gitlab.imginconline.com/noinfopath/noinfopath/wikis/home) | [NoInfoPath REST API](home)

___

*@version 2.0.20*

Copyright (c) 2017 The NoInfoPath Group, LLC.

Licensed under the MIT License. (MIT)

___

Amazon Web Services - Simple Storage Service (AWS S3)
=====================================================

### Setting up AWS S3

To setup AWS S3 for use with the NoInfoPath RESTAPI a private bucket needs
to be create with a fully qualified host name. (i.e. file-cache.noinfopath.net)
Optionally, you can create subfolders to further organize your file cache.

### Obtain an S3 ID & Secret

AWS recommends that you do not use root keys and secrets. Instead use IAM
to create a group that has permissions to fully manage S3.  Then create a
user and add it to that group. Then create an access key, and secret for that
user.

### Add the Access Key & Secret to the Gruntfile

Add the access key and secret to the grunt file in options values property
of the noinfopath_config tasks as required.

> NOTE: This not a secure way to handle this, because the keys are in an open source
>		location. In a future release these values will be expected to exist
>		in a secure location and at runtime by the RESTAPI.

### Add `amazonApis.s3` node to the config.json.tmpl

```json
	 {
		 "amazonApis": {
			 "s3": {
				 "apiVersion": "2006-03-01",
				 "region": "us-east-1",
				 "signatureVersion": "v4",
				 "credentials": {
					 "accessKeyId": "~AWS_S3_ID~",
					 "secretAccessKey": "~AWS_S3_SECRET~"
				 }
			 }
		 }
	 }
```

### NoInfoPath S3 Configuration Properties

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
 	"uri": "aws/NoInfoPath_FileUploadCache",
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

