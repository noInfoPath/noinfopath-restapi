// Correctly upload a file to GridFS and then retrieve it as a stream

var MongoClient = require('mongodb').MongoClient,
	GridFSBucket = require('mongodb').GridFSBucket,
	crypto = require('crypto'),
	fs = require('fs'),
  test = require('assert');
MongoClient.connect('mongodb://gitlab.imginconline.com:27017/efr2_dtc', function(err, db) {
  var bucket = new GridFSBucket(db, { bucketName: 'gridfsdownload' });
  var CHUNKS_COLL = 'gridfsdownload.chunks';
  var FILES_COLL = 'gridfsdownload.files';
  var readStream = fs.createReadStream('./config.json');

  var uploadStream = bucket.openUploadStream('test.dat');

  var license = fs.readFileSync('./config.json');
  var id = uploadStream.id;

  uploadStream.once('finish', function() {
    var downloadStream = bucket.openDownloadStream(id);
    uploadStream = bucket.openUploadStream('test2.dat');
    id = uploadStream.id;
console.log("in the once");
    downloadStream.pipe(uploadStream).once('finish', function() {

		console.log("args", arguments);
	  var chunksQuery = db.collection(CHUNKS_COLL).find({ files_id: id });
      chunksQuery.toArray(function(error, docs) {
		  console.log("inside the downloadsstream pipie once", docs);
        test.equal(error, null);
        test.equal(docs.length, 1);
        test.equal(docs[0].data.toString('hex'), license.toString('hex'));
        var filesQuery = db.collection(FILES_COLL).find({ _id: id });
        filesQuery.toArray(function(error, docs) {
          test.equal(error, null);
          test.equal(docs.length, 1);

          var hash = crypto.createHash('md5');
          hash.update(license);
          test.equal(docs[0].md5, hash.digest('hex'));
        });
      });
    });
  });

  readStream.pipe(uploadStream);
});
