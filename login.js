

var assert = require('assert');

var Client = require('node-rest-client').Client;




var client = new Client();

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


var loginArgs = {
	parameters:{
		grant_type:"password",
		username:"djdapz@aol.com",
		password:"abcde12345",
		scope:"PRODUCTION"
	},
	headers:{
		"Content-Type":"application/x-www-form-urlencoded",
		"Authorization":"Basic UXRXNjNPdk9EN3pEaGsyMWl3bFdJR0J3eW9jYTozUnp1azVVNjZRaHlaeW40WWpsMmJyR1YyU0Fh"
	}
	


}
	
var springAwakening = {
	name: "springAwakening",
	tickets: [
		{
			type: "full",
			id: 9517001
		}
	]
};



var login = function(){
	client.get('https://api.stubhub.com/login', loginArgs, 
		function(data, response){
			if(response.statusCode== 200){
				console.log("logged In");
				console.log(data);
				console.log("now testing springAwakening")
				
			}else{
				console.log(" ");
				console.log("!!!!!!!!!!!!LOGIN ERROR!!!!!!!!!!!!!!");
				console.log(response.statusCode + " - " + response.statusMessage);
				console.log(data);
				console.log(" ");
			}

		})

}




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
				console.log("success");
				console.log(response);
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

	period = 0;
	for(var i = 0; i < festival.tickets.length; i++){
		var type =  festival.tickets[i];
		var name = festival.name;
		var args = basicArgs;
		args.parameters.eventid =festival.tickets[i].id;
		getFestivalDetails(args, name, type, period);
	}
};

login();

processFestival(springAwakening);


