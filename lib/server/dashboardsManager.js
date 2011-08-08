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

var defaultGadgetsSet = {skyView: 1, nameResolver: 1, dataSetSelector: 1, dataInquirer: 1, tableView: 1, plotView: 1};

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

module.exports.new = function(configuration, callback) {
  var gadgets = configuration.gadgets || defaultGadgetsSet;
  var i;
  var newDashboardId = dashboards.length;  
  var newDashboard = {
      id: newDashboardId,
      author: 'UW',
      numberOfColumns: 2,  
      gadgets: [],
      dataSets: []
  };
  var dataSetsInfo = configuration.dataSets;  
  var currentDataSet = dataSetsInfo? dataSetsInfo.length : 0;
  var remainingDataSets = dataSetsInfo? dataSetsInfo.length : 0;
  
  var dataSetLoaded = function(dataSetId){
    newDashboard.dataSets.push(dataSetId);
    remainingDataSets--;
    if(remainingDataSets == 0){
      callback(newDashboardId);
    }
  }
  
  dashboards.push(newDashboard);
  
  for(id in gadgets){
    i = gadgets[id];
    for(i; i>0; --i){
      newDashboard.gadgets.push({'id': id + i, 'gadgetInfoId': id});
    }
  }
  
  if(currentDataSet){
    while(currentDataSet--){
      dataSetsManager.loadDataSet(dataSetsInfo[currentDataSet], dataSetLoaded);
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
