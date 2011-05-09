// Module dependencies
var http = require('http');
var url = require('url');
var util = require('util');


var express = require('express');
var dashboards = require('./dashboards');
var XMLHttpRequest = require("./XMLHttpRequest").XMLHttpRequest;

var app = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'mustache');
  app.register(".mustache", require('stache'));
  app.set('view options', {layout: false });
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

app.get('/XmlHttpRequest/:request', function(req, res){

  var xhr = new XMLHttpRequest();
  
  var httpResponse = "";
  
  xhr.onreadystatechange = function() {
	console.log("State: " + this.readyState);
	
	 // Receiving response
	 if (this.readyState == 3) {
		  httpResponse += this.responseText;
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

app.get('/dashboards/:id', function(req, res){
  res.render("dashboard", {
    locals: {
      id: req.params.id,
      serviceUrl: '"/dashboards/state/"'
    }
  });
});

app.get('/saveStateRequest/', function(req, res){
  res.send(dashboards.length().toString());
});

app.put('/dashboards/state/:id:state', function(req, res){
  console.log("PUT");
  console.log(JSON.stringify(req.params.state));
});

app.post('/dashboards/state/:id', function(req, res){
  console.log("POST");
  console.log(JSON.stringify(req.params.id));
});

app.get('/dashboards/state/:id', function(req, res){
  res.send(JSON.stringify(dashboards.find(req.params.id)));
});

if (!module.parent) {
  app.listen(80);
  console.log("ASCOT server listening on port %d", app.address().port);
}

// Routes
/*
app.get('/', function(req, res){
  res.render('index', {
    title: 'Express'
  });
});
*/

