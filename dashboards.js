var dashboards = [

  {
    id: 0,
    author : 'UW',
    gadgets: [
     {"id":"skyView","url":"/gadgets/skyView.html","property":1,"longitude":-47.17500000000001,"latitude":11.8,"flySpeed":1},
     {"id":"nameResolver","url":"/gadgets/nameResolver.html"},
     {"id":"dataSetSelector","url":"/gadgets/dataSetSelector.html"},
     {"id":"dataInquirer","url":"/gadgets/dataInquirer.html"},
     {"id":"tableView","url":"/gadgets/tableView.html"},
     {"id":"plotView","url":"/gadgets/plotView.html"}
    ],
    "dataSets": []
  },
  {
    id: 1,
    author : 'GalaxyZOO',
    gadgets: [
     {"id":"skyView","url":"/gadgets/skyView.html","property":1,"longitude":10,"latitude":-11.622555555555556, "flySpeed":1},
     {"id":"nameResolver","url":"/gadgets/nameResolver.html"},
     {"id":"dataInquirer","url":"/gadgets/dataInquirer.html"},
    ],
    "dataSets": []
  },
  {
    id: 2,
    name : 'GalaxyZoo',
    gadgets: [
     {"id":"skyView","url":"/gadgets/skyView.html","property":1,"longitude":0,"latitude":0,"flySpeed":1},
     {"id":"nameResolver","url":"/gadgets/nameResolver.html"},
    ],
    "dataSets": []
  }

];

module.exports.all = dashboards;

module.exports.find = function(id) {
  id = parseInt(id, 10);
  var found = null;
  dashboardLoop: for(dashboard_index in dashboards) {
    var dashboard = dashboards[dashboard_index];
    if (dashboard.id == id) {
      found = dashboard;
      break dashboardLoop;
    }    
  };
  return found;
}

module.exports.set = function(id, dashboard) {
  id = parseInt(id, 10);
  dashboard.id = id;
  dashboards[id - 1] = dashboard;
};

module.exports.length = function() {
  return dashboards.length;
}

module.exports.new = function() {
  var newId = dashboards.length;
  dashboards.push({
    id: newId,
    author : 'UW',
    gadgets: [
     {"id":"skyView","url":"/gadgets/skyView.html","property":1,"longitude": 0,"latitude": 0,"flySpeed":1},
     {"id":"nameResolver","url":"/gadgets/nameResolver.html"},
     {"id":"dataSetSelector","url":"/gadgets/dataSetSelector.html"},
     {"id":"dataInquirer","url":"/gadgets/dataInquirer.html"},
     {"id":"tableView","url":"/gadgets/tableView.html"},
     {"id":"plotView","url":"/gadgets/plotView.html"}
    ],
    "dataSets": []
  });
  
  return newId;

}

module.exports.insert = function(dashboard) {
  var id = dashboards.length + 1;
  dashboard.id = id;
  dashboards[id - 1] = dashboard;
  return id;
}