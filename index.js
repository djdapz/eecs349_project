
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var Client = require('node-rest-client').Client;




var client = new Client();
var url = 'mongodb://dataCollector:goCats@ds019078.mlab.com:19078/eecse349_stubhub';

var interval = 60*60*100; //minutes * seconds * milliseconds


//basic arguments so everything is in the same format
var basicArgs = {
	parameters:{
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
		"Authorization": "Bearer naXXtZhMKcj6SOMbjYqjANLPkpMa"
	 }
};


//Lollapalooza specific parameters
var lollapalooza = {
	name: "lollapalooza",
	tickets: [
		{
			type: "full",
			id: 9374837
		},
		{
			type: "thursday",
			id:9468715
		},
		{
			type: "friday",
			id:9465062
		},
		{
			type: "saturday",
			id: 9465063
		},
		{
			type: "sunday",
			id:9465064
		}
	]
};

//Bonnaroo specific parameters
var bonnaroo = {
	name: "bonnaroo",
	tickets: [
		{
			type: "full",
			id: 9374757
		},
		{
			type: "parking",
			id: 9374766
		}
	]
};

//Governor's Ball specific parameters
var governorsBall = {
	name: "governorsBall",
	tickets: [
		{
			type: "full",
			id: 9343796
		},
		{
			type: "friday",
			id:9521805
		},
		{
			type: "saturday",
			id: 9521812
		},
		{
			type: "sunday",
			id:9521853
		}
	]
};

//Oustide Lands specific parameters
var outsidelands = {
	name: "outsidelands",
	tickets: [
		{
			type: "full",
			id: 9476770
		},
		{
			type: "friday",
			id:9476766
		},
		{
			type: "saturday",
			id: 9476767
		},
		{
			type: "sunday",
			id:9476768
		},
		{
			type: "parking",
			id:9476771
		}
	]
};

var springAwakening = {
	name: "springAwakening",
	tickets: [
		{
			type: "full",
			id: 9517001
		}
	]
};








//Main operational Functions

/*
 insertDocument - Helper function for saveToDB
 Inputs: 	db - the database collection in question
 			data - in the form of a json document
 			callback - function to ecexute when complete

 */
var insertDocument = function(db, data, callback){
	db.collection(data.event.name).insertOne(data,
		function(err, result){
			assert.equal(err, null);
			console.log("Inserted "+ data.event.name + ":" + data.event.type + ":" + data.dateQueried);
			callback();
		}
	)
};

var getCounterDB = function(db, collectionName, callback){
	var cursor = db.collection("counters").find({"name": collectionName});
	cursor.each(function(err, doc) {
		assert.equal(err, null);
		if (doc != null) {
			callback(doc.counter);
		} else {
			callback(-1);
		}
	});

};

var updateCounterDB = function(db, collectionName, newCounter, callback){
	db.collection('counters').update(
		{"name": collectionName},
		{"name": collectionName, "counter": newCounter},
		function(err,results){
			callback();
		}
	)


};


/*
saveToDB - Function to insert a document into a mongoDB Database
Input: data - in the form of a json document
 */
var saveToDB = function(data){
	//Save to database
	MongoClient.connect(url, function(err, db){
		assert.equal(null, err);
		insertDocument(db, data ,function() {
			db.close();
		});
	})
};



var getCounter = function(festivalName,callback){
	//Save to database
	MongoClient.connect(url, function(err, db){
		assert.equal(null, err);
		getCounterDB(db, festivalName ,function(counter) {
			db.close();

			if(counter >-1){
				console.log("coutner recieved for "+ festivalName);
				callback(counter);
			}
		});
	})
};

var updateCounter = function(festivalName, newPeriod){
	MongoClient.connect(url, function(err, db){
		assert.equal(null, err);
		updateCounterDB(db, festivalName, newPeriod, function() {
			db.close();
		});
	})
};

/*
 getFestivalDetails - 	Important function to request ticket details at a given time from Stubhub.
 						This specific one access the /search/inventory/v2 endpoint

 inputs				-	httpArgs: JSON object of headers incluing auth and docType + Parameters
 						festivalName: Name of the festival corresponing to collection name in database
 						ticketyType: type of ticket, eg: fourDay, Thursday, Friday ect. Might be usefull in analysis later
 */
var getFestivalDetails = function(httpArgs, festivalName, ticketType, period){



	client.get("https://api.stubhub.com/search/inventory/v2", httpArgs,
		function (data, response) {
			//Edit Data to get only what we need
			//data = JSON.parse(data);
			if(response.statusCode == 200){
				data.listing = undefined;
				var currentDate = new Date();
				data.counter = period;
				data.dateQueried = {
					dateObject: currentDate,
					month: currentDate.getMonth(),
					day: currentDate.getDay(),
					year: currentDate.getFullYear(),
					hour: currentDate.getHours(),
					minutes: currentDate.getMinutes(),
					seconds: currentDate.getSeconds()
				};


				data.event = {
					name: festivalName,
					type: ticketType.type
				};
				saveToDB(data);
			}else{ // Handle error so program doesn't crash on a bad request
				console.log(" ");
				console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!");
				console.log(festivalName + ":" + ticketType);
				console.log(response.statusCode + " - " + response.statusMessage);
				console.log(new Date());
				console.log(" ");
			}

		});
};


var processFestival = function(festival){

	getCounter(festival.name, function(period){
		//TODO -refactor this to use an event emitter rather than a callback
		for(var i = 0; i < festival.tickets.length; i++){
			var type =  festival.tickets[i];
			var name = festival.name;
			var args = basicArgs;
			args.parameters.eventid =festival.tickets[i].id;
			getFestivalDetails(args, name, type, period);
		}
		updateCounter(festival.name, period + 1 );
	});





};

var step1 = function(){
	processFestival(lollapalooza);
	processFestival(bonnaroo);

};

var step2 = function(){
	processFestival(governorsBall);
	processFestival(outsidelands);
	processFestival(springAwakening);
};

var main = function(){
	step2();
	setTimeout(step1, 61000);	//one minute interval because api only allows 10 requests/minute
	setTimeout(main, interval);


};

main();

