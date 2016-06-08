var fs = require('fs');
var jsonfile = require('jsonfile');
var converter = require('json-2-csv')

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;

var url = 'mongodb://dataCollector:goCats@ds019078.mlab.com:19078/eecse349_stubhub';

var today = new Date()

var festivals = {
    'count': 0,
    'len': 5,
    'lollapalooza' : {},
    'springAwakening' : {},
    'bonnaroo' : {},
    'governorsBall' : {},
    'outsidelands' : {}
};


var lollapaloozaQueryInfo = {
    'name': 'lollapalooza',
    'types': [
        'full',
        'friday',
        'saturday',
        'sunday',
        'thursday'
    ]
};

var bonnarooQueryInfo = {
    'name': 'bonnaroo',
    'types': [
        'full',
        'parking'
    ]
};

var governorsBallQueryInfo = {
    'name': 'governorsBall',
    'types': [
        'full',
        'friday',
        'saturday',
        'sunday',
    ]
};

var outsidelandsQueryInfo = {
    'name': 'outsidelands',
    'types': [
        'full',
        'friday',
        'saturday',
        'sunday',
        'parking'
    ]
};

var springAwakeningQueryInfo = {
    'name': 'springAwakening',
    'types': [
        'full'
    ]
};




//setup globals
var lolla = [];
var springAwakening = [];
var outsidelands = [];
var governorsBall = [];
var bonnaroo = [];


//option 1, parse all files downloaded
//clunky b/c need to download, then edit to turn into array
//would like to be able to automattially query and format


var findFestivals = function(db, festivalName, options, callback) {
    var cursor =db.collection(festivalName).find(options);
    var collection = []

    cursor.each(function(err, doc) {
        assert.equal(err, null);
        if (doc != null) {
            collection.push(doc);
        } else {
            callback(collection);
        }
    });
};


var queryDatabase= function(festivalName, options, callback){
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        findFestivals(db, festivalName, options, function(collection) {
            db.close();
            callback(collection);
        });
    });
};

var getFestivalByType = function(name, type, callback){
    var options = {'event.type': type};


    queryDatabase(name, options, function(data){
        var obj = {
            theData: data,
            fileName: name + '_'+ type
        };

        festivals[name][type]= obj
        callback();
    });
};




var option2 = function() {
    getFestival(lollapaloozaQueryInfo);
    getFestival(bonnarooQueryInfo);
    getFestival(governorsBallQueryInfo);
    getFestival(springAwakeningQueryInfo);
    getFestival(outsidelandsQueryInfo);
};

var getFestival = function(params, callback){
    var types = params.types;
    var count = 0;
    for(var i =0; i<types.length; i++){
        console.log('getting '+ params.name);
        getFestivalByType(params.name, types[i], function(){
            count++;
            if(count == types.length){
                festivals.count ++;

                if(callback){
                    callback()
                }
                if(festivals.count == festivals.len){
                    processData();
                }
            }
        })
    }

};

var processGovOrLollaChunk = function(data, start, end){
    var finalArray = [];
    var startOfFest  = start;  //Month is 0-11 in JavaScript
    var ticketsOnSale  = end; //Month is 0-11 in JavaScript

    var one_day=1000*60*60*24;
    var one_hour=1000*60*60;

    for(var i =0; i<data.length; i++){
        var obs = data[i];
        var observation = {};
        if(obs.counter == null || obs.counter == undefined || obs.counter <0){
            continue
        }

        observation.counter = obs.counter;
        var vipIndex = -1;
        var regIndex = -1;

        if(obs.section_stats) {
            if (obs.section_stats[1]) {
                if(obs.section_stats[1].sectionName.indexOf("VIP")>=0|| obs.section_stats[1].sectionName.indexOf("vip")>=0){
                    vipIndex = 1;
                    regIndex = 0;
                }
                else if(obs.section_stats[0].sectionName.indexOf("VIP")>=0|| obs.section_stats[0].sectionName.indexOf("vip")>=0){
                    vipIndex = 0;
                    regIndex = 1;
                }
            } else if (obs.section_stats[0]) {
                regIndex = 0;

            } else {
                console.log("SOLD OUT SHOW")
                console.log(obs.dateQueried.dateObject)
                console.log(obs.event)
            }

            if(regIndex > -1){
                observation.GAmin = obs.section_stats[regIndex].minTicketPrice;
                observation.GAmax = obs.section_stats[regIndex].maxTicketPrice;
                observation.GAavg = obs.section_stats[regIndex].averageTicketPrice;
                observation.GAamount = obs.section_stats[regIndex].totalTickets;
                observation.GAnumListings = obs.section_stats[regIndex].totalListings;
            }else {
                observation.GAmin = "SOLD OUT";
                observation.GAmax = "SOLD OUT";
                observation.GAavg = "SOLD OUT";
                observation.GAamount = "SOLD OUT";
                observation.GAnumListings = "SOLD OUT";
            }


            if(vipIndex >-1){
                observation.VIPmin = obs.section_stats[vipIndex].minTicketPrice;
                observation.VIPmax = obs.section_stats[vipIndex].maxTicketPrice;
                observation.VIPavg = obs.section_stats[vipIndex].averageTicketPrice;
                observation.VIPamount = obs.section_stats[vipIndex].totalTickets;
                observation.VIPnumListings = obs.section_stats[vipIndex].totalListings;
            } else{
                observation.VIPmin = "SOLD OUT";
                observation.VIPmax = "SOLD OUT";
                observation.VIPavg = "SOLD OUT";
                observation.VIPamount = "SOLD OUT";
                observation.VIPnumListings = "SOLD OUT";
            }
        } else{
            observation.GAmin = "NO DATA";
            observation.GAmax = "NO DATA";
            observation.GAavg = "NO DATA";
            observation.GAamount = "NO DATA";
            observation.GAnumListings = "NO DATA";
            observation.VIPmin = "NO DATA";
            observation.VIPmax = "NO DATA";
            observation.VIPavg ="NO DATA";
            observation.VIPamount = "NO DATA";
            observation.VIPnumListings = "NO DATA";

        }



        var timeSinceOnSale = obs.dateQueried.dateObject - ticketsOnSale;
        observation.daysSinceOnSale = timeSinceOnSale/one_day;
        observation.hoursSinceOnSale = Math.round(timeSinceOnSale/one_hour);

        var timeTillFest = startOfFest - obs.dateQueried.dateObject;
        observation.daysTillFest = timeTillFest/one_day;
        observation.hoursTillFest = Math.round(timeTillFest/one_hour);

        if(obs.eventPricingSummary){
            observation.totalAverage = obs.eventPricingSummary.averageTicketPrice;
            observation.totalListings = obs.eventPricingSummary.totalListings;
        }else{
            observation.totalAverage = "SOLD OUT";
            observation.totalListings = "SOLD OUT";
        }


        finalArray.push(observation);

    }
    return finalArray

};

var saveFile = function(data, fileName){
    var csvPrefix = __dirname+ '/data/csv/'+today.getMonth()+'_'+today.getDate()+'_'+today.getHours() +'_'+today.getMinutes() +'/';
    var jsonPrefix = __dirname + '/data/json/'+today.getMonth()+'_'+today.getDate()+'_'+today.getHours() +'_'+today.getMinutes() +'/';

    if (!fs.existsSync(csvPrefix)) {
        fs.mkdirSync(csvPrefix);
    }
    if (!fs.existsSync(jsonPrefix)) {
        fs.mkdirSync(jsonPrefix);
    }

    var str = JSON.stringify(data, null, 2);


    fs.writeFile(jsonPrefix + fileName+'.json', str, function(error){
        if (error) throw error;
        console.log(fileName+'.json saved!');
    });

    converter.json2csv(data, function(err, csv){
        if(err){
            console.log(err)
        }else{
            fs.writeFile(csvPrefix + fileName+'.csv', csv, function(error){
                if (error) throw error;
                console.log(fileName+'.csv saved!');
            });
        }
    });
};

var processData = function(){
    /*
    Called after ALL of the festivals are queried
     */
    console.log('processing Data...');

    for (var key in festivals) {
        // skip loop if the property is from prototype
        if (!festivals.hasOwnProperty(key)) continue;
        if (key == 'count' || key =='len') continue;

        var festival = festivals[key];

        for (var day in festival)  {
            // skip loop if the property is from prototype
            if(!festival.hasOwnProperty(day)) continue;
            if (day == 'count' || key =='len') continue;


            var data;

            switch(key){
                case 'lollapalooza':
                    data = processGovOrLollaChunk(festival[day].theData, new Date(2016, 6, 28), new Date(2016, 2, 22));
                    break;
                case 'governorsBall':
                    data = processGovOrLollaChunk(festival[day].theData, new Date(2016, 5, 3), new Date(2016, 1, 20));
                    break;
                case 'bonnaroo':
                    data = processGovOrLollaChunk(festival[day].theData, new Date(2016, 5, 9), new Date(2015, 10, 27));
                    break;
                case 'springAwakening':
                    data = processGovOrLollaChunk(festival[day].theData, new Date(2016, 5, 13), new Date(2016, 1, 1));
                    break;
                case 'outsidelands':
                    data = processGovOrLollaChunk(festival[day].theData, new Date(2016, 7, 5), new Date(2016, 2, 28));
                    break;

                default:
                    console.log('ATTN: This festival\'s processing chunk not handled:  ' + key + "_" + day)

            }
            saveFile(data, festival[day].fileName)
        }
    }




};


var main = function(){
    option2();
};


main();

