var dataSetsManager = require("./dataSetsManager");

var dashboards = [

  { id: 0,
    author: 'UW',
    numberOfColumns: 2, 
    gadgets: [ {"id":"skyView", "gadgetInfoId": "skyView", state: {"longitude":-47.17500000000001,"latitude":11.8,"flySpeed":1}},
               {"id":"nameResolver", "gadgetInfoId": "nameResolver"},
               {"id":"dataSetSelector", "gadgetInfoId": "dataSetSelector"},
               {"id":"dataInquirer", "gadgetInfoId": "dataInquirer"},
               {"id":"tableView", "gadgetInfoId": "tableView"},
               {"id":"plotView", "gadgetInfoId": "plotView"} ]
  },
  { id: 1,
    author: 'GalaxyZOO',
    numberOfColumns: 2, 
    gadgets: [ {"id":"skyView", "gadgetInfoId": "skyView", state: {"longitude":-47.17500000000001,"latitude":11.8,"flySpeed":1}},
               {"id":"nameResolver", "gadgetInfoId": "nameResolver"},
               {"id":"dataSetSelector", "gadgetInfoId": "dataSetSelector"},
               {"id":"dataInquirer", "gadgetInfoId": "dataInquirer"},
               {"id":"tableView", "gadgetInfoId": "tableView"} ]
  },
  { id: 2,
    author: 'GalaxyZOO',
    numberOfColumns: 2, 
    gadgets: [ {"id":"skyView", "gadgetInfoId": "skyView", state: {"longitude":-47.17500000000001,"latitude":11.8,"flySpeed":1}},
               {"id":"nameResolver", "gadgetInfoId": "nameResolver"},
               {"id":"dataSetSelector", "gadgetInfoId": "dataSetSelector"} ]
  },
  { id: 3,
    author: 'Spencer',
    name: 'fitsViewer',
    numberOfColumns: 1, 
    gadgets: [ {"id":"fitsViewer", "gadgetInfoId": "fitsViewer"},
               {"id":"asciiFileLoader", "gadgetInfoId": "asciiFileLoader"},
               {"id":"dataInquirer", "gadgetInfoId": "dataInquirer"},
               {"id":"scalableScatter", "gadgetInfoId": "scalableScatter"} ]
  },
  { id: 4,
    author: 'Spencer',
    name: 'ScatterPlotHistogramAndASCIILoader',
    numberOfColumns: 2, 
    gadgets: [ {"id":"asciiFileLoader", "gadgetInfoId": "asciiFileLoader"},
               {"id":"nameResolver", "gadgetInfoId": "nameResolver"},
               {"id":"dataSetSelector", "gadgetInfoId": "dataSetSelector"},
               {"id":"dataInquirer", "gadgetInfoId": "dataInquirer"},
               {"id":"tableView", "gadgetInfoId": "tableView"},
               {"id":"scalableScatter", "gadgetInfoId": "scalableScatter"},
               {"id":"histogramView", "gadgetInfoId": "histogramView"} ]
  } ];

module.exports.all = dashboards;

var defaultGadgetsSet = {skyView: { number: 1 }, nameResolver: { number: 1 }, dataSetSelector: { number: 1 }, dataInquirer: { number: 1 }, tableView: { number: 1 }, plotView: { number: 1 }};

module.exports.find = function(id) {
  id = parseInt(id, 10);
  return dashboards[id];
}

module.exports.set = function(id, dashboard) {
  id = parseInt(id, 10);
  dashboards[id] = dashboard;
};

module.exports.length = function() {
  return dashboards.length;
}

module.exports.createDashboard = function(configuration, callback) {
  var gadgets = configuration? configuration.gadgets || defaultGadgetsSet: defaultGadgetsSet;
  var i;
  var newDashboardId = dashboards.length;  
  var newDashboard = {
      id: newDashboardId,
      author: 'UW',
      numberOfColumns: 2,  
      gadgets: [],
      dataSets: []
  };
  var dataSetsInfo = configuration? configuration.dataSets: undefined;  
  var currentDataSet = dataSetsInfo? dataSetsInfo.length : 0;
  var remainingDataSets = dataSetsInfo? dataSetsInfo.length : 0;
  var newGadget;
  
  var dataSetLoaded = function(dataSetId){
    var dataSet = { "id" : dataSetId, "modifiers" : [] };
    newDashboard.dataSets.push(dataSet);
    remainingDataSets--;
    if(remainingDataSets == 0){
      callback(newDashboardId);
    }
  }
  
  dashboards.push(newDashboard);
  
  for(id in gadgets){
    i = gadgets[id].number;
    for(i; i>0; --i){
      newGadget = {};
      newGadget['id'] = id + i;
      newGadget['gadgetInfoId'] = id;
      if(gadgets[id].state){
        newGadget['state'] = gadgets[id].state;
      }
      newDashboard.gadgets.push(newGadget);
    }
  }
  
  if(currentDataSet){
    while(currentDataSet--){
      dataSetsManager.createDataSet(dataSetsInfo[currentDataSet], dataSetLoaded);
    }
  }
  else{
    callback(newDashboardId);
  }
}

module.exports.insert = function(dashboard) {
  var id = dashboards.length + 1;
  dashboard.attrs.id = id;
  dashboards[id - 1] = dashboard;
  return id;
}
