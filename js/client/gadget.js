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
  saveState: function() {},
  
  // Bind a function to this gadget whenever the provided notification is triggered
  onNotification: function(notification, callback){
    var gadgetId = this.id;
    this.notificationCallbacks = this.notificationCallbacks || {};
    this.notificationCallbacks[notification] = function(notificationObject){
      if(notificationObject['private'] && notificationObject['sourceId'] !== gadgetId){
        return;
      }
      callback(notificationObject.data);
    }  
    this.dashboard.bind(notification, this.notificationCallbacks[notification]);
  },
  
  // Send out a notification out to the dashboard.
  // The source gadget, along with any additional data is packaged with the notification
  notify: function(notification, data, options){
    var optionsParameter = options || {};
    optionsParameter['sourceId'] = this.id;
    this.dashboard.notify(notification, data, optionsParameter);
  },
  
  // Load the gadget state which is currently saved to the dashboard
  inflateState: function(){
    if (!isEmpty(this.dashboardModel.get().gadgets[this.id].state)) {
      this.loadState(this.dashboardModel.get().gadgets[this.id].state);
    }
  },

	// Modify the current gadget state
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

  init: function(success, failure){
    console.log("Not initialization routine provided for gadget " + this.model.id);
  },
  
  debugMessage: function(msg){
    UW.debugMessage("GADGET " + this.getId() + ": " + msg);
  },

	// Removes this gadget from the notification list. Should be called whenever a gadget
	// is removed from the dashboard.
  close: function() {
    for (notification in this.notificationCallbacks) { 
      if (this.notificationCallbacks.hasOwnProperty(notification)) {
				this.dashboard.unbind(notification, this.notificationCallbacks[notification]);
      }
    }
  }
});
