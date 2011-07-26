var dashboards = [

  { attrs: { 
      id :0,
      author:"UW",
      numberOfColumns: 2 
    },
    collections: {
      gadgets: {  "models": [
                    {"attrs":{"id":"skyView", "gadgetId": "skyView", "longitude":-47.17500000000001,"latitude":11.8,"flySpeed":1}},
                    {"attrs":{"id":"nameResolver", "gadgetId": "nameResolver"}},
                    {"attrs":{"id":"dataSetSelector", "gadgetId": "dataSetSelector"}},
                    {"attrs":{"id":"dataInquirer", "gadgetId": "dataInquirer"}},
                    {"attrs":{"id":"tableView", "gadgetId": "tableView"}},
                    {"attrs":{"id":"plotView", "gadgetId": "plotView"}}]
              }
    }
  },
  { attrs: { 
       id :1,
       author: 'GalaxyZOO',
       numberOfColumns: 2
     },
     collections: {
       gadgets: {  "models": [
                     {"attrs":{"id":"skyView", "gadgetId": "skyView", "longitude":-47.17500000000001,"latitude":11.8,"flySpeed":1}},
                       {"attrs":{"id":"nameResolver", "gadgetId": "nameResolver"}},
                       {"attrs":{"id":"dataSetSelector", "gadgetId": "dataSetSelector"}},
                       {"attrs":{"id":"dataInquirer", "gadgetId": "dataInquirer"}},
                       {"attrs":{"id":"tableView", "gadgetId": "tableView"}}]
                }
     }
   },
   { attrs: { 
        id :2,
        author: "GalaxyZoo",
        numberOfColumns: 2 
      },
      collections: {
        "gadgets": {  "models": [
                      {"attrs":{"id":"skyView", "gadgetId": "skyView","longitude":-47.17500000000001,"latitude":11.8,"flySpeed":1}},
                      {"attrs":{"id":"nameResolver", "gadgetId": "nameResolver"}},
                      {"attrs":{"id":"dataSetSelector", "gadgetId": "dataSetSelector"}}]
                  }
      }
  },
  { attrs: { 
        id :3,
        author: 'Spencer',
        name: 'fitsViewer',
        numberOfColumns: 1
      },
      collections: {
        "gadgets": {  "models": [
                      {"attrs":{"id":"fitsViewer", "gadgetId": "fitsViewer"}},
                      {"attrs":{"id":"dataInquirer", "gadgetId": "dataInquirer"}}]}
      }
  },
  { attrs: { 
        id :4,
        author: 'Spencer',
        name: 'ScatterPlotHistogramAndASCIILoader',
        numberOfColumns: 2 
      },
      collections: {
        "gadgets": {  "models": [
                        {"attrs":{"id":"asciiFileLoader", "gadgetId": "asciiFileLoader"}},
                        {"attrs":{"id":"nameResolver", "gadgetId": "nameResolver"}},
                        {"attrs":{"id":"dataSetSelector", "gadgetId": "dataSetSelector"}},
                        {"attrs":{"id":"dataInquirer", "gadgetId": "dataInquirer"}},
                        {"attrs":{"id":"tableView", "gadgetId": "tableView"}},
                        {"attrs":{"id":"scalableScatter", "gadgetId": "scalableScatter"}},
                        {"attrs":{"id":"histogramView", "gadgetId": "histogramView"}}]
                  }
      }
  }
];

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

module.exports.new = function(gadgetsList) {
  var newId = dashboards.length;
  var gadgets = gadgetsList || {skyView: 1, nameResolver: 1, dataSetSelector: 1, dataInquirer: 1, tableView: 1, plotView: 1};
  var i;
  var newDashboard = {
     attrs: { 
        id: newId,
        author:"UW" 
      },
      collections: {
        gadgets: {  models: [] }
      }
  }
  for(gadgetId in gadgets){
    i = gadgets[gadgetId];
    for(i; i>0; --i){
      newDashboard.collections.gadgets.models.push({ attrs: { id: gadgetId + i, 'gadgetId': gadgetId} });
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
