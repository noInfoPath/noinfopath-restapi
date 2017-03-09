/*
*	[NoInfoPath Home](http://gitlab.imginconline.com/noinfopath/noinfopath/wikis/home)
*
*	Copyright (c) 2017 The NoInfoPath Group, LLC.
*
*	Licensed under the MIT License. (MIT)
*
*	___
*
*	[NoInfoPath REST API *@version 2.0.13*](home)
*	=============================================
*
*	ODATA Usage
*	-----------
*	The NoInfoPath RESTAPI implements an ODATA query interface.  It is based on the ODATA V4 specification.
*
*	> This was implemented using an NPM library called `odata-v4-mongodb`. The implentation is flaw, and
*	> incomplete when have made some monkey patches to mitigate these shortcomings. 
*
*	- [ODATA V4 Specification](http://www.odata.org/documentation/)
*/
var odataV4 = require("odata-v4-mongodb"),
	querystring = require("querystring");

module.exports = function () {
	return function (req, res, next) {
		try {

			var query = req.query,
				mongoq = {
					query: {},
					options: {}
				};



			if (query.$filter) {
				var t = query.$filter.replace("guid", ""),
					q = odataV4.createFilter(t),
					stringified = JSON.stringify(q).replace(/_/g, '.');


				mongoq.query = JSON.parse(stringified);
			}

			if (query.$orderby) {
				var sorts = query.$orderby.split(",");
				for (var s = 0; s < sorts.length; s++) {
					var parts = sorts[s].split(" ");
					if (parts.length < 2) {
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

			if (query.$inlinecount) {
				mongoq.getTotal = true;
			}
			req.odata = mongoq;

			next();
		} catch (err) {
			next(err);
		}


		console.log("no-odata", JSON.stringify(req.odata));

	};
};
