var fs = require("fs"),
	schemas = [];

function _configure(){
	var files = fs.readdirSync("./no-schemas"),
		tmp;

	files.forEach(function(v, k){
		if(v.lastIndexOf(".json") !== -1 && v.lastIndexOf(".tmpl") === -1){
			tmp = require("./" + v.replace(".json", ""));
			schemas = schemas.concat(tmp);
		}
	});

	return schemas;
}

module.exports = _configure;
