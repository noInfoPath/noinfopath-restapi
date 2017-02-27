// Correctly upload a file to GridFS and then retrieve it as a stream

var MongoClient = require('mongodb').MongoClient,
    GridFSBucket = require('mongodb').GridFSBucket,
    crypto = require('crypto'),
    fs = require('fs'),
	ObjectId = require('mongodb').ObjectID,
    test = require('assert');

MongoClient.connect('mongodb://gitlab.imginconline.com:27017/efr2_dtc', function(err, db) {


    var bucket = new GridFSBucket(db);
    var CHUNKS_COLL = 'gridfsdownload.chunks';
    var FILES_COLL = 'gridfsdownload.files';


	var _id = ObjectId("58a74d8226b4f7243eef9bd6"); // CORRECT ID
	// _id = ObjectId("507f191e810c19729de860ea"); wrong ID, throws an error

	// var uploadStream = bucket.openUploadStream('test2.txt');
	// var id = uploadStream.id;
	// console.log("The uploadstream ID is", id);
	// var readStream = fs.createReadStream('./test.txt');
	// readStream.pipe(uploadStream);

	// THIS IS JUST WRITING A REG TXT FILE TO ANOTHER ONE
	var writeStream = fs.createWriteStream('./testDownload.txt');
	// var readStream = fs.createReadStream('./test.txt');
	//
	// readStream.pipe(writeStream).on("finish", function() {
	// 	console.log("finished writing the file");
	// });

	_id = ObjectId("58a750e6010a4427ae707791");
	var downloadStream = bucket.openDownloadStream("d490e2ea-15b0-4cf2-ac94-ae1cf71dad1e");
	var writeStream = fs.createWriteStream('./testDownload.json');

	downloadStream.pipe(writeStream).on("finish", function() {
		console.log("Finished writing the file");
	});


	// downloadStream.pipe()


    // var readStream = fs.createReadStream('./test.txt');
	//
    // var uploadStream = bucket.openUploadStream('test1.txt');
	//
    // var license = fs.readFileSync('./test.txt');
    // var id = uploadStream.id;

    // uploadStream.once('finish', function() {
    //     var downloadStream = bucket.openDownloadStream(id);
	//
    //     uploadStream = bucket.openUploadStream('test2.txt');
    //     id = uploadStream.id;
    //     // console.log("Finished uploading Test 1");
	//
    //     downloadStream.pipe(uploadStream).once('finish', function() {
	//
	// 		// console.log("For some reason, downloaded Test 1 and uploaded it again?");
    //         // var chunksQuery = db.collection(CHUNKS_COLL).find({
    //         //     files_id: id
    //         // });
    //         // chunksQuery.toArray(function(error, docs) {
    //         //     console.log("The chunks array has been fixed", docs);
    //         //     test.equal(error, null);
    //         //     test.equal(docs.length, 1);
    //         //     test.equal(docs[0].data.toString('hex'), license.toString('hex'));
    //         //     var filesQuery = db.collection(FILES_COLL).find({
    //         //         _id: id
    //         //     });
    //         //     filesQuery.toArray(function(error, docs) {
    //         //         test.equal(error, null);
    //         //         test.equal(docs.length, 1);
	// 		//
    //         //         var hash = crypto.createHash('md5');
    //         //         hash.update(license);
    //         //         test.equal(docs[0].md5, hash.digest('hex'));
    //         //     });
    //         // });
    //     });
    // });
	// readStream.pipe(uploadStream);

});
