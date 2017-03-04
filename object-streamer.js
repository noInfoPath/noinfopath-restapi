var stream = require('stream');
var util = require('util');

function ObjectStream(){
    stream.Transform.call(this);

    this._readableState.objectMode = false;
    this._writableState.objectMode = true;
}
util.inherits(ObjectStream, stream.Transform);

ObjectStream.prototype._transform = function(obj, encoding, cb){
    this.push(JSON.stringify(obj));
    cb();
};



module.exports = function (obj) {
	var rs = new stream.Readable({ objectMode: true });
	rs.push(obj);
	rs.push(null);

	return rs.pipe(new ObjectStream());
};
