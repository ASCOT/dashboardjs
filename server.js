// Module dependencies
var http = require('http');
var url = require('url');
var util = require('util');
var sys = require('sys');
var FFI = require('node-ffi');
var exec = require('child_process').exec;
var _ = require('underscore');

// SQL access
//var Client = require('mysql').Client,
//    client = new Client();
//client.host = 'lsst10.ncsa.uiuc.edu';

var express = require('express');
var dashboardsManager = require('./lib/server/dashboardsManager');
var dataSetsManager = require('./lib/server/dataSetsManager');

var gadgets = require('./resources/gadgets/gadgetsInfo');
var xhr = require("./lib/shared/xhr");
  
var app = express.createServer();
var nowjs = require('now')
var everyone = nowjs.initialize(app);

everyone.now.sendMessageToDashboard = function(message, dashboardId){
  var dashboardChannel = nowjs.getGroup(dashboardId);
  dashboardChannel.exclude([this.user.clientId]).now.receiveMessage(message);
};

everyone.now.addUserToDashboardChannel = function(dashboardId){
   var dashboardChannel = nowjs.getGroup(dashboardId);
   dashboardChannel.addUser(this.user.clientId);
   this.now.userAddedToDashboardChannel(this.user.clientId);
};

everyone.now.notifyToDashboard = function(dashboardId, notification){
   var dashboardChannel = nowjs.getGroup(dashboardId);
   dashboardChannel.exclude([this.user.clientId]).now.receiveNotification(this.user.clientId, notification);
}; 

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/templates');
  app.use(express.bodyParser());
  app.set('view engine', 'mustache');
  app.register(".mustache", require('stache'));
  app.set('view options', {layout: false });
  app.use(express.static(__dirname + '/doc')); 
  app.use(express.static(__dirname + '/lib/client'));
  app.use(express.static(__dirname + '/lib/shared'));  
  app.use(express.static(__dirname + '/resources')); 
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

app.get('/SQLQuery/:login' , function(req, res) {
	console.log('doing query');
	
	var login = req.params.login;
	var splitLogin = login.split(' ');
	
	client.user = splitLogin[0];
	client.password = splitLogin[1];
	
	client.query('use test;');
	client.query('select * from DbStorage_Test_1;', function cb(err, results, fields) {
			res.send(results);
	});
	client.end();
});

// Convert a FITS file into a thumbnail and raw data
app.get('/convertFITS/:file', function(req, res){
	
	console.log('executing shell script');
	var libc = new FFI.Library(null, {
 	 		"system": ["int32", ["string"]]
			});

	var run = libc.system;
	// Remove all previous files created by the converter
	run("cd ./resources/images/FITSConverter; rm header.js; rm tile*.js; rm thumb.jpg;");
	// Convert the next fits image
	run("cd ./resources/images/FITSConverter; ./extractFitsFrame ../"+req.params.file+" 0 512;");
	console.log('shell script done');
	res.send('done');
	
});

app.get('/XmlHttpRequest/:request', function(req, res){

  var options = {
    url: req.params.request,
    type: "GET",
    success: function(response) { res.send(response); }
  }
  xhr.ajax(options);
    
});

app.get('/dashboards/gadgets/', function(req, res){
  res.send(JSON.stringify(dashboardsManager.find(req.params.id)));
});

app.get('/dashboards/:id', function(req, res){
  res.render("dashboard", {
    locals: {
      id: req.params.id,
      serviceUrl: '"/dashboards/state/"'
    }
  });
});

app.get('/dataSets/:id', function(req, res){
  res.send(JSON.stringify(dataSetsManager.find(req.params.id)));
});

app.get('/dashboards/state/:id', function(req, res){
  res.send(JSON.stringify(dashboardsManager.find(req.params.id)));
});

app.put('/saveDashboard/:id', function(req, res){
  dashboardsManager.set(req.params.id, req.body);
});

app.post('/saveDashboard/:id', function(req, res){
  console.log("STATE: " + req.body);
  dashboardsManager.set(req.params.id, req.body);
});

app.get('/gadgets/', function(req, res){
  res.send(gadgets.all);
});

app.post('/newDashboard/', function(req, res){
  var configuration = req.rawBody? JSON.parse(req.rawBody) : undefined;
  var dashboardCreated = function(dashboardId){
    res.send(dashboardId.toString());
  }
  var newDashboardId = dashboardsManager.new(configuration, dashboardCreated);
});               

if (!module.parent) {
  app.listen(80);
  console.log("ASCOT server listening on port %d", app.address().port);
}

