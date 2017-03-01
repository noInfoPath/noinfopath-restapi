var config = require("./config"),
	MongoClient = require('mongodb').MongoClient,
	gridStore = require('mongodb').GridStore,
	CRUD = {},
	CRUD_OPERATIONS = {
		"CREATE": "create",
		"READ": "read",
		"UPDATE": "update",
		"DELETE": "delete",
		"COUNT": "count"
	}
;

function _resolveData(indata) {
	var d = indata;
	if(typeof(d) === "string") {
		d = JSON.parse(d);
	}
	return d;
}

function _countDocuments(collection, data, filter) {

	return collection.count(filter.query)
		.then(function(data){
			//console.log(data);
			return data;
		});
}
CRUD[CRUD_OPERATIONS.COUNT] = _countDocuments;

function _readDocument(collection, data, filter) {
	console.log("filter", filter);
	return collection.find(filter.query, filter.fields, filter.options).toArray()
		.then(function(data){
			var retval = {};
			retval.value = data;
			if(filter.getTotal) {
				return _countDocuments(collection, data, filter)
					.then(function(total){
						retval["odata.metadata"] = true;
						retval["odata.count"] = total;


						return retval;
					});
			} else {
				return data;
			}
		})
		.catch(function(err){
			console.error("CRUD_OPERATIONS.READ", err);
		});
}
CRUD[CRUD_OPERATIONS.READ] = _readDocument;

function _insertDocument(collection, data, filter) {
	var d = _resolveData(data);

	return collection.insertOne(d)
		.then(function(data){
			return data;
		})
		.catch(function(err){
			console.error("CRUD_OPERATIONS.CREATE", err);
		})
		;
}
CRUD[CRUD_OPERATIONS.CREATE] = _insertDocument;

function _updateDocument(collection, data, filter){
	//console.log("XXXXXXX", filter);
	return collection.update(filter, _resolveData(data))
		.then(function(data){
			return data;
		})
		.catch(function(err){
			console.error("CRUD_OPERATIONS.UPDATE",err);
			return err;
		});
}
CRUD[CRUD_OPERATIONS.UPDATE] = _updateDocument;

function _deleteDocument(collection, data, filter) {
	return collection.deleteOne(filter)
		.then(function(data){
			return data;
		})
		.catch(function(err){
			console.error("CRUD_OPERATIONS.DELETE",err);
			return err;
		});
}
CRUD[CRUD_OPERATIONS.DELETE] = _deleteDocument;

function MongoConnection(schema, type, data, filter) {
	var _db;

	function executeTransaction(type, data, filter, collection) {
		//console.log(arguments);
		console.log("executeTransaction", type);
		return CRUD[type](collection, data, filter);
	}

	function resolveCollection(collectionName, db) {
		console.info("Connection open.", collectionName);
		_db = db;
		return db.collection(collectionName);
	}

	function closeConnection(){
		if(_db)
			_db.close();
		//console.info("Connection closed ", schema.collectionName);
	}

	this.run = function(){
		return new Promise(function(resolve, reject) {
			MongoClient.connect(schema.mongoDbUrl)
				.then(resolveCollection.bind(null, schema.collectionName))
				.then(executeTransaction.bind(null, type, data, filter))
				.then(resolve)
				.catch(function(err) {
					var m = err.errmsg || JSON.stringify(err);
					//console.error(m);
					reject({source: "MongoDB", message: m});
				})
				.then(closeConnection);
		});

	};

}

function beginMongoTransaction(schema, type, data, filter) {
	var mc = new MongoConnection(schema, type, data, filter);

	return mc.run();
}

module.exports = {
	type: "CRUD",
	execute: beginMongoTransaction,
	operations: CRUD_OPERATIONS
};
