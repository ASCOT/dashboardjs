//     Date: 4/11
//     Author: Diego Marcos (diego.marcos@gmail.com)
//
//     Gadget
// ----------
//     Defines the communication and state persistence for gadgets

// Framework global variable
var UW = UW || {};

UW.Gadget = function(initState){

  // Private Variables
  var state = initState;
  var id = state.get('id');
  var url = state.get('url');
    
  this.getId = function(){
    return id;	
  };
  
  this.getURL = function(){
    return url;
  };
  
  // Default load/save state methods. 
  // The user must define these functions.
  this.loadState = function(state) {};
  this.saveState = function() {};
  
  this.inflateState = function(){
    this.loadState(state.toJSON());
  }
  
  this.setState = function(stateObject){
    state.set(stateObject);
  };
  
  this.getState = function(){
    return state;
  };
  
  this.bind = function(property, trigger){
    state.bind('change:' + property, trigger);
  }
  
  this.setProperty = function(property, value){
    state.set({property: value });
  }

}

UW.Gadget.prototype.debugMessage = function(msg){
  UW.debugMessage("GADGET " + this.getId() + ": " + msg);
}
