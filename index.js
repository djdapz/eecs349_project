var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var Client = require('node-rest-client').Client;


var client = new Client();
var url = 'mongodb://localhost:27017/test';

var lollaArgs = {
	parameters:{
		eventid:9374837,
		sectionStats:true,
		zoneStats:true,
		start:0,
		allSectionZoneStats:true,
		pricingSummary:true,
		eventLevelStats:true,
		rows:1,
		sort:"listingPrice asc",
		priceType:" listingPrice",
		tld:1
	},
	headers: { 
		"Content-Type": "application/json",
		"Authorization": "Bearer e85831effcd23f97b34a7c98f372c"
	 }
};

var getLollaObservation = function(){
	client.get("https://api.stubhub.com/search/inventory/v2", lollaArgs,
	function (data, response) {

		//Edit Data to get only what we need
		


		//Save to database
		MongoClient.connect(url, function(err, db){
			assert.equal(null, err);
			console.log("Connected correctly to server.");
			insertDocument(db, data ,function() {
				console.log("Inserted")
		      	db.close();
		  	});
		})

	});
}


var insertDocument = function(db, data, callback){
	db.collection('lollapalooza').insertOne(data, function(err, result){
   		assert.equal(err, null);
   		console.log("Inserted a docmuent into the restaurants collection.");
   		callback();
   	}
	)
}


getLollaObservation();