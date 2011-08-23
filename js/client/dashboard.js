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
UW.Dashboard = function(container){
  
  var id;  
  // Renders the gadgets
  var renderer;
  // List of gadgets
  var gadgets = {}; 
  // Represents the state of the dashboard that will be saved to and load from the server
  //var dashboardState;
  var dataSets = {};
  
  var gadgetsInfo;
   
  // Chat
  var chatModel; 
  var chat;

  function debugMessage(msg){
    UW.debugMessage("MANAGER: " + msg);
  } 

  _.extend(this, Backbone.Events);

  this.loadedGadgets = 0;

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

  this.createDataSet = function(id){
    var newDataSet = new UW.DataSetModel();
    newDataSet.id = id;
    dataSets[id] = newDataSet;
    newDataSet.bind('publish', _.bind(function(data) {this.notify("dataSetChanged", data)}, this));    
    return newDataSet;
  };

  this.getDataSet = function(id){
      return dataSets[id];
   };
  
  this.getDataSetList = function(){
    var modelsNames = [];
    for(var dataSetName in dataSets)
      modelsNames.push(dataSets[dataSetName].id);
    return modelsNames;
  };

  this.saveState = function(stateUrl){
   
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
    now.sendMessageToDashboard(message, id);
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
      now.notifyToDashboard(id, notificationObject);
    }
  };
  
  this.init = function(state){
    var callback = _.bind(function(state) { var that = this; return function() { that.inflateState(state); }}, this); 
    now.ready(callback(state));
  };
  
  this.initConnection = function(){
    now.userAddedToDashboardChannel = _.bind(function(clientId){
      this.clientId = clientId;
    }, this);    
    now.receiveMessage = function(message){
       chat.addChat("<span style='font-weight: bold'>Anonymous: </span>" + message);
    }; 
    now.receiveNotification = _.bind(function(clientId, notification){
        this.trigger(notification.notification, notification.data);
    },this);
    now.addUserToDashboardChannel(id); 
  };
  
  this.inflateState = function(dashboardStateJSON) {  
    var newGadget;
    var newGadgetModel;
    var dashboardState;
    var gadgetInstanceInfo;
    var loadDataSets = _.bind(function(){
        if(dashboardState.dataSets){
          this.loadDataSets(dashboardState.dataSets);
        }
    }, this);
    
    if(!dashboardStateJSON)
      return;
    
    if(id){
      this.initConnection();
    }
    else{
    
      dashboardState = JSON.parse(dashboardStateJSON);
      //console.log("State: " + state);
      renderer = new UW.Renderer(container, dashboardState.numberOfColumns);
      id = dashboardState.id;
      this.initConnection();  
      
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
      $.ajax({
        'url': '/dataSet/' + dataSets[i],
        success: _.bind(function(data) {
          var dataSet = JSON.parse(data);
          var newDataSet;
          remainingDataSets--;
          newDataSet = this.createDataSet(dataSet.name);
          newDataSet.addRecords(dataSet.records, true);
          //newDataSet.setAllRecordsMetaData({'color': 'grey'});
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
      // We need a timeout due to a now.js bug that makes initialization asyncronous when syncronous behavior is expected
      setTimeout(_.bind(function() { this.notify("dataSetChanged"); }, this), 1000);
      callback(); 
    } 
  };
  
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
