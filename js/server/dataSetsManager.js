var XMLHttpRequest = require("./XMLHttpRequest").XMLHttpRequest;
var xml2js = require('xml2js'); //require('libxmljs');
var LsstMySQLClient = require('mysql').Client;
var lsstMySQLClient = new LsstMySQLClient();
lsstMySQLClient.host = 'lsst10.ncsa.uiuc.edu';

var dataSets = [];

var querySDSS = function(query, callback){
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    console.log("State: " + this.readyState);
    // End of response
    if(this.readyState == 4) {
      callback(this.responseText);
    }
  };
  xhr.open("GET", dataSources.sdss.url + '?format=xml&cmd=' + encodeURIComponent(query));
  xhr.send();
};

var queryLSST = function(query, callback){	
  lsstMySQLClient.user = dataSources.lsst.user;
  lsstMySQLClient.password = dataSources.lsst.password;
  lsstMySQLClient.query('use buildbot_PT1_2_u_wp_tags_2011_0817_215234;');
  lsstMySQLClient.query(query, function(err, results, fields) {
    callback(results);
	});
	//lsstMySQLClient.end();
};

var parseSDSSQueryResult = function(queryResult, callback){
  var parseSuccess = function (err, result) {
  	var records = [];
  	var rows = result.root.Answer[0].Row;
  	
  	for (j in rows) {
		  var entry = rows[j].$;
		  newRecord = {};
		  console.log(entry);
		  for (i in entry)
		  	newRecord[i] = entry[i];
		  records.push(newRecord);
    }
    callback(records);
  }
  
  var parser = new xml2js.Parser();
  parser.parseString(queryResult, parseSuccess);
  
};

var parseLSSTQueryResult = function(queryResults){
   var currentRow;
   var records = [];
   var newRecord;
   var rowsNumber = queryResults.length;
   for(var i = 0; i < rowsNumber; ++i){
     currentRow = queryResults[i];
     newRecord = {};
     for (var column in currentRow){
       if(currentRow.hasOwnProperty(column)){
         newRecord[column] = currentRow[column];
       }
     }
     records.push(newRecord); 
   }
   return records;
};

var dataSources = {
  sdss: {
    //url: 'http://skyserver.sdss3.org/public/en/tools/search/x_sql.asp',
    url: 'http://skyserver.sdss.org/public/en/tools/search/x_sql.asp',
    type: 'sql',
    queryResultParser: parseSDSSQueryResult,
    dataInquirer: querySDSS
  },
  lsst: {
    url: 'lsst10.ncsa.uiuc.edu',
    type: 'mySQL',
    user: 'dmarcos',
    password: 'dididi',
    queryResultParser: parseLSSTQueryResult,
    dataInquirer: queryLSST
  }
  
};

var dataSourcesNameIndex = {};

var retrieveRecords = function(source, query, success, error){
  var dataInquirer = dataSources[source].dataInquirer;
  var queryResultParser;
  var processQueryResult = function(queryResult){
  	var querySuccess = function(records) {
  		success(records);
  	}
    queryResultParser(queryResult, querySuccess);
  }
    
  if (!dataInquirer) {
    console.error("ASCOT doesn't know how to query the data source: " + sourceId + " No default method and no function provided");
    success([]);
    return;
  }
  queryResultParser = dataSources[source].queryResultParser;
  if (!queryResultParser) {
    console.error('Parser not available for ' + sourceId);
    success([]);
    return;
  }
  dataInquirer(query, processQueryResult); 
}

var addDataSet = function(dataSet){
  var dataSetName = dataSet.name;
  if(!dataSetName){
    console.error("Failed when adding data set. A name for the data set has not been provided");
  }
  dataSets.push(dataSet);
  dataSourcesNameIndex[dataSetName] = dataSourcesNameIndex[dataSetName] || [];
  dataSourcesNameIndex[dataSetName].push(dataSets.length-1);
  return dataSets.length-1;
}

module.exports.find = function(id, callback) {
  id = parseInt(id, 10);
  var dataSet = dataSets[id];
  var dataInquirer;
  var queryResultParser;
  var successRecordsRetrieval = function(records){
    callback({'id': dataSet.id, 'name': dataSet.name, 'records': records});
  }

  if (!dataSet) {
    callback({});
    return;
  }

  if (dataSet.records) {
    callback(dataSet);
  } else {
    retrieveRecords(dataSet.source, dataSet.query, successRecordsRetrieval);
  }

}

// dataSetName, dataSourceId, query, dataParser
module.exports.createDataSet = function(dataSetInfo, callback) {
  var id = dataSetInfo.id || dataSets.length;
  var name = dataSetInfo.name;
  var sourceId = dataSetInfo.source;
  var query = dataSetInfo.query;
  var records = dataSetInfo.records;
  var staticData = dataSetInfo.staticData;
  var successRecordsRetrieval = function(records){
    callback(addDataSet({'id': id, 'name': name, 'records': records}));
  }

  if(id && dataSets[id]){
    id = id;
  }
  else{
    if(records){
      callback(addDataSet({'id' : id, 'name' : name, 'records' : records}));
    }
    else{
      if (!query) {
         console.error('Data query not available')
         callback(-1);
         return;
       }
      if (!dataSources[sourceId]) {
        console.error('Unknown data source: ' + sourceId);
        callback(-1);
        return;
      }
      if (staticData) {
        retrieveRecords(sourceId, query, successRecordsRetrieval);
      } else {
        callback(addDataSet({'id': id, 'name': name, 'source': sourceId, 'query': query}));
      }
    }
  }
}
