var odataV4 = require("odata-v4-mongodb");

//console.log(odataV4);

module.exports = function() {
	return function (req, res, next){
		if(req.query.$filter) req.odata = odataV4.createFilter(req.query.$filter);
		next();
	};
};
