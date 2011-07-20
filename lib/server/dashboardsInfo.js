var dashboards = [

  { attrs: { 
      id :0,
      author:"UW",
      numberOfColumns: 2 
    },
    collections: {
      gadgets: {  "models": [
                    {"attrs":{"id":"skyView","longitude":-47.17500000000001,"latitude":11.8,"flySpeed":1}},
                    {"attrs":{"id":"nameResolver"}},
                    {"attrs":{"id":"dataSetSelector"}},
                    {"attrs":{"id":"dataInquirer"}},
                    {"attrs":{"id":"tableView"}},
                    {"attrs":{"id":"plotView"}}]}
    }
  },
  { attrs: { 
       id :1,
       author: 'GalaxyZOO',
       numberOfColumns: 2
     },
     collections: {
       gadgets: {  "models": [
                     {"attrs":{"id":"skyView","longitude":-47.17500000000001,"latitude":11.8,"flySpeed":1}},
                     {"attrs":{"id":"nameResolver"}},
                     {"attrs":{"id":"dataSetSelector"}},
                     {"attrs":{"id":"dataInquirer"}},
                     {"attrs":{"id":"tableView"}}]}
     }
   },
   { attrs: { 
        id :2,
        author: "GalaxyZoo",
        numberOfColumns: 2 
      },
      collections: {
        "gadgets": {  "models": [
                      {"attrs":{"id":"skyView","longitude":-47.17500000000001,"latitude":11.8,"flySpeed":1}},
                      {"attrs":{"id":"nameResolver"}},
                      {"attrs":{"id":"dataSetSelector"}}]}
      }
  },
  { attrs: { 
        id :3,
        author: 'Spencer',
        name: 'FITSViewer',
        numberOfColumns: 1
      },
      collections: {
        "gadgets": {  "models": [
                      {"attrs":{"id":"FITSViewer"}}]}
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
                        {"attrs":{"id":"ASCIIDataLoader"}},
                        {"attrs":{"id":"nameResolver"}},
                        {"attrs":{"id":"dataSetSelector"}},
                        {"attrs":{"id":"dataInquirer"}},
                        {"attrs":{"id":"dataSetSelector"}},
                        {"attrs":{"id":"scalableScatter"}},
                        {"attrs":{"id":"histogramView"}},
                        {"attrs":{"id":"tableView"}}]
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

module.exports.new = function() {
  var newId = dashboards.length;
  dashboards.push({
    attrs: { 
      id: newId,
      author:"UW" 
    },
    collections: {
      gadgets: {  models: [
                      {"attrs":{"id":"skyView", "longitude":-47.17500000000001,"latitude":11.8,"flySpeed":1}},
                      {"attrs":{"id":"nameResolver"}},
                      {"attrs":{"id":"dataSetSelector"}},
                      {"attrs":{"id":"dataInquirer"}},
                      {"attrs":{"id":"tableView"}},
                      {"attrs":{"id":"plotView"}}]}
    }
  });
  return newId;
}

module.exports.insert = function(dashboard) {
  var id = dashboards.length + 1;
  dashboard.attrs.id = id;
  dashboards[id - 1] = dashboard;
  return id;
}
