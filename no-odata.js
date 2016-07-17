var odataV4 = require("odata-v4-mongodb");

module.exports = function() {
	return function (req, res, next){
		if(req.query.$filter) req.odata = odataV4.createFilter(req.query.$filter);
		next();
	};
};
