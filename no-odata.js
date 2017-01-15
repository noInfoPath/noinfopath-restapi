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
				var t = query.$filter.replace("guid", "");
                mongoq.query = odataV4.createFilter(t);

            }

            if (query.$orderby) {
				var sorts = query.$orderby.split(",");
				for(var s=0; s < sorts.length; s++) {
					var parts = sorts[s].split(" ");
					if(parts.length < 2) {
						parts.push("asc");
					}

					sorts[s] = parts;
				}

                mongoq.options.sort = sorts;

            }

            if (query.$top) {
                mongoq.options.limit = Number(query.$top);
            }

            if (query.$skip) {
                mongoq.options.skip = Number(query.$skip);
            }

			if(query.$inlinecount) {
				mongoq.getTotal = true;
			}
            req.odata = mongoq;

			next();
        } catch (err) {
			next(err);
        }


        //console.log("no-odata", req.odata);

    };
};
