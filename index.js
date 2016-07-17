var restify = require("restify"),
	crud = require("./no-mongo-crud"),
	odataParser = require("./no-odata"),
	schemas = require("./no-schemas")(),
	noREST = require("./no-rest");

var server = restify.createServer();

server.use(restify.queryParser());

server.use(restify.jsonBodyParser());

server.use(odataParser());

noREST(server, crud, schemas);

server.listen(config.server.port, function() {
  console.log('%s listening at %s', server.name, server.url);
});
