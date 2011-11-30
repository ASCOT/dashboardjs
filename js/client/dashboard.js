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
UW.Dashboard = function(container, dashboardUrl){
  
  var id;  
  // Renders the gadgets
  var renderer;
  // List of gadgets
  var gadgets = {}; 
  // Represents the state of the dashboard that will be saved to and load from the server
  var dashboardState;
  var loadedDataSets = {};
  
  var gadgetsInfo;
  var dashboard = this;
   
  var dashboardModel; 
  
  var bayeuxClient;
  var bayeuxClientId;
  
  var domContainer = container;
  var url = dashboardUrl;

  function debugMessage(msg){
    UW.debugMessage("MANAGER: " + msg);
  } 

  var addDataSet = function(data, silent){
    var newDataSet = new UW.DataSet(data);
    loadedDataSets[newDataSet.id] = newDataSet;
    newDataSet.bind('changed', _.bind(function(data) {
      dashboard.notify('dataSetChanged', data)}, 
    dashboard));
    if(!silent) {
      dashboard.trigger('dataSetChanged', {});
    }
    return newDataSet;
  };

  var removeDataSet = function(id, silent){
    delete loadedDataSets[id];
    if (!silent) {    
      dashboard.trigger('dataSetChanged', id);
    } 
  }

  _.extend(this, Backbone.Events);

  this.loadedGadgets = 0;
  
  this.init = function(callback) {
    var stateLoaded = _.bind(function(state) { this.inflateState(state, callback); },this)
    var gadgetsLoaded = _.bind(function(gadgets) { gadgetsInfo = gadgets; this.loadState(stateLoaded); },this);
    this.loadGadgets(gadgetsLoaded);
    this.onNotification('dataSetLoaded', addDataSet)
    this.onNotification('dataSetUnloaded', removeDataSet)
   };

  this.onNotification = function(notification, callback){
    var newCallback = function(notificationObject){
      if(notificationObject['private']){
        return;
      }
      callback(notificationObject.data);
    }  
    this.bind(notification, newCallback);
  };

  this.loadGadgets = function(callback){
     $.ajax({
       url: /gadgets/,
       type: 'GET',
       success: callback
     });
  };

  this.loadState = function(callback){
    var onDocChanged = _.bind(function (op) {
      var communications = bayeuxClient;
      console.log(JSON.stringify(op));
      if (communications) {
        this.notify("commentPublished", op[0].li, { 'self' : true });
      }
    }, this);
    var onDocOpened =  function(error, doc) {
        var that = this;
        dashboardModel = doc;
        dashboardModel.on('change', onDocChanged);
        if (dashboardModel.created) {
          console.log("Doc Started"); 
          dashboardModel.submitOp([
            {
              p : [],
              oi : { 
                comments : []
              }
            }
          ])
        }
    };
    var sharejsTest = function(result){
      sharejs.open('dashboardModel', 'json', 
        function(error, doc) {
          onDocOpened(error, doc);
          callback(result);
        }
    )};

    $.ajax({
       url: url + '/state',
       type: 'GET',
       success: sharejsTest
     });
   };

   this.setContainer = function(container){
     domContainer = container;
   };

   this.setUrl = function(dashboardUrl){
     url = dashboardUrl;
   };

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

  this.createDataSet = function(name, source, query, successCallback, errorCallback, staticData){
    var createDataSetSuccess = function(response){
      var dataSetJSON = JSON.parse(response);
      this.loadDataSet(dataSetJSON);
      successCallback(dataSetJSON.id);
    }
    var queryData = { 
      "name" : name,
      "source" : source,
      "query" : query,
      "staticData" : staticData || false,
      "returnRecords" : true
    };
    
    UW.ajax({
      "url" : "/dataSet/",
      "type" : "post",
      "data" : JSON.stringify(queryData),
      "success" : _.bind(createDataSetSuccess, this)
    });    
    
  };

  this.getComments = function(){
    return dashboardModel.at('comments').get();
  };

  this.publishComment = function(comment){
    var currentDate = new Date();
    var commentObj = {
      "text" : comment,
      "author" : 'Anonymous',
      "day" : currentDate.getDate(),
      "hours" : currentDate.getHours(),
      "minutes" : currentDate.getMinutes(),
      "month" : currentDate.getMonth(),
      "weekday" : currentDate.getDay(),
      "year" : currentDate.getFullYear()
    }
    dashboardModel.submitOp({
      p: ['comments' , 0],
      li: commentObj
    });
  }

  this.getDataSet = function(id){
    return loadedDataSets[id];
  };
  
  this.getDataSetList = function(){
    var dataSetsIds = [];
    for (var id in loadedDataSets) {
      dataSetsIds.push({"id" : id, "text" : loadedDataSets[id].name});
    }
    return dataSetsIds;
  };

  this.save = function(successCallback, failureCallback){
   
    var currentDataSet;
    var currentGadget;
    var successSaveState = function() {
      console.log("State Saved");
      successCallback();
    };

    dashboardState.comments = dashboardModel.at('comments');

    dashboardState.dataSets = {};
    for (var id in loadedDataSets) {
      if(loadedDataSets.hasOwnProperty(id)){
        currentDataSet = loadedDataSets[id];
        dashboardState.dataSets[id] = { 
          "id" : id,
          "modifiers" : currentDataSet.getModifiers()
        };
      }
    }

    for (var i = 0; i < dashboardState.gadgets.length; ++i) {
      currentGadget = dashboardState.gadgets[i];
      currentGadget.state = gadgets[currentGadget.id].saveState();
    }

    UW.ajax({
      "url" : url,
      "type" : "post",
      "data" : JSON.stringify(dashboardState),
      "success" : _.bind(successSaveState, this)
    }); 

  };

  this.fork = function(successCallback, failureCallback){
    var successFork = function(id) {
      console.log("Dashboard forked");
      successCallback(id);
    };

    UW.ajax({
      "url" : "/forkdashboard/" + dashboardState.id,
      "type" : "post",
      "success" : successFork
    }); 

  };
  
  this.notify = function(notification, data, options){
    options = options || {};
    var notificationObject = {};
    notificationObject['notification'] = notification;
    if(data){
      notificationObject['data'] = data;
    }
    if(options.sourceId){
      notificationObject['sourceId'] = options.sourceId;
    }
    if(options['private']){
      notificationObject['private'] = true;
    }
    this.trigger(notification, notificationObject);
    if(!options.self){
      bayeuxClient.publish('/dashboard/' + id, notificationObject);
    }
  };
  
  this.initCommunications = function(channelId){
    var processNotification = _.bind(function(message){
        if (message.notification === "dataSetChanged") {
          if (message.data && message.data.modifiers) {
            loadedDataSets[message.data.id].applyModifiers(message.data.modifiers);
          }
        }
        this.trigger(message.notification, message);
    },this);
    
    var processHandshake = function(message){
     console.log("Client connected: " + message.clientId);  
    };
    
    bayeuxClient = new Faye.Client('/faye', { timeout: 120 });
    bayeuxClient.addExtension({ 
      incoming: function(message, callback) { 
        if (message.channel === '/meta/handshake' && message.successful) { 
          bayeuxClientId = message.clientId; 
        } 
        else if (message.data !== undefined) { 
          if (message.clientId === bayeuxClientId) 
          message.data.selfPublished = true; 
        } 
        callback(message); 
      } 
    });

    bayeuxClient.subscribe('/dashboard/' + channelId, function(message) { 
        if (message.selfPublished) return; 
        processNotification(message); 
      });  
  };
  
  this.inflateState = function(dashboardStateJSON, success, error) {  
    var newGadget;
    var newGadgetModel;
    var gadgetInstanceInfo;
    var loadGadgets = _.bind(function(){ 
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
             
      success(); 
      this.renderGadgets(function() {}); 

    }, this);
    
    if(!dashboardStateJSON)
      return;
    
    if(id){
      this.initCommunications(id);
    }
    else{
    
      dashboardState = JSON.parse(dashboardStateJSON);
      renderer = new UW.Renderer(domContainer, dashboardState.numberOfColumns);
      
      id = dashboardState.id;
      this.initCommunications(id);

      if(dashboardState.dataSets){
        this.loadDataSets(dashboardState.dataSets, loadGadgets);
      }
      else {
        loadGadgets();
      }
    
    }
  };

  this.loadRemoteDataSet = function(url, success, error){
    var successLoadingDataSet = function(data){
      this.loadDataSet(JSON.parse(data));
      success();
    };
    UW.ajax({
      "url" : url,
      "type" : "get",
      "success" : _.bind(successLoadingDataSet ,this)
    });   
  }
  
  this.loadDataSet = function(data, silent) {
    addDataSet(data);
    if (!silent) {
      this.notify('dataSetLoaded', data);
    }
  }

  this.unloadDataSet = function(id, silent) {
     if (!silent) {
      this.notify('dataSetUnloaded', id); 
    }
  }

  this.loadDataSets = function(dataSets, success, error){
    var remainingDataSets = 0;
    var successLoadingDataSet = function (data) {
      var dataSetJSON = JSON.parse(data);
      var newDataSet;
      dataSetJSON.modifiers = dataSets[dataSetJSON.id].modifiers || {};
      this.loadDataSet(dataSetJSON, true);
      remainingDataSets--;
      if(remainingDataSets === 0){
        success();
      }
    } 
    var dataSetId;
    for (dataSetId in dataSets) {
      if (dataSets.hasOwnProperty(dataSetId)) {
        remainingDataSets += 1;
      }
    }

    if (remainingDataSets === 0){
      success();
    }

    for (dataSetId in dataSets) {
      if (dataSets.hasOwnProperty(dataSetId)) {
        UW.ajax({
          "url" : "/dataSet/" + dataSetId,
          "type" : "get",
          "success" : _.bind(successLoadingDataSet ,this)
        });    
      }
    }
    
  };
  
  this.gadgetLoaded = function(callback) { 
    this.loadedGadgets--; 
    if(this.loadedGadgets == 0){ 
      callback(); 
    } 
  };
  
};