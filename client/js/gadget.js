//     Date: 4/11
//     Author: Diego Marcos (diego.marcos@gmail.com)
//
//     Gadget
// ----------
//     Defines the communication and state persistence for gadgets

// Framework global variable
var UW = UW || {};

UW.Gadget = Backbone.View.extend({

  getId: function(){
    return this.model.id;	
  },
  
  getURL: function(){
    return this.model.get('url');
  },
  
  // Default load/save state methods. 
  // The user must define these functions.
  loadState: function(state) {},
  
  saveState: function() { return {}; },
  
  inflateState: function(){
    this.loadState(this.model.toJSON());
  },
  
  bind: function(property, trigger){
    //model.bind('change:' + property, trigger);
  },
  
  setProperty: function(property, value){
    //model.set({property: value });
  },

  init: function(success, failure){
    console.log("Not initialization routine provided for gadget " + this.model.id);
  },
  
  loaded: function(){
    this.dashboard.gadgetLoaded();
  },

  debugMessage: function(msg){
    UW.debugMessage("GADGET " + this.getId() + ": " + msg);
  }
  
});