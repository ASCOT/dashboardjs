// Node Modules dependencies
var http = require('http');
var url = require('url');
var exec = require('child_process').exec;
var _ = require('underscore');
var express = require('express');
var sharejs = require('../share/').server;
var faye = require('faye');
var async = require('async');
require('util');

// Local Modules
var dashboardsManager = require('./js/server/dashboardsManager');
var dataSetsManager = require('./js/server/dataSetsManager');
var gadgets = require('./public/gadgets/gadgetsInfo');
var xhr = require("./js/shared/xhr");

var app = express.createServer();

var dashboardId = 0;

// Share JS
var options = {
  rest: { path : '/dashboard/:name/state'},
  db: { type: 'none'},
  auth: function(client, action) {
    // This auth handler rejects any ops bound for docs starting with 'readonly'.
    if (action.name === 'submit op' && action.docName.match(/^readonly/)) {
      action.reject();
    } else {
      action.accept();
    }
  }
};

// Lets try and enable redis persistance if redis is installed...
try {
  require('redis');
  options.db = {type: 'redis'};
} catch (e) {}


// Attach the sharejs REST and Socket.io interfaces to the server
sharejs.attach(app, options);

var createDashboard = function(dashboardObj, callback) {
  var data = {};
  dashboardObj.id = dashboardId.toString();
  data.snapshot = dashboardObj;
  app.model.create(dashboardObj.id, 'json', data, callback);
  dashboardId++;
}

async.forEach(
  dashboardsManager.all, 
  createDashboard,
  function(err) {
    if (!err) {
      console.log("Dashboards initialized!")
    }  
  });
  
adapter = new faye.NodeAdapter({ mount: '/faye', timeout: 45 });
adapter.attach(app)
 
// Configuration
app.configure(function(){
  app.set('views', __dirname + '/templates');
  app.set('view engine', 'mustache');
  app.register(".mustache", require('stache'));
  app.set('view options', {layout: false });
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/js/client'));
  app.use(express.static(__dirname + '/js/shared'));  
  app.use(express.static(__dirname + '/public')); 
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

app.get('/xhrProxy/:request', function(req, res){
  var options = {
    url: req.params.request,
    type: "GET",
    success: function(response) { res.send(response); }
  }
  xhr.ajax(options); 
});

app.get('/dashboard/gadgets/', function(req, res){
  res.send(JSON.stringify(dashboardsManager.find(req.params.id)));
});

app.get('/gadgets/', function(req, res){
  res.send(gadgets.all);
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
  var dashboardCreated = function(dashboardId){
    res.send(dashboardId.toString());
  }
  dashboardsManager.create(configuration, dashboardCreated);
});

app.post('/dashboard/:id', function(req, res){
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
      data.snapshot = JSON.parse(JSON.stringify(dashboard.snapshot));
      data.snapshot.id = dashboardId.toString();
      app.model.create(data.snapshot.id, 'json', data, callback);
      dashboardId++;
    },
    function() {
      res.send(data.snapshot.id);
    }
  ]);  
});

//app.get('/dashboard/:id/state', function(req, res){
//  res.send(JSON.stringify(dashboardsManager.find(req.params.id)));
//});

app.get('/dataSet/:id', function(req, res){
  var dataSetFound = function (dataSet) {
    res.send(JSON.stringify(dataSet));
  };
  dataSetsManager.find(req.params.id, dataSetFound);
});  

app.post('/dataSet/', function(req, res){
  var queryInfo = req.body || undefined;
  console.log("DATASET : " + req.body);
  var dataSetCreated = function(dataSet){
    res.send(JSON.stringify(dataSet));
  }
  dataSetsManager.createDataSet(queryInfo, dataSetCreated);
});           

if (!module.parent) {
  app.listen(80);
  console.log("ASCOT server listening on port %d", app.address().port);
}