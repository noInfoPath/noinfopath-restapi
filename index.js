var noLibs = require('@noinfopath/noinfopath-node-libraries'),
	config = require("./config"),
	restify = require("restify"),
	crud = require("./no-mongo-crud"),
	odataParser = require("./no-odata"),
	schemas = require("./no-schemas")(),
	noREST = require("./no-rest"),
	server = restify.createServer();

noLibs.logging(config);

server.pre(function (request, response, next) {
  console.info("Start: ", request.method, request.url);        // (1)
  return next();
});

server.use(restify.queryParser());

server.use(restify.bodyParser());

server.use(odataParser());

noREST(server, crud, schemas);

server.listen(config.server.port, function() {
  console.log('%s listening at %s', server.name, server.url);
});

server.on("after", function (request, response, route, error) {
	console.log("End: ", route.spec.method, " ", route.spec.path);
	//response.end();
});
