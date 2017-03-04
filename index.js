var noLibs = require('@noinfopath/noinfopath-node-libraries'),
    config = require("./config"),
    restify = require("restify"),
    crud = require("./no-mongo-crud"),
    odataParser = require("./no-odata"),
    schemas = require("./no-schemas")(),
    noREST = require("./no-rest"),
    server = restify.createServer(),
    base64url = require("base64url")

function corsHandler(req, res, next) {

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Headers', 'Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token,Authorization');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Expose-Headers', 'X-Api-Version, X-Request-Id, X-Response-Time');
    res.setHeader('Access-Control-Max-Age', '1000');
    return next();
}

function optionsRoute(req, res, next) {
    console.warn("optionsRoute TODO: Make this more secure.");
    res.send(204);
    return next();
}


noLibs.logging(config);

console.log("Starting NoInfoPath RESTAPI (RESTAPI) @version 2.0.4");
console.log("Copyright (c) 2015 The NoInfoPath Group, LLC.");
console.log("Licensed under the MIT License. (MIT)");
console.log("");
console.log("Configuration in progress...");

server.pre(function(request, response, next) {
    console.info("Start: ", request.method, request.url); // (1)
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

server.listen(config.server.port, config.server.address, function() {
    console.log('%s listening at %s', server.name, server.url);
});

server.on("after", function(request, response, route, error) {
    console.log("End: ", route.spec.method, route.spec.path, error || "");
});
