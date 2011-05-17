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
UW.GadgetState = Backbone.Model.extend({});

// The dashboard contains a collection of gadgets
UW.GadgetsCollection =  Backbone.Collection.extend({
  model: UW.GadgetState
});

// Represents a data set
UW.DataSetModel = Backbone.Model.extend({});

// The dashboard contains a collection of data sets
UW.DataSetsCollection =  Backbone.Collection.extend({
  model: UW.astro.Dataset
});

// The dashboard state
UW.DashboardState = Backbone.Model.extend({

  defaults: {
    id: -1,	
    author: "Unknown",
  },
  
  initialize: function() {
    this.gadgets = new UW.GadgetsCollection();
    this.dataSets = new UW.DataSetsCollection();
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
  
  // Represents the state of the dashboard that will be saved to and load from the server
  var dashboardState = new UW.DashboardState();
    
  // All generated ids for gadgets
  var ids = {};

  // Auxiliary Variable for Ids generation
  var counter = 0;
  
  // Realt time interactin using websockets
  var socket; 

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

  this.addGadget = function(gadgetState){
    
    dashboardState.get('gadgets').add(gadgetState);		  

  };

  this.renderGadgets = function(){
    _.each(dashboardState.get('gadgets').models, 
            _.bind( function (modelData, index){ 
              renderer.renderGadget(modelData.id, modelData.get('url'), modelData, this);
            }, this)
      );  			
  };

  this.bindToGadget = function(gadgetId, property, trigger){
    //gadgets[gadgetId].bind(property, trigger);
  };

  this.setGadgetProperty = function(gadgetId, property, value){
    //gadgets[gadgetId].setProperty(property, value);
  };

  this.createDataSet = function(){
    return new UW.astro.Dataset();;
  };

  this.getDataSet = function(id){
    return dashboardState.get('dataSets').get(id);
  };

  this.setDataSet = function(id, newDataSet){
    var isNew = true;
    if (!dashboardState.get('dataSets').get(id)){
      newDataSet.setId(id);
      newDataSet.bind('change', _.bind(function() {this.trigger("dataSetChanged")}, this));
      dashboardState.get('dataSets').add(newDataSet);
    }
  };	

  this.getDataSetList = function(){
    var modelsList = dashboardState.get('dataSets').models;
    var modelsNames = [];
    for(var i =0; i < modelsList.length; ++i)
      modelsNames.push(modelsList[i].id);
    return modelsNames;
  };

  this.saveState = function(stateUrl){

    //var currentGadget;
    //for(var gadgetId in gadgets){

    //  currentGadget = gadgets[gadgetId];
    //  if (typeof currentGadget.saveState != 'undefined'){
    //    currentGadget.getState().set(currentGadget.saveState());
    //    console.log("GADGET STATE " + JSON.stringify(currentGadget.getState().toJSON()));
    //  }
    //  else
    //    UW.errorMessage("GADGET " + currentGadget.getId() + " doesn't define methods for loading and saving state" );
        
    //}
    
    dashboardState.setUrl(stateUrl);
    dashboardState.save();
    console.log("DASHBOARD STATE: " + JSON.stringify(dashboardState.toJSON()));

  };
  
  this.notify = function(notification, data){
    // Notify to the dashboard
    this.trigger(notification,data);
    socket.send({event: 'notification', 'notification': notification, 'data' : data });
    // Notify to the server
  };
  
  this.inflateState = function() {
  
    socket = new io.Socket('localhost');
    socket.connect();
    socket.on('connect', function(){ console.log("CONNECT"); }); 
    socket.on('message', _.bind(function(data){
      
        console.log('Received:', data);
 
        switch(data.event){
    
          case 'notification':
            this.trigger(data.notification, data.data);
          break;
      
        }
      }, this));
     
    socket.on('disconnect', function(){ console.log("DISCONNECT"); }); 
  
    var gadgetJSON = dashboardState.get('gadgets');
    dashboardState.set({ gadgets: new UW.GadgetsCollection() });

    for (var i=0; i < gadgetJSON.length; i++)
      this.addGadget(new UW.GadgetState(gadgetJSON[i]));
    
    dashboardState.set({ dataSets: new UW.DataSetsCollection() });
    dashboardState.get('dataSets').bind('add', _.bind(function() {this.trigger("dataSetListChanged")}, this));
            
    this.renderGadgets();
    
  };
      
  this.loadState = function(stateUrl){
    
    dashboardState.setUrl(stateUrl);
    dashboardState.fetch({success: _.bind( function() { this.inflateState(); }, this )});
       
  };
  
};