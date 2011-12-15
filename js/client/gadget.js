//     Date: 4/11
//     Author: Diego Marcos (diego.marcos@gmail.com)
//
//     Gadget
// ----------
//     Defines the communication and state persistence for gadgets

// Framework global variable
var UW = UW || {};

UW.Gadget = Backbone.View.extend({
  

  // Default load/save state methods. 
  // The user must define these functions.
  loadState: function(state) {},
    
  onNotification: function(notification, callback){
    var gadgetId = this.id;
    var newCallback = function(notificationObject){
      if(notificationObject['private'] && notificationObject['sourceId'] !== gadgetId){
        return;
      }
      callback(notificationObject.data);
    }  
    this.dashboard.bind(notification, newCallback);
  },
  
  notify: function(notification, data, options){
    var optionsParameter = options || {};
    optionsParameter['sourceId'] = this.id;
    this.dashboard.notify(notification, data, optionsParameter);
  },
  
  inflateState: function(){
    if(!isEmpty(this.model.toJSON())){
      this.loadState(this.model.toJSON());
    }
  },

  setState : function(state) {
    var currentState = (this.dashboardModel.at('gadgets').get())[this.id].state || {};
    var newState = JSON.parse(JSON.stringify(currentState));

    if (state) {
      for (var attribute in state) {
        if (state.hasOwnProperty(attribute)) {
          newState[attribute] = state[attribute];
        }
      }
    }

    this.dashboardModel.submitOp({
      p : ['gadgets' , this.id, 'state'],
      oi : newState,
      od : JSON.parse(JSON.stringify(currentState))
    });

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
  
  debugMessage: function(msg){
    UW.debugMessage("GADGET " + this.getId() + ": " + msg);
  }
  
});