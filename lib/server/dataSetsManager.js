var XMLHttpRequest = require("./XMLHttpRequest").XMLHttpRequest;
var xmlParser = require('libxmljs');
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

var parseSDSSQueryResult = function(queryResult){
  var doc = xmlParser.parseXmlString(queryResult);
  var rows = doc.get('//Answer').childNodes();
  var rowsNumber = rows.length;
  var currentRow;
  var currentRowAttributes;
  var records = [];
  var newRecord;
  for(var i = 0; i < rowsNumber; ++i){
    currentRowAttributes = rows[i].attrs();
    newRecord = {};
    for(var j = 0; j < currentRowAttributes.length; j++){
      newRecord[currentRowAttributes[j].name()] = currentRowAttributes[j].value();
    }
    records.push(newRecord); 
  }
  return records;
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
    url: 'http://skyserver.sdss3.org/public/en/tools/search/x_sql.asp',
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

module.exports.find = function(id) {
  id = parseInt(id, 10);
  return dataSets[id] || {};
}

// dataSetName, dataSourceId, query, dataParser
module.exports.loadDataSet = function(dataSetInfo, callback) {
  
  var id = dataSetInfo.id || dataSets.length;
  var name = dataSetInfo.name;
  var sourceId = dataSetInfo.source;
  var queryResultParser = dataSetInfo.queryResultParser;
  var query = dataSetInfo.query;
  var records = dataSetInfo.records;
  var dataInquirer = dataSetInfo.dataInquirer;
  var processQueryResult = function(queryResult){
    records = queryResultParser(queryResult) || [];
    callback(addDataSet({'id': id, 'name': name, 'records': records}));
  }
  
  if(id && dataSets[id]){
    id = id;
  }
  else{
    if(records){
      callback(addDataSet({'id': id, 'name': name, 'records': records}));
    }
    else{
      if(!query){
         console.error('Data query not available')
         callback(-1);
       }
       else{
         if(!dataSources[sourceId]){
            console.error('Unknown data source: ' + sourceId);
            callback(-1);
         }
         else{
         dataInquirer = dataInquirer || dataSources[sourceId].dataInquirer;
         if(!dataInquirer){
            console.error("ASCOT doesn't know how to query the data source: " + sourceId + " No default method and no function provided");
            callback(-1);
         }
         else{
           queryResultParser = queryResultParser || dataSources[sourceId].queryResultParser;
           if(!queryResultParser){
             console.error('Parser not available for ' + sourceId);
             callback(-1);
            }
            else{   
              dataInquirer(query, processQueryResult);  
           } 
          }
        } 
      }
    }
  }
}


  
  