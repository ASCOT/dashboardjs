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

// The constructor takes the DOM element where the dashboard will be rendered
UW.Dashboard = function(_id, container, dashboardUrl){
  
  // Dashboard id
  var id;  
  // Renders the gadgets
  var renderer;
  // List of gadgets
  var gadgets = {}; 
  // Represents the state of the dashboard that will be saved to and load from the server
  
  var loadedDataSets = {};
  var dashboardModel; 

  var gadgetsInfo;
  var dashboard = this;
     
  var bayeuxClient;
  var bayeuxClientId;
  
  var domContainer = container;
  var url = dashboardUrl;

  function debugMessage(msg){
    UW.debugMessage("MANAGER: " + msg);
  } 

  var addDataSet = function(data, silent){
    var newDataSet = new UW.DataSet(data);
    var id = newDataSet.id;
    loadedDataSets[id] = newDataSet;
    if ((dashboardModel.at('dataSets').get())[id]) {
      loadedDataSets[id].applyModifiers((dashboardModel.at('dataSets').get())[id].modifiers);
    }
    newDataSet.bind('changed', _.bind(function(data) {
      if (data && data.modifiers) {
        for (var i = 0; i < data.modifiers.length; ++i) {
          dashboardModel.submitOp({
            p : ['dataSets', data.id, 'modifiers', 0],
            li : data.modifiers[i]
          });
        }
      }
      dashboard.trigger('dataSetChanged', {});
    },dashboard));
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
    var gadgetsLoaded = _.bind(function(gadgets) { 
      gadgetsInfo = gadgets; 
      this.loadState(stateLoaded); 
    }, this);

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

    var dashboardModelChanged = _.bind(function (op) {
      var communications = bayeuxClient;
      var modifiers;
      if (communications) {
        if (op[0].p[0] === 'gadgets') {
          if (op[0].oi) {
            gadgets[op[0].p[1]].update(op[0].oi);
          } else {
            if (op[0].od) {            
              gadgets[op[0].p[1]].update(op[0].od);
            }
          }
        }
        if (op[0].p[0] === 'comments') {
          this.notify("commentPublished", op[0].li, { 'self' : true });
        }
        if (op[0].p[0] === 'dataSets') {
          if (!op[0].oi && op[0].p.length === 2) {
            removeDataSet(op[0].p[1]);
            return;
          }
          if (op[0].p[2] === 'modifiers') {
            if (op[0].li) {
              loadedDataSets[op[0].p[1]].applyModifiers([op[0].li]);
            }
            if (op[0].ld) {
              modifiers = (dashboardModel.at('dataSets').get())[op[0].p[1]].modifiers;
              loadedDataSets[op[0].p[1]].applyModifiers(modifiers);
            }
            return;
          }
          if (loadedDataSets[op[0].oi.id] === undefined) {
            this.fetchDataSet(op[0].oi.url);
            return;    
          }
        }
      }
    }, this);

    var state;
    var onDocOpened =  function(error, doc) {
        var that = this;
        var gadgets = {};
        var currentGadget;
        dashboardModel = doc;
        dashboardModel.on('change', dashboardModelChanged);
        if (dashboardModel.created) {
          for (var i = 0; i < state.gadgetsOrder.length; ++i) {
            currentGadget = state.gadgets[state.gadgetsOrder[i]];
            gadgets[currentGadget.id] = {};
            gadgets[currentGadget.id].id = currentGadget.id;
            gadgets[currentGadget.id].state = currentGadget.state;
          }
          dashboardModel.submitOp([
            {
              p : [],
              oi : { 
                "gadgets" : gadgets,
                "dataSets" : {},
                "comments" : [],
              }
            }
          ])
        }
    };

    var sharejsTest = function(state){
      sharejs.open(state.id, 'json', 
        function(error, doc) {
          onDocOpened(error, doc);
          callback(state);
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
    newGadget.dashboardModel = dashboardModel;
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

  this.undo = function(callback) {
    dashboardModel.undo();
  }

  this.redo = function(callback) {
    dashboardModel.redo();
  }

  this.createDataSet = function(name, source, query, success, error, staticData){
    var createDataSetSuccess = function(dataSetId){
      this.loadDataSet(dataSetId);
      success(dataSetId);
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

  this.fork = function(success, error){
    var successFork = function(id) {
      console.log("Dashboard forked");
      success(id);
    };

    UW.ajax({
      "url" : "/forkdashboard/" + dashboardModel.at('id').get(),
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
  
  this.inflateState = function(dashboardState, success, error) {  
    var newGadget;
    var newGadgetModel;
    var gadgetInstanceInfo;
    var loadGadgets = _.bind(function(){ 
      for(var i=0; i < dashboardState.gadgetsOrder.length; ++i){
        gadgetInstanceInfo = dashboardState.gadgets[dashboardState.gadgetsOrder[i]];
        newGadgetModel = new UW.GadgetModel(gadgetInstanceInfo.state);
        newGadget = new UW.Gadget({model: newGadgetModel});
        newGadget.id = gadgetInstanceInfo.id;
        newGadget.gadgetInfoId = gadgetInstanceInfo.gadgetInfoId;    
        newGadget.dashboard = this;
        newGadget.dashboardModel = dashboardModel;
        newGadget.url = '/gadgets/' + gadgetsInfo[newGadget.gadgetInfoId].fileName;
        gadgets[newGadget.id] = newGadget;
        this.loadedGadgets++;
      }

      success();
             
      this.renderGadgets(_.bind(function() { 
        this.notify('dataSetChanged'); 
      },this)); 

    }, this);
    
    if(!dashboardState)
      return;
    
    if(id){
      this.initCommunications(id);
    }
    else{
    
      renderer = new UW.Renderer(domContainer, dashboardState.numberOfColumns);
      
      id = dashboardState.id;
      this.initCommunications(id);

      if(dashboardModel.at('dataSets').get()){
        this.loadDataSets(dashboardModel.at('dataSets').get(), loadGadgets);
      }
      else {
        loadGadgets();
      }
    
    }
  };

  this.fetchDataSet = function(url, success, error){
    var successLoadingDataSet = function(data){
      addDataSet(JSON.parse(data));
      if (success) {
        success();
      }
    };
    UW.ajax({
      "url" : url,
      "type" : "get",
      "success" : _.bind(successLoadingDataSet ,this)
    });   
  }
  
  this.loadDataSet = function(id) {
    dashboardModel.submitOp({
      p : ['dataSets' , id],
      oi : {
        "id" : id,
        "url" : '/dataSet/' + id,
        "modifiers" : []
      }
    });
  }

  this.unloadDataSet = function(id) {
    dashboardModel.submitOp({
      p : ['dataSets' , id],
      od : null
    });
  }

  this.loadDataSets = function(dataSets, success, error){
    var remainingDataSets = 0;
    var succesFetchingDataSet = _.bind(function (data) {
      remainingDataSets--;
      if(remainingDataSets === 0){
        success();
      }
    }, this);

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
        this.fetchDataSet(/dataSet/ + dataSetId, succesFetchingDataSet);
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