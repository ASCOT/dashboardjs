var dataSetsManager = require("./dataSetsManager");
var async = require('async');

var idCounter = 0;

var defaultDashboards = [
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
    numberOfColumns: 2, 
    gadgetsOrder: ["dataInquirer", "fitsViewer", "plotView"], 
    gadgets: {
      "dataInquirer" :  { "id" : "dataInquirer", "gadgetInfoId" : "dataInquirer"},
      "fitsViewer" : { "id" : "fitsViewer", "gadgetInfoId" : "fitsViewer"},
      "plotView" :  {"id" : "plotView", "gadgetInfoId" : "plotView"}
    },
    dataSets: {},
    comments: []
  },
  { author: 'Spencer',
    name: 'astroJsFitsViewer',
    numberOfColumns: 2, 
    gadgetsOrder: ["dataInquirer", "astroJsFitsViewer", "plotView"], 
    gadgets: {
      "dataInquirer" :  { "id" : "dataInquirer", "gadgetInfoId" : "dataInquirer"},
      "astroJsFitsViewer" : { "id" : "astroJsFitsViewer", "gadgetInfoId" : "astroJsFitsViewer"},
      "plotView" :  {"id" : "plotView", "gadgetInfoId" : "plotView"}
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
  }
];

var defaultGadgetsSet = {fitsViewer: { number: 1 }, dataInquirer: { number: 1}};

module.exports = function(app, model) {

  var createDashboard = function(dashboardObj, callback) {
    var data = {};
    var dashboardCreated = function() {
      callback(dashboardObj.id);  
    }
    dashboardObj.id = idCounter.toString();
    data.snapshot = dashboardObj;
    model.create(dashboardObj.id, 'json', data, callback);
    idCounter++;
  }

  var cloneObject = function(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
  }
    
  var parseConfiguration = function(configuration, callback) {
    var i;
    var newDashboard = {
        author: 'UW',
        numberOfColumns: 1,
        gadgetsOrder : [],  
        gadgets: {},
        dataSets: {},
        comments: []
    };

    var gadgets = (configuration && configuration.gadgets) || defaultGadgetsSet;
    var dataSets = (configuration && configuration.dataSets) || [];  
    var currentDataSet = dataSets.length;
    var newGadget;
    
    var dataSetsLoaded = function(err, dataSetsIds){ 
      var newDataSet;
      var i = 0; 
      if (!err) {
        while (i < dataSetsIds.length) {
          dataSet = { "id" : dataSetsIds[i], "modifiers" : [] };
          newDashboard.dataSets[dataSet.id] = dataSet;  
          i += 1; 
        }
        callback(newDashboard);
      }
    };
      
    // Expand list of gadgets  
    for(id in gadgets){
      if (gadgets.hasOwnProperty(id)) {
        i = gadgets[id].number;
        for(i; i>0; --i){
          newGadget = {};
          newGadget['id'] = id + i;
          newGadget['gadgetInfoId'] = id;
          if(gadgets[id].state){
            newGadget['state'] = gadgets[id].state;
          }
          newDashboard.gadgets[newGadget.id] = newGadget;
          newDashboard.gadgetsOrder.push(newGadget.id);
        }
      }
    }

    // Load Data Sets
    async.map(
      dataSets,
      function(dataSetInfo, callback){
        dataSetsManager.createDataSet(dataSetInfo, 
        function(id) {
          callback(null, id);
        }
      );
      },
      dataSetsLoaded
    );

  };

  async.forEach(
    defaultDashboards, 
    createDashboard,
    function(err) {
      if (!err) {
        console.log("Dashboards initialized!");
      }  
    }
  );

  //// REST API ////

  app.get('/dashboard/gadgets/', function(req, res){
    res.send(JSON.stringify(dashboardsManager.find(req.params.id)));
  });

  app.get('/dashboard/:id', function(req, res){
    res.render("dashboardPanel", {
      locals: {
        id: req.params.id,
        resourceUrl: '"/dashboard"'
      }
    });
  });

  app.post('/dashboard/', function(req, res){
    var configuration = req.body || undefined;
    async.waterfall([
      function(callback) {
        parseConfiguration(configuration, 
          function(dashboard) {
            callback(null, dashboard);
          });
      },
      function(dashboard, callback){
      	console.log(dashboard);
        createDashboard(dashboard, 
          function() {
            callback(null, dashboard.id);
          });
      },
      function(dashboardId, callback){
        res.send(dashboardId.toString());
      }
    ]);
  });

  app.post ('/dashboard/:id', function(req, res){
    var state = req.body || undefined;
    dashboardsManager.set(req.params.id, state);
    res.send("Dashboard saved");
  });

  app.post('/forkdashboard/:id', function(req, res){
      var data = {};
      async.waterfall([
      function(callback) {
        if (req.params.id) {
          app.model.getSnapshot(req.params.id, callback); 
        }
      },
      function(dashboard, callback) {
        data.snapshot = cloneObject(dashboard.snapshot);
        data.snapshot.id = idCounter.toString();
        app.model.create(data.snapshot.id, 'json', data, callback);
        idCounter++;
      },
      function() {
        res.send(data.snapshot.id);
      }
    ]);  
  });

};
