
function _get(crud, schema, req, res, next){
	crud.execute(schema, crud.operations.READ, null, req.odata)
		.then(function(results){
			if(results.length) {
				res.send(200, results);
			}else{
				res.send(404);
			}
		})
		.catch(function(err){
			console.error(err);
			res.send(500);
		});
}

function _getOne(crud, schema, req, res, next){
	var filter = {};
	filter[schema.primaryKey] = req.params.id;

	crud.execute(schema, crud.operations.READ, null, filter)
		.then(function(results){
			if(results.length) {
				res.send(200, results[0]);
			}else{
				res.send(404);
			}
		})
		.catch(function(err){
			console.error(err);
			res.send(500);
		});
}

function _put(crud, schema, req, res, next){
	console.log(req.body, req.params.id);
	crud.execute(schema, crud.operations.UPDATE, req.body, req.params.id)
		.then(function(results){
			res.send(200, results);
		})
		.catch(function(err){
			console.error(err);
			res.send(500);
		});
}

function _post(crud, schema, req, res, next){
	console.log(req.body);
	crud.execute(schema, crud.operations.CREATE, req.body)
		.then(function(results){
			res.send(200, results);
		})
		.catch(function(err){
			console.error(err);
			res.send(500);
		});
}

function _delete(crud, schema, req, res, next){
	crud.execute(schema, crud.operations.DELETE, null, req.params.id)
		.then(function(results){
			res.send(200, results);
		})
		.catch(function(err){
			console.error(err);
			res.send(500);
		});
}

function _configRoute(server, crudProvider, schema){
	console.log("Configuring route ", schema.uri);

	server.get(schema.uri, _get.bind(null, crudProvider, schema));
	server.get(schema.uri + "/:id", _getOne.bind(null, crudProvider, schema));
	server.put(schema.uri + "/:id", _put.bind(null, crudProvider, schema));
	server.del(schema.uri + "/:id", _delete.bind(null, crudProvider, schema));
	server.post(schema.uri, _post.bind(null, crudProvider, schema));

}

module.exports = function(server, crudProvider, schemas){
	schemas.forEach(_configRoute.bind(null, server, crudProvider));
};
