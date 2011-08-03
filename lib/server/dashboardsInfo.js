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

module.exports.new = function(configuration) {
  var newId = dashboards.length;
  var gadgets = {skyView: 1, nameResolver: 1, dataSetSelector: 1, dataInquirer: 1, tableView: 1, plotView: 1};
  var i;
  var newDashboard = {
      id: newId,
      author: 'UW',
      numberOfColumns: 2,  
      gadgets: [],
  };
  var dataSet;
  
  if(configuration){
  
    newDashboard['dataSets'] = configuration.dataSets || {};
    if(configuration.dataQuery){
      dataSet = dataLoader(configuration.dataQuery);
      newDashboard.dataSets[dataSet.id] = dataSet.records;
    }
  
  }
  
  for(id in gadgets){
    i = gadgets[id];
    for(i; i>0; --i){
      newDashboard.gadgets.push({'id': id + i, 'gadgetInfoId': id});
    }
  }
  
  dashboards.push(newDashboard);
  return newId;
}

module.exports.insert = function(dashboard) {
  var id = dashboards.length + 1;
  dashboard.attrs.id = id;
  dashboards[id - 1] = dashboard;
  return id;
}
