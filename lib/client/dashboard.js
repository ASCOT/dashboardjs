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
UW.GadgetModel = Backbone.Model.extend({
}); 

// The dashboard contains a collection of gadgets
UW.GadgetsCollection = Backbone.Collection.extend({
  model: UW.GadgetModel
}); 

// The dashboard state
UW.DashboardModel = UW.AbstractModel.extend({

  defaults: {
    id: -1,	
    author: "Unknown",
  },
  
  initialize: function (spec) {
    this.addChildCollection('gadgets', UW.GadgetsCollection);
    this.dataSets = {};
  },
  
  url: function(){
    return this.modelUrl;
  },
  
  setUrl: function(url){
    this.modelUrl = url;
  }
  
});

// The constructor takes the DOM element where the dashboard will be rendered
UW.Dashboard = function(container){
  
  // Renders the gadgets
  var renderer;
    
  // List of gadgets
  var gadgets = {}; 
    
  // All generated ids for gadgets
  var ids = {};

  // Auxiliary Variable for Ids generation
  var counter = 0;
 
  // Represents the state of the dashboard that will be saved to and load from the server
  var dashboardState;
  
  var stateUrl;
  var gadgetsInfo;
   
  // Chat
  var chatModel; 
  var chat;

  // Generates unique ids for gadgets
  function generateId(gadgetName){

    var newId = gadgetName;
    if(ids[newId] != undefined){
      newId = gadgetName + "_" + counter;
      counter++;
    }
    console.log("ID " + newId);

    ids[newId] = newId;	
    return newId;

  }

  function debugMessage(msg){
    UW.debugMessage("MANAGER: " + msg);
  } 

  _.extend(this, Backbone.Events);

  this.loadedGadgets = 0;

  this.addGadget = function(gadgetState){
    
    // Adding reference to the gadget in the global scope of the iframe. The user can have access to the object.
		var newGadget = new UW.Gadget({ model: gadgetState });
    newGadget.dashboard = this;
    gadgets[newGadget.getId()] = newGadget;
    dashboardState.gadgets.add(gadgetState, {silent: true});		  

  };

  this.renderGadgets = function(){
    _.each(dashboardState.gadgets.models, 
            _.bind( function (modelData, index){ 
              renderer.renderGadget(gadgets[modelData.id]);
            }, this)
      );  			
  };

  this.createDataSet = function(id){
    var newDataSet = new UW.DataSetModel();
    newDataSet.id = id;
    dashboardState.dataSets[id] = newDataSet;
    newDataSet.bind('publish', _(dashboardState.publishProxy).bind(dashboardState));
    return newDataSet;
  };

  this.getDataSet = function(id){
      return dashboardState.dataSets[id];
   };
  
  this.getDataSetList = function(){
    var modelsNames = [];
    for(var dataSetName in dashboardState.dataSets)
      modelsNames.push(dashboardState.dataSets[dataSetName].id);
    return modelsNames;
  };

  this.saveState = function(stateUrl){
   
    dashboardState.setUrl(stateUrl);
    var gadgetCollection = dashboardState.gadgets;
    for(gadget in gadgets){
      gadgetCollection.get(gadget).set(gadgets[gadget].saveState());
    }    
    //dashboardState.save();
    $.ajax({
        type: 'POST',
        url: '/saveDashboard/' + dashboardState.id,
        data: JSON.stringify(dashboardState.export()),
        contentType: "application/json",
        dataType: "text",
        success: _.bind( function(resp) { }, this )
      });
    
    var objStr = JSON.stringify(dashboardState.export());
    var obj = JSON.parse(objStr);
    console.log("DASHBOARD STATE: " + objStr);

  };
  
  this.sendChatMessage = function(message){
    now.sendMessageToDashboard(message, dashboardState.id);
  };
  
  this.notify = function(notification, data, self){
    // Notify to the dashboard
    if(self){
      this.trigger(notification,data);
    }
    now.notifyToDashboard(dashboardState.id, {'notification': notification, 'data': data});
  };
  
  this.init = function(state){
    
    var callback = _.bind(function(state) { var that = this; return function() { that.inflateState(state); }}, this); 
    now.ready(callback(state));
    
  };
  
  this.initConnection = function(){
    
    now.addUserToDashboardChannel(dashboardState.id); 
    now.receiveMessage = function(message){
       chat.addChat("<span style='font-weight: bold'>Anonymous: </span>" + message);
    }; 
    now.receiveNotification = _.bind(function(notification){
       this.trigger(notification.notification, notification.data);
    },this);
     
  };
  
  this.inflateState = function(state) { 
    
    var newGadget;
    var gadgetModels;
    var stateObj
    
    if(dashboardState){
      this.initConnection();
    }
    else{
    
      stateObj = JSON.parse(state);
      //console.log("State: " + state);
      renderer = new UW.Renderer(container, stateObj.attrs.numberOfColumns);
      dashboardState = new UW.DashboardModel;
      dashboardState.import(JSON.parse(state));
      this.initConnection();  
      
      gadgetModels = dashboardState.gadgets.models;
      for(gadget in gadgetModels){
        newGadget = new UW.Gadget({ model: gadgetModels[gadget] });    
        newGadget.dashboard = this;
        newGadget.url = '/gadgets/' + gadgetsInfo[newGadget.model.get("gadgetId")].fileName
        gadgets[newGadget.getId()] = newGadget;
      }
     
      chatModel = new UW.NodeChatModel(); 
      chat = new UW.ChatView({'model': chatModel, 'dashboard': this, 'el': $('#dashboardArea'), 'id': dashboardState.id}); 
      dashboardState.bind('publish', _.bind(function(data) {this.notify("dataSetChanged", data)}, this));
      this.renderGadgets();
      
    }
    
  };
  
  this.gadgetLoaded = function() { 
    this.loadedGadgets++; 
    if(this.loadedGadgets === dashboardState.gadgets.models.length){ 
      // We need a timeout due to a now.js bug that makes initialization asyncronous when syncronous behavior is expected
      setTimeout(_.bind(function() { this.notify("dataSetChanged"); }, this), 1000); 
    } 
  }
  
  this.loadGadgets = function(gadgets){
    gadgetsInfo = gadgets;
    $.ajax({
      url: stateUrl,
      type: 'GET',
      success: _.bind(function(state) { this.init(state); },this)
    });
  }
      
  this.loadState = function(url){
    stateUrl = url;
     $.ajax({
       url: /gadgets/,
       type: 'GET',
       success: _.bind(function(gadgets) { this.loadGadgets(gadgets); },this)
    }); 
   
  };
  
};
