// --------------------------------------------------------
//    Date: 4/11
//    Author: Diego Marcos (diego.marcos@gmail.com)
// --------------------------------------------------------

var UW = UW || {};

// ----------------
//     DASHBOARD
// ----------------

UW.GadgetsCollection =  Backbone.Collection.extend({
  model: UW.GadgetState
});

UW.DataSetModel = Backbone.Model.extend({});

UW.DataSetsCollection =  Backbone.Collection.extend({
  model: UW.astro.Dataset
});

UW.DashboardState = Backbone.Model.extend({

  defaults: {
    id: -1,	
    author: "Unknown",
    gadgets: new UW.GadgetsCollection(),
    dataSets: new UW.DataSetsCollection()
  },
  
  url: function(){
    return this.modelUrl;
  },
  
  setUrl: function(url){
    this.modelUrl = url;
  }
      
});


UW.Dashboard = function(container){
  
	// DOM element where the dashboard is displayed
	var rootElement = container;

	// Gadgets contained in the dashboard
	var gadgets = {};
	
	// Render engine of gadgets;
	var renderer = new UW.Renderer(container);
	
	// Generated ids
	var ids = {};
	var counter = 0;
	
	var dashboardState;

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
			
		var gadgetUrl = gadgetState.get('url');
		var gadgetId = generateId(parseURL(gadgetUrl).fileNoExtension);
		var newGadget = new UW.Gadget(gadgetState);
		newGadget.dashboard = this;
		gadgets[gadgetId] = newGadget;
		    
		dashboardState.get('gadgets').add(gadgetState);		  
		return newGadget;
			
  };
			
  this.renderGadgets = function(){
		for(gadgetId in gadgets)
		  renderer.renderGadget(gadgets[gadgetId]);  			
  };
			
  this.bindToGadget = function(gadgetId, property, trigger){
		gadgets[gadgetId].bind(property, trigger);
  };
		
	this.setGadgetProperty = function(gadgetId, property, value){
		gadgets[gadgetId].setProperty(property, value);
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
		
		var currentGadget;
		for(var gadgetId in gadgets){
		  
		  currentGadget = gadgets[gadgetId];
		  if (typeof currentGadget.saveState != 'undefined'){
        currentGadget.getState().set(currentGadget.saveState());
		  	console.log("GADGET STATE " + JSON.stringify(currentGadget.getState().toJSON()));
		  }
		  else
        UW.errorMessage("GADGET " + currentGadget.getId() + " doesn't define methods for loading and saving state" );
        
    }
    
    dashboardState.setUrl(stateUrl);
    dashboardState.save();
    console.log("DASHBOARD STATE: " + JSON.stringify(dashboardState.toJSON()));
		
  };
  
  this.inflateState = function() {
  
    var gadgetJSON = dashboardState.get('gadgets');
    dashboardState.set({ gadgets: new UW.GadgetsCollection() });

    for (var i=0; i < gadgetJSON.length; i++)
      this.addGadget(new UW.GadgetState(gadgetJSON[i]));
    
    dashboardState.set({ dataSets: new UW.DataSetsCollection() });
    dashboardState.get('dataSets').bind('add', _.bind(function() {this.trigger("dataSetListChanged")}, this));
            
    this.renderGadgets();
    
  };
  		
  this.loadState = function(stateUrl){
    
    dashboardState = new UW.DashboardState();
    dashboardState.setUrl(stateUrl);
    dashboardState.fetch({success: _.bind( function() { this.inflateState(); }, this)
       
  });
       
  };
  
};