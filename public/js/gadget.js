// --------------------------------------------------------
//    Date: 4/11
//    Author: Diego Marcos (diego.marcos@gmail.com)
// --------------------------------------------------------

var UW = UW || {};

// --------------
//     GADGET
// --------------

UW.GadgetState = Backbone.Model.extend({});

UW.Gadget = function(state){

	var gadgetState = state;
  var id = state.get('id');
	var url = state.get('url');
	
	this.properties = {};
	
	this.getId = function(){
		return id;	
	};
	
	this.getURL = function(){
		return url;
	};
	
	this.loadState = function(state) {};
	this.saveState = function() {};
	
	this.inflateState = function(){
	 this.loadState(gadgetState.toJSON());
	}
	
	this.setState = function(stateObject){
    gadgetState.set(stateObject);
  };
  
  this.getState = function(){
    return gadgetState;
  };
  
  this.bind = function(property, trigger){
    gadgetState.bind('change:' + property, trigger);
  }
  
  this.setProperty = function(property, value){
    gadgetState.set({property: value });
  }
			
}

UW.Gadget.prototype.debugMessage = function(msg){
	UW.debugMessage("GADGET " + this.getId() + ": " + msg);
}
