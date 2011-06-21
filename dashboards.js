var dashboards = [

  { attrs: { 
      id :0,
      author:"UW" 
    },
    collections: {
      gadgets: {  "models": [
                    {"attrs":{"id":"skyView","url":"/gadgets/skyView.html","property":1,"longitude":-47.17500000000001,"latitude":11.8,"flySpeed":1}},
                    {"attrs":{"id":"nameResolver","url":"/gadgets/nameResolver.html"}},{"attrs":{"id":"dataSetSelector","url":"/gadgets/dataSetSelector.html"}},
                    {"attrs":{"id":"dataInquirer","url":"/gadgets/dataInquirer.html"}},{"attrs":{"id":"tableView","url":"/gadgets/tableView.html"}},
                    {"attrs":{"id":"plotView","url":"/gadgets/plotView.html"}}]}
    }
  },
  { attrs: { 
       id :1,
       author: 'GalaxyZOO'
     },
     collections: {
       gadgets: {  "models": [
                     {"attrs":{"id":"skyView","url":"/gadgets/skyView.html","property":1,"longitude":-47.17500000000001,"latitude":11.8,"flySpeed":1}},
                     {"attrs":{"id":"nameResolver","url":"/gadgets/nameResolver.html"}},{"attrs":{"id":"dataSetSelector","url":"/gadgets/dataSetSelector.html"}},
                     {"attrs":{"id":"dataInquirer","url":"/gadgets/dataInquirer.html"}},{"attrs":{"id":"tableView","url":"/gadgets/tableView.html"}}]}
     }
   },
   { attrs: { 
        id :2,
        author: "GalaxyZoo" 
      },
      collections: {
        "gadgets": {  "models": [
                      {"attrs":{"id":"skyView","url":"/gadgets/skyView.html","property":1,"longitude":-47.17500000000001,"latitude":11.8,"flySpeed":1}},
                      {"attrs":{"id":"nameResolver","url":"/gadgets/nameResolver.html"}},{"attrs":{"id":"dataSetSelector","url":"/gadgets/dataSetSelector.html"}}]}
      }
  },
  { attrs: { 
        id :3,
        author: 'Spencer',
        name: 'ScalableScatterPlot' 
      },
      collections: {
        "gadgets": {  "models": [
                      {"attrs":{"id":"skyView","url":"/gadgets/skyView.html","property":1,"longitude":-47.17500000000001,"latitude":11.8,"flySpeed":1}},
                      {"attrs":{"id":"nameResolver","url":"/gadgets/nameResolver.html"}},{"attrs":{"id":"dataSetSelector","url":"/gadgets/dataSetSelector.html"}}]}
      }
  },
<<<<<<< HEAD
  {
    id: 3,
    author: 'Spencer',
    name : 'histViewAndScatterPlot',
    gadgets: [
     {"id":"ASCIIDataLoader","url":"/gadgets/ASCIIDataLoader.html"},
     {"id":"histView","url":"/gadgets/histView.html"},
     {"id":"dataInquirer","url":"/gadgets/dataInquirer.html"},
     {"id":"scalableScatter","url":"/gadgets/scalableScatter.html"},
     {"id":"tableView","url":"/gadgets/tableView.html"}
    ],
    "dataSets": []
=======
  { attrs: { 
        id: 4,
        author: 'Spencer',
        name: 'histView' 
      },
      collections: {
        "gadgets": {  "models": [
                      {"attrs":{"id":"histView","url":"/gadgets/histView.html"}},
                      {"attrs":{"id":"dataInquirer","url":"/gadgets/dataInquirer.html"}},
                      {"attrs":{"id":"scalableScatter","url":"/gadgets/scalableScatter.html"}},
                      {"attrs":{"id":"tableView","url":"/gadgets/tableView.html"}}]}
      }
>>>>>>> 5283de1be53ce5d49799dc7141b9f4f4c3acb9c1
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
                      {"attrs":{"id":"skyView","url":"/gadgets/skyView.html","property":1,"longitude":-47.17500000000001,"latitude":11.8,"flySpeed":1}},
                      {"attrs":{"id":"nameResolver","url":"/gadgets/nameResolver.html"}},{"attrs":{"id":"dataSetSelector","url":"/gadgets/dataSetSelector.html"}},
                      {"attrs":{"id":"dataInquirer","url":"/gadgets/dataInquirer.html"}},{"attrs":{"id":"tableView","url":"/gadgets/tableView.html"}},
                      {"attrs":{"id":"plotView","url":"/gadgets/plotView.html"}}]},
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
