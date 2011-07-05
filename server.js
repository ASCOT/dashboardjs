// Module dependencies
var http = require('http');
var url = require('url');
var util = require('util');
var io = require('socket.io');

var express = require('express');
var dashboards = require('./server/dashboards');
var XMLHttpRequest = require("./server/XMLHttpRequest").XMLHttpRequest;
  
var app = express.createServer();
var nowjs = require('now')
var everyone = nowjs.initialize(app);
//var socket = io.listen(app); 

everyone.now.sendMessageToDashboard = function(message, dashboardId){
  var dashboardChannel = nowjs.getGroup(dashboardId);
  dashboardChannel.now.receiveMessage(message);
}

everyone.now.addUserToDashboardChannel = function(dashboardId){
   var dashboardChannel = nowjs.getGroup(dashboardId);
   dashboardChannel.addUser(this.user.clientId);
}

everyone.now.notifyToDashboard = function(dashboardId, notification){
   var dashboardChannel = nowjs.getGroup(dashboardId);
   dashboardChannel.now.receiveNotification(notification);
} 

// Closure that keeps information of the clients connected to each dashboard
// socket.on('connection', function(){
// 
//     // Dashboards with opened sessions
//     var dashboardConnections = {};
//         
//     // Clients with opened sessions
//     var sessions = {};
//     
//     function sendToDashboard(id, message, client){
// 
//       var dashboardClients = dashboardConnections[id];
//                               
//       for(var currentClient in dashboardClients) {
//         if (dashboardClients.hasOwnProperty(currentClient) && dashboardClients[currentClient] != client){
//           dashboardClients[currentClient].send(message);
//         } 
//       }
// 
//     }
// 
//     return function(client){
//           
//       // new client is here! 
//       client.on('message', function(message){ 
//                 
//         switch (message.event) {
//                 
//           case 'notification':
//         
//             sendToDashboard(message.dashboardId, message, client);
//             //socket.broadcast(message);
//             break;
//             
//           case 'session':
//             
//             if(!dashboardConnections[message.dashboardId])
//               dashboardConnections[message.dashboardId] = {};
//               
//             sessions[client.sessionId] = {'dashboardId': message.dashboardId }; 
//             dashboardConnections[message.dashboardId][client.sessionId] = client;              
//             break; 
//             
//           case 'chatMessage':
//             //socket.broadcast(message);
//             sendToDashboard(message.dashboardId, message, client);
//             break;    
//         }
//       
//       }); 
//       
//       client.on('disconnect', function(){ 
//         
//         if(sessions[client.sessionId]){  
//           delete dashboardConnections[sessions[client.sessionId].dashboardId][client.sessionId]
//           delete sessions[client.sessionId];
//         }
//         console.log("DISCONNECT");
//         
//       }); 
// 
//   }
// 
// }()); 

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.use(express.bodyParser());
  app.set('view engine', 'mustache');
  app.register(".mustache", require('stache'));
  app.set('view options', {layout: false });
  app.use(express.static(__dirname + '/client'));
  app.use(express.static(__dirname + '/shared'));  
  app.use(express.static(__dirname + '/static'));  
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

app.post('/newDashboard/', function(req, res){
  var newDashboardId = dashboards.new();
  res.send(newDashboardId.toString());
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

