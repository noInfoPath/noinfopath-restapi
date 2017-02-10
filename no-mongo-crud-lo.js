var config = require("./config"),
	MongoClient = require('mongodb').MongoClient,
	GridStore = require('mongodb').GridStore,
	GridFSBucket = require('mongodb').GridFSBucket,
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

function _readDocument(collection, data, filter, db) {
	return collection.find(filter.query, filter.fields, filter.options).toArray()
		.then(function(data){
			var retval = {}
			retval.value = data
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

function _insertDocument(payload, data, filter, db) {
	return new Promise(function(resolve, reject) {
		var d = JSON.stringify(data),
			bucket = new GridFSBucket(db); // data.ChangeID, "f" + data.ChangeID + ".json", "w", payload

		var stream = require('stream');
		var rs = new stream.Readable({ objectMode: true });
		rs.push(JSON.stringify(data));

		var uploadStream = bucket.openUploadStream(data.ChangeID + ".json", payload);

		uploadStream.once("finish", function(err) {
			resolve(true);
		})


		uploadStream.once("error", function(err) {
			console.error(err);
			reject(err);
		})

		uploadStream.write(d, function(err) {
			if(err) {
				console.error(err);
			} else {
				console.log("working in write");
			}
		})

		uploadStream.end();

	});

	// return gs.open()
	// 	.then(function(_gs) {
	// 		return _gs.write(JSON.stringify(data));
	// 	})
	// 	.then(function(data) {
	// 		return data;
	// 	})
	// 	.catch(function(err){
	// 		console.error("CRUD_OPERATIONS.CREATE", err);
	// 	})
		;
}
CRUD[CRUD_OPERATIONS.CREATE] = _insertDocument;

function _updateDocument(collection, data, filter, db){
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

function _deleteDocument(collection, data, filter, db) {
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

	function executeTransaction(type, data, filter, payload) {
		//console.log(arguments);
		console.log("executeTransaction on Grid Store", type);


		return CRUD[type](payload, data, filter, _db);
	}

	function resolveGridStoreMetadata(collectionName, schema, data, db) {

		return new Promise(function(resolve, reject) {

			console.info("Creating GridStore", collectionName);
			_db = db;

			var payload = {
				"contentType": "application/json",
				"metadata": {}
			};

			for(var i=0; i<schema.columns.length; i++) {
				var colName = schema.columns[i];
				payload.metadata[colName] = data[colName];
			}

			resolve(payload);

		});

	}

	function closeConnection(){
		if(_db)
			_db.close();
		//console.info("Connection closed ", schema.collectionName);
	}

	this.run = function(){
		return new Promise(function(resolve, reject) {

			MongoClient.connect(schema.mongoDbUrl)
				.then(resolveGridStoreMetadata.bind(null, schema.collectionName, schema, data))
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
	execute: beginMongoTransaction,
	operations: CRUD_OPERATIONS
};
