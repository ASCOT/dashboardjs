// Module dependencies
var http = require('http');
var url = require('url');
var util = require('util');
var sys = require('sys');
var FFI = require("node-ffi");
var exec = require('child_process').exec;

var express = require('express');
var dashboards = require('./lib/server/dashboardsInfo');
var gadgets = require('./static/gadgets/gadgetsInfo');
var XMLHttpRequest = require("./lib/server/XMLHttpRequest").XMLHttpRequest;
  
var app = express.createServer();
var nowjs = require('now')
var everyone = nowjs.initialize(app);

everyone.now.sendMessageToDashboard = function(message, dashboardId){
  var dashboardChannel = nowjs.getGroup(dashboardId);
  dashboardChannel.now.receiveMessage(message);
}

everyone.now.addUserToDashboardChannel = function(dashboardId){
   var dashboardChannel = nowjs.getGroup(dashboardId);
   dashboardChannel.addUser(this.user.clientId);
   dashboardChannel.now.userAddedToDashboardChannel(this.user.clientId);
}

everyone.now.notifyToDashboard = function(dashboardId, notification){
   var dashboardChannel = nowjs.getGroup(dashboardId);
   dashboardChannel.now.receiveNotification(this.user.clientId, notification);
} 

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.use(express.bodyParser());
  app.set('view engine', 'mustache');
  app.register(".mustache", require('stache'));
  app.set('view options', {layout: false });
  app.use(express.static(__dirname + '/lib/client'));
  app.use(express.static(__dirname + '/lib/shared'));  
  app.use(express.static(__dirname + '/static'));  
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Convert a FITS file into a thumbnail and raw data
app.get('/convertFITS/:file', function(req, res){
	
	console.log('executing shell script');
	var libc = new FFI.Library(null, {
 	 		"system": ["int32", ["string"]]
			});

	var run = libc.system;
	// Remove all previous file created by the converter
	run("cd ./static/images/FITSConverter; rm header.js; rm tile*.js; rm thumb.jpg;");
	// Convert the next fits image
	run("cd ./static/images/FITSConverter; ./extractFitsFrame ../"+req.params.file+" 0 512;");
	console.log('shell script done');
	res.send('done');
	/*console.log('executing shell script');
	var commandExecuted = function(error, stdout, stderr) {
		sys.print('stdout: ' + stdout);
  		sys.print('stderr: ' + stderr);
  		console.log('shell script done');
  		res.send('done');
	}
	var command = "cd ./static/images/FITSConverter; ./extractFitsFrame ../"+req.params.file+" 0 512;";
	// run the shell script
	var child = exec(command, commandExecuted);*/
	
});

app.get('/XmlHttpRequest/:request', function(req, res){

  var xhr = new XMLHttpRequest();
  var httpResponse = "";
  
  xhr.onreadystatechange = function() {
	console.log("State: " + this.readyState);
	
	 // Receiving response
	 if (this.readyState == 3) {
		  httpResponse += this.responseText;
      console.log(util.inspect(process.memoryUsage()));
	 }

   // End of response
	 if (this.readyState == 4) {
		httpResponse += this.responseText;
    res.send(this.responseText);
	 }
	 
  };

  xhr.open("GET", req.params.request);
  xhr.send();
    
});

app.get('/dashboards/gadgets/', function(req, res){
  res.send(JSON.stringify(dashboards.find(req.params.id)));
});

app.get('/dashboards/:id', function(req, res){
  res.render("dashboard", {
    locals: {
      id: req.params.id,
      serviceUrl: '"/dashboards/state/"'
    }
  });
});

app.get('/dashboards/state/:id', function(req, res){
  res.send(JSON.stringify(dashboards.find(req.params.id)));
});

app.put('/saveDashboard/:id', function(req, res){
  dashboards.set(req.params.id, req.body);
});

app.post('/saveDashboard/:id', function(req, res){
  console.log("STATE: " + req.body);
  dashboards.set(req.params.id, req.body);
});

app.get('/gadgets/', function(req, res){
  res.send(gadgets.all);
});

app.post('/newDashboard/:gadgets', function(req, res){
  var gadgetsList = req.params.gadgets !== "undefined"? JSON.parse(req.params.gadgets) : undefined;
  var newDashboardId = dashboards.new(gadgetsList);
  res.send(newDashboardId.toString());
});               

if (!module.parent) {
  app.listen(80);
  console.log("ASCOT server listening on port %d", app.address().port);
}

