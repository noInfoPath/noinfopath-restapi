[NoInfoPath Home](http://gitlab.imginconline.com/noinfopath/noinfopath/wikis/home)

Copyright (c) 2017 The NoInfoPath Group, LLC.

Licensed under the MIT License. (MIT)

___

[NoInfoPath REST API *@version 2.0.13*](home)
=============================================

Route Configuration
-------------------

> NOTE: NoInfoPath Configuration (@noinfopath/noinfopath-config) should be used in conjuction with the feature. The the noinfopath-config `readme.md` for more information.

The NoInfoPath route configuration files make it simple to create new REST End-Points for your application. The files contain all of the information require to establish
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


## POST (Create) Handler

### Storage Types

Currently supported storage types are Amazon AWS (aws),
Google Clound storage (gcs) and MongoDB GridFSBucket (mgfsb).

