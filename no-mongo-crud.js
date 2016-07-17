var config = require("./config"),
	MongoClient = require('mongodb').MongoClient,
	CRUD = {},
	CRUD_OPERATIONS = {
		"CREATE": "create",
		"READ": "read",
		"UPDATE": "update",
		"DELETE": "delete"
	}
;

function _readDocument(collection, data, filter) {
	return collection.find(filter).toArray();
}
CRUD[READ] = _readDocument;

function _insertDocument(collection, data, filter) {
	return collection.insertOne(data);
}
CRUD[CREATE] = _insertDocument;

function _updateDocument(collection, data, filter){
	return collection.update(filter, data);
}
CRUD[UPDATE] = _updateDocument;

function _deleteDocument(collection, data, filter) {
	return collection.deleteOne(filter);
}
CRUD[DELETE] = _deleteDocument;

function beginMongoTransaction(schema, type, data, filter) {
	var _db;

	function executeTransaction(type, data, filter, collection) {
		//console.log(schema, type, data, filter);

		return CRUD[type](collection, data, filter);
	}

	function resolveCollection(collectionName, db) {
		_db = db;
		return db.collection(collectionName);
	}

	function closeConnection()
	{
		_db.close();
		console.log("Connection closed.");
	}

	return new Promise(function(resolve, reject) {
		MongoClient.connect(schema.mongoDbUrl)
			.then(resolveCollection.bind(null, schema.collectionName))
			.then(executeTransaction.bind(null, type, data, filter))
			.then(resolve)
			.catch(reject)
			.then(closeConnection);
	});
}

module.exports = {
	execute: beginMongoTransaction,
	operations: CRUD_OPERATIONS
};
