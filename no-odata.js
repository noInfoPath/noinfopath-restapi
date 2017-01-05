var odataV4 = require("odata-v4-mongodb"),
    querystring = require("querystring");

module.exports = function() {
    return function(req, res, next) {
        try {

            var query = req.query,
                mongoq = {
                    query: {},
                    options: {}
                };



            if (query.$filter) {
                mongoq.query = odataV4.createFilter(query.$filter.replace("guid", ""));
            }

            if (query.$orderby) {
                mongoq.options.sort = [query.$orderby];
            }

            if (query.$top) {
                mongoq.options.limit = query.$top;
            }

            if (query.$skip) {
                mongoq.options.skip = query.$skip;
            }

            req.odata = mongoq;

			next();
        } catch (err) {
			next(err);
        }


        //console.log("no-odata", req.odata);

    };
};
