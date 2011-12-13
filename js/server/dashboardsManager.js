var dataSetsManager = require("./dataSetsManager");

var dashboards = [

  { author: 'UW',
    numberOfColumns: 2,
    gadgetsOrder: [ "skyView", "nameResolver", "dataSetSelector", "dataInquirer", "tableView", "plotView"], 
    gadgets: {
      "skyView" : { "id" : "skyView", "gadgetInfoId" : "skyView", state: { "longitude" : -47.17500000000001, "latitude" : 11.8, "flySpeed" : 1}},
      "nameResolver" :  { "id" : "nameResolver", "gadgetInfoId" : "nameResolver"},
      "dataSetSelector" : { "id" : "dataSetSelector", "gadgetInfoId" : "dataSetSelector"},
      "dataInquirer" : { "id" : "dataInquirer", "gadgetInfoId" : "dataInquirer"},
      "tableView" : { "id" : "tableView", "gadgetInfoId" : "tableView"},
      "plotView" :  {"id" : "plotView", "gadgetInfoId" : "plotView"} 
    },
    dataSets: {},
    comments: []
  },
  { author: 'GalaxyZOO',
    numberOfColumns: 2, 
    gadgetsOrder: [ "skyView", "nameResolver", "dataSetSelector", "dataInquirer", "tableView"], 
    gadgets: {
      "skyView" : { "id" : "skyView", "gadgetInfoId" : "skyView", state: { "longitude" : -47.17500000000001, "latitude" : 11.8, "flySpeed" : 1}},
      "nameResolver" :  { "id" : "nameResolver", "gadgetInfoId" : "nameResolver"},
      "dataSetSelector" : { "id" : "dataSetSelector", "gadgetInfoId" : "dataSetSelector"},
      "dataInquirer" : { "id" : "dataInquirer", "gadgetInfoId" : "dataInquirer"},
      "tableView" : { "id" : "tableView", "gadgetInfoId" : "tableView"}
    },
    dataSets: {},
    comments: []
  },
  { author: 'GalaxyZOO',
    numberOfColumns: 2, 
    gadgetsOrder: [ "skyView", "nameResolver", "dataSetSelector"], 
    gadgets: {
      "skyView" : { "id" : "skyView", "gadgetInfoId" : "skyView", state: { "longitude" : -47.17500000000001, "latitude" : 11.8, "flySpeed" : 1}},
      "nameResolver" :  { "id" : "nameResolver", "gadgetInfoId" : "nameResolver"},
      "dataSetSelector" : { "id" : "dataSetSelector", "gadgetInfoId" : "dataSetSelector"}
    },
    dataSets: {},
    comments: []
  },
  { author: 'Spencer',
    name: 'fitsViewer',
    numberOfColumns: 1, 
    gadgetsOrder: [ "skyView", "nameResolver", "dataSetSelector", "dataInquirer", "tableView"], 
    gadgets: {
      "fitsViewer" : { "id" : "fitsViewer", "gadgetInfoId" : "fitsViewer"},
      "asciiFileLoader" : { "id" : "asciiFileLoader", "gadgetInfoId" : "asciiFileLoader"},
      "dataInquirer" :  { "id" : "dataInquirer", "gadgetInfoId" : "dataInquirer"},
      "scalableScatter" : {"id" : "scalableScatter", "gadgetInfoId" : "scalableScatter"} 
    },
    dataSets: {},
    comments: []
  },
  { author: 'Spencer',
    name: 'ScatterPlotHistogramAndASCIILoader',
    numberOfColumns: 2, 
    gadgetsOrder: [ "asciiFileLoader", "nameResolver", "dataSetSelector", "dataInquirer", "tableView", "scalableScatter", "histogramView"], 
    gadgets: {
      "asciiFileLoader" : {"id" : "asciiFileLoader", "gadgetInfoId" : "asciiFileLoader"},
      "nameResolver" :  { "id" : "nameResolver", "gadgetInfoId" : "nameResolver"},
      "dataSetSelector" : { "id" : "dataSetSelector", "gadgetInfoId" : "dataSetSelector"},
      "dataInquirer" : { "id" : "dataInquirer", "gadgetInfoId" : "dataInquirer"},
      "tableView" : { "id" : "tableView", "gadgetInfoId" : "tableView"},
      "scalableScatter" :  { "id" : "scalableScatter", "gadgetInfoId" : "scalableScatter"},
      "histogramView" : { "id" : "histogramView", "gadgetInfoId" : "histogramView"}
    },
    dataSets: {},
    comments: []
  },
  { author : 'Diego',
    numberOfColumns : 1,
    gadgetsOrder: ["newFitsViewer1"], 
    gadgets: { "newFitsViewer1" : {"id" : "newFitsViewer1", "gadgetInfoId" : "newFitsViewer"} },
    dataSets: {},
    comments: []
  }];

module.exports.all = dashboards;

var defaultGadgetsSet = {skyView: { number: 1 }, nameResolver: { number: 1 }, dataSetSelector: { number: 1 }, dataInquirer: { number: 1 }, tableView: { number: 1 }, plotView: { number: 1 }};

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}


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
};

module.exports.create = function(configuration, callback) {
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
      dashboards.push(newDashboard);
      callback(newDashboardId);
    }
  }
    
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
    dashboards.push(newDashboard);
    callback(newDashboardId);
  }
};

module.exports.copy = function(id, success, error){
  var dashboardConfiguration = clone(dashboards[id]);
  if (dashboardConfiguration) {
    dashboards.push(dashboardConfiguration);
    dashboards[dashboards.length - 1].id = dashboards.length - 1;
    success(dashboards.length - 1);
  } else {
    error();
  }
};

module.exports.insert = function(dashboard) {
  var id = dashboards.length + 1;
  dashboard.attrs.id = id;
  dashboards[id - 1] = dashboard;
  return id;
}
