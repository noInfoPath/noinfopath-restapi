var mongo = require("mongodb"),
	MongoClient = mongo.MongoClient,
	NoBSONTimestamp = require("noinfopath-bson-timestamp");

var _db;
MongoClient.connect("mongodb://macbook:27017/local")
	.then(function (db) {
		_db = db;
		return db.collection("oplog.rs");
	})
	.then(function (collection) {
		var ts = NoBSONTimestamp.fromNumber(1472761703001),
			ns = new RegExp("NoInfoPath_AppStore.[^$cmd]"),
			filter = {
				query: {
					"ns": {
						"$regex": ns
					},
					"ts": {
						"$gt": ts
					}
				},
				fields: null,
				options: {
					//limit: 1,
					sort: [["ts", "ascending"]]
				}
			};
		return collection.find(filter.query, filter.fields, filter.options).toArray();
	})
	.then(function (data) {

		for(var i = 0; i < data.length; i++) {
			var d = data[i],
				dn = NoBSONTimestamp.toNumber(d.ts),
				dt = new Date(dn);

			console.log(dn, d.ns, dt.toISOString(), d.o._id);
		}
	})
	.catch(function (err) {
		console.log(err);
	})
	.then(function () {
		_db.close();
	});
