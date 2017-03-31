[NoInfoPath Home](http://gitlab.imginconline.com/noinfopath/noinfopath/wikis/home)

___

NoInfoPath REST API (noinfopath-restapi)
===================
*@version 2.0.23*

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

The NoInfoPath route configuration files make it simple to create new REST End-Points for your application. The files contain all of the information require to establish
the end-points, define what type of backend storage system will be implmented by the end-points, along with any storage type specific configurations.

Typically you create a configuration file for each namespace that needs be to expose as a REST interface. A `namespace` is a route's URI prefix. For example given a
namespace name of `foo` and a collection named `bar`, the uri would be `/foo/bar`

When the configuration files are processed the HTTP URI's GET, POST, PUT, and DELETE are created. There are a few additional uri's created for Bucket storage.
Bucket type stores add two `-metadata` `GET` end-points. (e.g. `/foo/bar-metadata`, `/foo/bar-metadata/:id`)

#### Route configuration Files

Route configuration file can be found in the `no-schema` folder located on the root of the `noinfopath-restapi` project.
There are two file types; the `*.json` files, and the `*.json.tmpl` file. The RESTAPI, upon startup looks for the `*.json`
and loads them into memory. They are then used to configure the routes aautomatically.

> NOTE: The `*.json.tmpl` files are used by NoInfoPath Configuration (@noinfopath/noinfopath-config) to automate deployment to different deployment locations.
> noinfopath-config will generate the `*.json` files from the `*.json.tmpl` files. See the noinfopath-config `readme.md` for more information.

#### Storage Types

The primary configuration property is `storageType`. It defines which CRUD (Create, Read, Update, and Delete) provider is used by a given end-point.

**Supported Storage Types**

|Name|Type|Value|Description|
|----|----|-----|-----------|
|MongoDB|Collection|mongo|This provider is used to expose a single MongoDB Collection (object store.)|
|MongoDB Bucket Storage|Bucket|mgfsb|This provider is used to expose MongoDB's large object storage known as GridFSBucket. Use this provider when you are storing object larger than 16KB.|
|Google Cloud Storage|Bucket|gcs|This provider is used to expose a Google Cloud Storage Bucket.|
|Amazon Web Services S3|Bucket|awss3|This provider is used to expose an AWS S3 Bucket.|

Components
----------

- [Amazon AWS S3 CRUD Provider](no-awss3-crud)
- [Google Cloud Storage CRUD Provider](no-gcs-crud)
- [MongoDB Collection CRUD Provider](no-mongo-crud)
- [MongoDB Bucket CRUD Provider](no-mongo-crud-lo)
- [NoInfoPath ODATA Parser](no-odata)

