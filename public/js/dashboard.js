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
UW.GadgetsCollection =  Backbone.Collection.extend({
  model: UW.GadgetModel
});

// Represents a data set
UW.DataSetModel = Backbone.Model.extend({});

// The dashboard contains a collection of data sets
UW.DataSetsCollection =  Backbone.Collection.extend({  
  model: UW.Dataset
});

// The dashboard state
UW.DashboardModel = Backbone.Model.extend({

  defaults: {
    id: -1,	
    author: "Unknown",
  },
  
  initialize: function (spec) {
     //this.register();
     this.addChildCollection('gadgets', UW.GadgetsCollection);
     this.addChildCollection('dataSets', UW.DataSetsCollection);
  },
  
  addChildCollection: function(id, constructor){
    var newCollection = new constructor();
    this[id] = newCollection; 
    //newCollection.bind('publish', _(this.publishProxy).bind(this));
    newCollection.bind('remove', _(this.notify).bind(this));
    newCollection.bind('add', _(this.notify).bind(this));
    newCollection.bind('move', _(this.notify).bind(this));
    newCollection.parent = this;
    return newCollection;
  },
  
  addChildModel: function (id, constructor) {
    this[id] = new constructor();
    this[label].bind('publish', _(this.notify).bind(this));
    this[id].parent = this;
    return this[id];
  },
  
  export: function (opt) {
    var result = {},
      settings = _({
        recurse: true
      }).extend(opt || {});
    
    function process(targetObj, source) {
      targetObj.attrs = source.toJSON();
      _.each(source, function (value, key) {
        if (settings.recurse) {
          if (key !== 'collection' && source[key] instanceof Backbone.Collection) {
            targetObj.collections = targetObj.collections || {};
            targetObj.collections[key] = {};
            targetObj.collections[key].models = [];
            targetObj.collections[key].id = source[key].id || null;
            _.each(source[key].models, function (value, index) {
              process(targetObj.collections[key].models[index] = {}, value);
            });
          } else if (key !== 'parent' && source[key] instanceof Backbone.Model) {
            targetObj.models = targetObj.models || {};
            process(targetObj.models[key] = {}, value);
          }
        }
      });
    }
    process(result, this);
    return result;
  },
  
  import: function (data, silent) {
       function process(targetObj, data) {
         targetObj.set(data.attrs, {silent: silent});
         if (data.collections) {
           _.each(data.collections, function (collection, name) {
             targetObj[name].id = collection.id;
             _.each(collection.models, function (modelData, index) {
               var nextObject = targetObj[name].get(modelData.attrs.id) || targetObj[name]._add({}, {silent: silent});
               process(nextObject, modelData);
             });
           });
         }
       if (data.models) {
         _.each(data.models, function (modelData, name) {
          process(targetObj[name], modelData);
        });
      }
    }
    process(this, data);
    return this;
  },
  
  notify: function() {
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
  var renderer = new UW.Renderer(container);
    
  // List of gadgets
  var gadgets = {}; 
    
  // All generated ids for gadgets
  var ids = {};

  // Auxiliary Variable for Ids generation
  var counter = 0;
 
  // Represents the state of the dashboard that will be saved to and load from the server
  var dashboardState;
   
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
    dashboardState.gadgets.add(gadgetState);		  

  };
  
  this.addDataSet = function(dataSet){
    var dataSetsJSON = dashboardState.get('dataSets');
    dashboardState.addChildCollection('dataSets', UW.DataSetsCollection);
  };

  this.renderGadgets = function(){
    _.each(dashboardState.gadgets.models, 
            _.bind( function (modelData, index){ 
              renderer.renderGadget(modelData.get('url'), gadgets[modelData.id]);
            }, this)
      );  			
  };

  this.createDataSet = function(id){
    
    var newDataSet = new UW.Dataset({'id': id});
    newDataSet.bind('change', _.bind(function() {this.trigger("dataSetChanged")}, this));
    dashboardState.dataSets.add(newDataSet);
    this.notify("dataSetListChanged");
    return newDataSet;
  };

  this.getDataSet = function(id){
      return dashboardState.dataSets.get(id);
   };
  
  this.getDataSetList = function(){
    var modelsList = dashboardState.dataSets.models;
    var modelsNames = [];
    for(var i =0; i < modelsList.length; ++i)
      modelsNames.push(modelsList[i].id);
    return modelsNames;
  };

  this.saveState = function(stateUrl){
   
    dashboardState.setUrl(stateUrl);
    var gadgetCollection = dashboardState['gadgets'];
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
      dashboardState = new UW.DashboardModel;
      dashboardState.import(JSON.parse(state));
      
      this.initConnection();  
      
      gadgetModels = dashboardState.gadgets.models;
      for(gadget in gadgetModels){
        newGadget = new UW.Gadget({ model: gadgetModels[gadget] });    
        newGadget.dashboard = this;
        gadgets[newGadget.getId()] = newGadget;
      }
     
      chatModel = new UW.NodeChatModel(); 
      chat = new UW.ChatView({'model': chatModel, 'dashboard': this, 'el': $('#dashboardArea'), 'id': dashboardState.id}); 
      this.renderGadgets();
      
    }
    
  };
  
  this.gadgetLoaded = function() { 
    this.loadedGadgets++; 
    if(this.loadedGadgets === dashboardState.gadgets.models.length){ 
      // We need a timeout due to a now.js bug that makes initialization asyncronous when syncronous behavior is expected
      setTimeout(_.bind(this.inflateData, this), 1000); 
    } 
  }
  
  this.inflateData = function(){
    
    var dataSetsModels;
    dataSetsModels = dashboardState.dataSets.models;
      for(model in dataSetsModels){
        dataSetsModels[model].bind('change', _.bind(function() {this.trigger("dataSetChanged")}, this));
        dataSetsModels[model].init(dataSetsModels[model].get("db"));
        this.notify("dataSetListChanged");
    }
    
  }
      
  this.loadState = function(stateUrl){
    
    $.ajax({
      url: stateUrl,
      type: 'GET',
      success: _.bind(function(resp) { this.init(resp); },this)
    });    
  };
  
};
