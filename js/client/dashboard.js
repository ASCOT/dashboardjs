//     Date: 4/11
//     Author: Diego Marcos (diego.marcos@gmail.com)
//
//     Dashboard
// ----------
//     Defines the controller mediating in `gadget to gadget` 
//     and `gadget to data set` communication.
//     Models and communication based on [backbone.js](http://documentcloud.github.com/backbone/)

// Framework global variable
var UW = UW || {};

// Represents the gadget state
UW.GadgetModel = Backbone.Model.extend({}); 

// The dashboard contains a collection of gadgets
UW.GadgetsCollection = Backbone.Collection.extend({
  model: UW.GadgetModel
}); 

// The dashboard state
UW.DashboardModel = Backbone.Model.extend({

  defaults: {
    id: -1,	
    author: "Unknown",
  },
  
  initialize: function () {
  },
  
  url: function(){
    return this.modelUrl;
  },
  
  setUrl: function(url){
    this.modelUrl = url;
  }
  
});

// The constructor takes the DOM element where the dashboard will be rendered
UW.Dashboard = function(container, dashboardUrl){
  
  var id;  
  // Renders the gadgets
  var renderer;
  // List of gadgets
  var gadgets = {}; 
  // Represents the state of the dashboard that will be saved to and load from the server
  var dashboardState;
  var loadedDataSets = {};
  
  var gadgetsInfo;
   
  // Chat
  var chatModel; 
  var chat;
  
  var bayeuxClient;
  var bayeuxClientId;
  
  var domContainer = container;
  var url = dashboardUrl;

  function debugMessage(msg){
    UW.debugMessage("MANAGER: " + msg);
  } 

  _.extend(this, Backbone.Events);

  this.loadedGadgets = 0;
  
  this.init = function(callback) {
     var stateLoaded = _.bind(function(state) { this.inflateState(state); callback(); },this)
     var gadgetsLoaded = _.bind(function(gadgets) { gadgetsInfo = gadgets; this.loadState(stateLoaded); },this);
     this.loadGadgets(gadgetsLoaded);
   };

  this.loadGadgets = function(callback){
     $.ajax({
       url: /gadgets/,
       type: 'GET',
       success: callback
     });
  };

  this.loadState = function(callback){
    $.ajax({
       url: url + '/state',
       type: 'GET',
       success: callback
     });
   };

   this.setContainer = function(container){
     domContainer = container;
   };

   this.setUrl = function(dashboardUrl){
     url = dashboardUrl;
   };

  this.addGadget = function(gadgetState){
    
    // Adding reference to the gadget in the global scope of the iframe. The user can have access to the object.
		var newGadget = new UW.Gadget({ model: gadgetState });
    newGadget.dashboard = this;
    gadgets[newGadget.id] = newGadget;
    gadgetModels.add(gadgetState, {silent: true});		  

  };

  this.renderGadgets = function(callback){ 
    var gadgetLoaded = _.bind(function() { var finished = callback; this.gadgetLoaded(finished) }, this);
    _.each(gadgets, 
            _.bind( function (modelData, index){ 
              renderer.renderGadget(gadgets[modelData.id], gadgetLoaded);
            }, this)
      );  			
  };

  this.createDataSet = function(name, source, query, successCallback, errorCallback){
    var newDataSet;
    var createDataSetSuccess = function(response){
      var dataSetJSON = JSON.parse(response);
      newDataSet = new UW.DataSet(dataSetJSON);      
      loadedDataSets[newDataSet.id] = newDataSet;
      newDataSet.bind('changed', _.bind(function(data) {
        this.notify("dataSetChanged", data)}, 
      this));
      successCallback(newDataSet);
    }
    var queryData = { 
      "name" : name,
      "source" : source,
      "query" : query,
      "returnRecords" : true
    };

    UW.ajax({
      "url" : "/dataSet/",
      "type" : "post",
      "data" : JSON.stringify(queryData),
      "success" : _.bind(createDataSetSuccess, this)
    });    
    
  };

  this.getDataSet = function(id){
    return loadedDataSets[id];
  };
  
  this.getDataSetList = function(){
    var dataSetsIds = [];
    for (var id in loadedDataSets) {
      dataSetsIds.push({"id" : id, "text" : loadedDataSets[id].name});
    }
    return dataSetsIds;
  };

  this.save = function(stateUrl){
   
    var currentDataSet;
    var successSaveState = function() {
      console.log("State Saved");
    }

    dashboardState.dataSets = [];
    for (var id in loadedDataSets) {
      if(loadedDataSets.hasOwnProperty(id)){
        currentDataSet = loadedDataSets[id];
        dashboardState.dataSets.push({ 
          "id" : id,
          "modifiers" : currentDataSet.getModifiers()
        });
      }
    }
    UW.ajax({
      "url" : "/dashboard/" + dashboardState.id,
      "type" : "post",
      "data" : JSON.stringify(dashboardState),
      "success" : _.bind(successSaveState, this)
    }); 
    //console.log(JSON.stringify(dashboardState));
    // dashboardModel.setUrl(stateUrl);
    //         
    //          $.ajax({
    //              type: 'POST',
    //              url: '/dashboard/' + dashboardState.id,
    //              data: JSON.stringify(dashboardState.export()),
    //              contentType: "application/json",
    //              dataType: "text",
    //              success: _.bind( function(resp) { }, this )
    //            });
    //          
    //          var objStr = JSON.stringify(dashboardState.export());
    //          var obj = JSON.parse(objStr);
    //          console.log("DASHBOARD STATE: " + objStr);

  };
  
  this.sendChatMessage = function(message){
    this.notify("chatMessage", {'text': message});
  };
  
  this.notify = function(notification, data, options){
    var optionsArgument = options || {};
    var notificationObject = {};
    notificationObject['notification'] = notification;
    if(data){
      notificationObject['data'] = data;
    }
    if(optionsArgument.sourceId){
      notificationObject['sourceId'] = options.sourceId;
    }
    if(optionsArgument['private']){
      notificationObject['private'] = true;
    }
    this.trigger(notification, notificationObject);
    if(!optionsArgument.self){
      bayeuxClient.publish('/dashboard/' + id, notificationObject);
    }
  };
  
  
  this.initCommunications = function(channelId){
    var processNotification = _.bind(function(message){
        this.trigger(message.notification, message);
    },this);
    
    var processHandshake = function(message){
     console.log("Client connected: " + message.clientId);  
    };
    
    bayeuxClient = new Faye.Client('/faye', { timeout: 120 });
    bayeuxClient.addExtension({ 
      incoming: function(message, callback) { 
        if (message.channel === '/meta/handshake' && message.successful) { 
          bayeuxClientId = message.clientId; 
        } 
        else if (message.data !== undefined) { 
          if (message.clientId === bayeuxClientId) 
          message.data.selfPublished = true; 
        } 
        callback(message); 
      } 
    });

    bayeuxClient.subscribe('/dashboard/' + channelId, function(message) { 
        if (message.selfPublished) return; 
        processNotification(message); 
      });  
  };
  
  this.inflateState = function(dashboardStateJSON) {  
    var newGadget;
    var newGadgetModel;
    var gadgetInstanceInfo;
    var loadDataSets = _.bind(function(){
        if(dashboardState.dataSets){
          this.loadDataSets(dashboardState.dataSets);
        }
    }, this);
    
    if(!dashboardStateJSON)
      return;
    
    if(id){
      this.initCommunications(id);
    }
    else{
    
      dashboardState = JSON.parse(dashboardStateJSON);
      renderer = new UW.Renderer(domContainer, dashboardState.numberOfColumns);
      
      id = dashboardState.id;
      this.initCommunications(id);
      
      for(var i=0; i < dashboardState.gadgets.length; ++i){
        gadgetInstanceInfo = dashboardState.gadgets[i];
        newGadgetModel = new UW.GadgetModel(gadgetInstanceInfo.state);
        newGadget = new UW.Gadget({model: newGadgetModel});
        newGadget.id = gadgetInstanceInfo.id;
        newGadget.gadgetInfoId = gadgetInstanceInfo.gadgetInfoId;    
        newGadget.dashboard = this;
        newGadget.url = '/gadgets/' + gadgetsInfo[newGadget.gadgetInfoId].fileName
        gadgets[newGadget.id] = newGadget;
        this.loadedGadgets++;
      }
     
      chatModel = new UW.NodeChatModel(); 
      chat = new UW.ChatView({'model': chatModel, 'dashboard': this, 'el': $('#dashboardArea'), 'id': dashboardState.id}); 
      this.renderGadgets(loadDataSets);
    
    }
  };
  
  this.loadDataSets = function(dataSets){
    var remainingDataSets = dataSets.length;
    for(var i = 0; i < dataSets.length; ++i){
      UW.ajax({
        "url" : "/dataSet/" + dataSets[i].id,
        "type" : "get",
        "success" : _.bind(function(data) {
          var dataSetJSON = JSON.parse(data);
          var newDataSet = new UW.DataSet(dataSetJSON);
          loadedDataSets[newDataSet.id] = newDataSet;
          remainingDataSets--;
          if(remainingDataSets == 0){
            this.notify("dataSetChanged", {});
          }
        },this)
      });    
    }
  };
  
  this.gadgetLoaded = function(callback) { 
    this.loadedGadgets--; 
    if(this.loadedGadgets == 0){ 
      callback(); 
    } 
  };
  
};