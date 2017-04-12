/*
 * [NoInfoPath Home](http://gitlab.imginconline.com/noinfopath/noinfopath/wikis/home)
 *
 * ___
 *
 *	NoInfoPath REST API (noinfopath-restapi)
 *	===================
 *	*@version 2.0.27*
 *
 *	Copyright (c) 2017 The NoInfoPath Group, LLC.
 *
 *	Licensed under the MIT License. (MIT)
 *
 *	___
 *
 *	Overview
 *	--------
 *	Exposes MongoDB, Google Cloud Storage, and AWS S3 via ODATA/CRUD HTTP
 *	interface. Use JWT to secure communications.
 *
 *	Installation
 *	------------
 *	> npm install @noinfopath/noinfopath-restapi
 *
 *	Route Configuration
 *	-------------------
 *
 *	The NoInfoPath route configuration files make it simple to create new REST End-Points for your application. The files contain all of the information require to establish
 *	the end-points, define what type of backend storage system will be implmented by the end-points, along with any storage type specific configurations.
 *
 *	Typically you create a configuration file for each namespace that needs be to expose as a REST interface. A `namespace` is a route's URI prefix. For example given a
 *	namespace name of `foo` and a collection named `bar`, the uri would be `/foo/bar`
 *
 *	When the configuration files are processed the HTTP URI's GET, POST, PUT, and DELETE are created. There are a few additional uri's created for Bucket storage.
 *	Bucket type stores add two `-metadata` `GET` end-points. (e.g. `/foo/bar-metadata`, `/foo/bar-metadata/:id`)
 *
 *	#### Route configuration Files
 *
 *	Route configuration file can be found in the `no-schema` folder located on the root of the `noinfopath-restapi` project.
 *	There are two file types; the `*.json` files, and the `*.json.tmpl` file. The RESTAPI, upon startup looks for the `*.json`
 *	and loads them into memory. They are then used to configure the routes aautomatically.
 *
 *	> NOTE: The `*.json.tmpl` files are used by NoInfoPath Configuration (@noinfopath/noinfopath-config) to automate deployment to different deployment locations.
 *	> noinfopath-config will generate the `*.json` files from the `*.json.tmpl` files. See the noinfopath-config `readme.md` for more information.
 *
 *	#### Storage Types
 *
 *	The primary configuration property is `storageType`. It defines which CRUD (Create, Read, Update, and Delete) provider is used by a given end-point.
 *
 *	**Supported Storage Types**
 *
 *	|Name|Type|Value|Description|
 *	|----|----|-----|-----------|
 *	|MongoDB|Collection|mongo|This provider is used to expose a single MongoDB Collection (object store.)|
 *	|MongoDB Bucket Storage|Bucket|mgfsb|This provider is used to expose MongoDB's large object storage known as GridFSBucket. Use this provider when you are storing object larger than 16KB.|
 *	|Google Cloud Storage|Bucket|gcs|This provider is used to expose a Google Cloud Storage Bucket.|
 *	|Amazon Web Services S3|Bucket|awss3|This provider is used to expose an AWS S3 Bucket.|
 *
 *	Components
 *	----------
 *
 *	- [Amazon AWS S3 CRUD Provider](no-awss3-crud)
 *	- [Google Cloud Storage CRUD Provider](no-gcs-crud)
 *	- [MongoDB Collection CRUD Provider](no-mongo-crud)
 *	- [MongoDB Bucket CRUD Provider](no-mongo-crud-lo)
 *	- [NoInfoPath ODATA Parser](no-odata)
 */
var noLibs = require('@noinfopath/noinfopath-node-libraries'),
	config = require("./config"),
	restify = require("restify"),
	crud = require("./no-mongo-crud"),
	odataParser = require("./no-odata"),
	schemas = require("./no-schemas")(),
	noREST = require("./no-rest"),
	base64url = require("base64url"),
	fs = require('fs');

function corsHandler(req, res, next) {

	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
	res.setHeader('Access-Control-Allow-Headers', 'Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token,Authorization');
	res.setHeader('Access-Control-Allow-Methods', ['GET', 'PUT', 'DELETE', 'POST', 'OPTIONS']);
	res.setHeader('Access-Control-Expose-Headers', 'X-Api-Version, X-Request-Id, X-Response-Time');
	res.setHeader('Access-Control-Max-Age', '1000');
	return next();
}

function optionsRoute(req, res, next) {
	//console.warn("optionsRoute TODO: Make this more secure.");
	res.send(204);
	return next();
}


function startHTTPS() {
	if (config.server.port !== 443) {
		startHTTP();
		return;
	}

	var sslOptions = {
			certificate: fs.readFileSync('ssl/certificate.crt'),
			key: fs.readFileSync('ssl/private.key'),
			name: 'restapi.noinfopath.net',
		},
		server = restify.createServer(sslOptions);

	server.pre(function (request, response, next) {
		console.info(request.method, request.url); // (1)
		return next();
	});
	//console.log(config.cors);
	server.use(restify.CORS({
		origins: config.cors.whitelist, // defaults to ['*']
		credentials: true, // defaults to false
		// sets expose-headers
		methods: ['GET', 'PUT', 'DELETE', 'POST', 'OPTIONS']
	}));

	server.use(restify.fullResponse());

	server.use(restify.queryParser());

	server.use(restify.bodyParser());

	server.use(odataParser());

	noREST(server, crud, schemas);

	server.opts('/\.*/', corsHandler, optionsRoute);

	server.listen(config.server.port, config.server.address, function () {
		console.log('%s listening at %s using SSL', server.name, server.url);
	});

	server.on("error", function (request, response, route, error) {
		startHTTP();
	});

	server.on("after", function (request, response, route, error) {
		console.log(response.statusCode, route.spec.method, request.url, error || "");
	});
}


function startHTTP() {
	var server = restify.createServer();

	server.pre(function (request, response, next) {
		console.info(request.method, request.url); // (1)
		return next();
	});
	//console.log(config.cors);
	server.use(restify.CORS({
		origins: config.cors.whitelist, // defaults to ['*']
		credentials: true, // defaults to false
		// sets expose-headers
		methods: ['GET', 'PUT', 'DELETE', 'POST', 'OPTIONS']
	}));

	server.use(restify.fullResponse());

	server.use(restify.queryParser());

	server.use(restify.bodyParser({
		maxBodySize: 0,
		mapParams: true,
		mapFiles: false,
		overrideParams: false,
		multipartHandler: function (part, req) {
			req.mydata = req.mydata ? req.mydata : {};
			part.on('data', function (data) {
				/* do something with the multipart data */
				req.mydata[part.name] = data.toString();

			});
		},
		multipartFileHandler: function (part, req) {
			req.mydata = req.mydata ? req.mydata : {};

			if(!req.mydata[part.name]) req.mydata[part.name] = [];

			part.on('data', function (data) {
				req.mydata[part.name].push(data);
			});

			part.on('end', function () {

				req.mydata[part.name] = Buffer.concat(req.mydata[part.name]);
				//console.log(part);
			});
		},
		keepExtensions: false,
		multiples: true,
		hash: 'sha1'
	}));

	server.use(odataParser());

	noREST(server, crud, schemas);

	server.opts('/\.*/', corsHandler, optionsRoute);

	//console.log(config.server);
	server.listen(config.server.port, config.server.address, function () {
		console.log('%s listening at %s', server.name, server.url);
	});

	server.on("error", function (error) {
		console.error(error);
	});

	server.on("after", function (request, response, route, error) {
		console.log(response.statusCode, route.spec.method, request.url, error || "");
	});
}


console.log("Starting NoInfoPath RESTAPI (RESTAPI) @version 2.0.27");
console.log("Copyright (c) 2017 The NoInfoPath Group, LLC.");
console.log("Licensed under the MIT License. (MIT)");
console.log("");
console.log("Configuration in progress...");

noLibs.logging(config);


startHTTPS();
