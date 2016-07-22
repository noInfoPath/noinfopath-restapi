var odataV4 = require("odata-v4-mongodb"),
	querystring = require("querystring");

module.exports = function() {
	return function (req, res, next){
		//console.log(req.query);
		var query = req.query,
			mongoq = {
				query: {},
				options: {}
			};

		if(query.$filter) {
			mongoq.query = odataV4.createFilter(query.$filter);
		}

		if(query.$orderby) {
			mongoq.options.sort = [query.$orderby];
		}

		if(query.$top) {
			mongoq.options.limit = query.$top;
		}

		if(query.$skip) {
			mongoq.options.skip = query.$skip;
		}

		req.odata = mongoq;
		next();
	};
};
