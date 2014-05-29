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
  var layoutOrder = {};
  var gadgetRenderOrder = [];
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
    var modifiers;
    if ((dashboardModel.at('dataSets').get())[id]) {
      modifiers = (dashboardModel.at('dataSets').get())[id].modifiers || [];
      loadedDataSets[id].applyModifiers(modifiers);
    }
    newDataSet.bind('changed', _.bind(function(data) {
      if (data && data.modifiers) {
        for (var i = 0; i < data.modifiers.length; ++i) {
          dashboardModel.submitOp({
            p : ['dataSets', data.id, 'modifiers', 0],
            li : data.modifiers[i],
	    ld : dashboardModel.at('dataSets').get()[data.id].modifiers[0]
          });
        }
      }
      else {
        dashboard.trigger('dataSetChanged', {});
      }
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
	for (index in op) {
	  if (op[index].p[0] === 'gadgets') {
	    // Update gadget on state change
	    if (op[index].p[2] === 'state') {
	      gadgets[op[index].p[1]].update(op[index].oi);
	    }
	    else {
	      // Remove a gadget
	      if (op[index].od) {
		gadgets[op[index].od.id].close();
		delete gadgets[op[index].od.id];
	      }

	      // Add a new gadget
	      if (op[index].oi) {
		var docGadgetObj = op[index].oi
		var newGadget = this.makeGadgetInstance(docGadgetObj);
		gadgets[newGadget.id] = newGadget;
	      }
	    }

	  }

	  if (op[index].p[0] === 'layoutOrder') {
	    var gadgetId = op[index].p[1];
	    // Remove an element from the layout
	    if (op[index].od) {
	      renderer.removeGadget(gadgetId, function() {});
	      delete layoutOrder[gadgetId];
	      delete gadgetRenderOrder[gadgetId];
	    }
	    // Add an element to the layout
	    if (op[index].oi) {
	      layoutOrder[gadgetId] = op[index].oi;
	      // Clear the DOM and redraw all of the gadgets
	      for (i in gadgetRenderOrder) {
		renderer.removeGadget(gadgetRenderOrder[i].id, function() {});
	      }
	      // Dont add the gadget to the render list if we only moved it
	      var gadgetExistsIndex = -1;
	      for (i in gadgetRenderOrder) {
		if (gadgetRenderOrder[i].id === gadgetId) {
		  gadgetExistsIndex = i;
		  break;
		}
	      }
	      if (gadgetExistsIndex === -1) gadgetRenderOrder.push(layoutOrder[gadgetId]);
	      else gadgetRenderOrder[gadgetExistsIndex] = op[index].oi;
	      sortRenderOrder();
	      this.renderGadgets(function() {});
	    }
	  }

	  // Add a comment to the comments page
	  if (op[index].p[0] === 'comments') {
	    this.notify("commentPublished", op[index].li, { 'self' : true });
	  }
	  if (op[index].p[0] === 'dataSets') {
	    
	    // Remove a dataset
	    if (!op[index].oi && op[index].p.length === 2) {
	      removeDataSet(op[index].p[1]);
	      return;
	    }
	    if (op[index].p[2] === 'modifiers') {

	      // Apply modifiers to a dataset
	      if (op[index].li) {
		loadedDataSets[op[index].p[1]].applyModifiers([op[index].li]);
		return;
	      }

	      // Undo dataset modifiers to original state
	      // The original state is not stored, so we have to explicitly color the points grey
	      else if (op[index].ld) {
		var modColor = {"field": "color", "grey": []};
		var modVis = {"field": "visible", "true": []};
		var ds = loadedDataSets[op[index].p[1]];
		for (var j = 0; j < ds.records.length; j++) { 
		  modColor['grey'].push(j);
		  modVis['true'].push(j);
		}
		ds.applyModifiers([modColor, modVis], false);
	      }
	      return;
	    }
	    if (loadedDataSets[op[index].oi.id] === undefined) {
	      this.fetchDataSet(op[index].oi.url);
	      return;    
	    }
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

  this.makeGadgetInstance = function(gadgetInstanceInfo) {
    newGadgetModel = new UW.GadgetModel(gadgetInstanceInfo.state);
    newGadget = new UW.Gadget({model: newGadgetModel});
    newGadget.id = gadgetInstanceInfo.id;
    newGadget.gadgetInfoId = gadgetInstanceInfo.gadgetInfoId;    
    newGadget.dashboard = this;
    newGadget.dashboardModel = dashboardModel;
    newGadget.url = '/gadgets/' + gadgetsInfo[newGadget.gadgetInfoId].fileName;
    return newGadget;
  }
  
  // The jquery tab module requires that tabs are added to the DOM in the order that they are listed on the
  // tab bar. To enforce this, we will draw gadgets in order of tab position. This function takes the
  // gadgetRenderOrder list and sorts the objects so that gadgets from the same panes are grouped together
  // and sorted in ascending order of tab position. This ensures that tab ordering is displayed correctly.
  function sortRenderOrder() {
    
    var sortBy = function(field, reverse, primer){
      var key = primer ? function(x) {return primer(x[field])} : function(x) {return x[field]};
      reverse = [-1, 1][+!!reverse];
      return function (a, b) {
	return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
      } 
    }
  
    gadgetRenderOrder.sort(sortBy("tabPos", true, parseInt));
    gadgetRenderOrder.sort(sortBy("paneId", true, parseInt));
    gadgetRenderOrder.sort(sortBy("parentColumnId", true, parseInt));
  }

  this.renderGadgets = function(callback){ 
    var gadgetLoaded = _.bind(function() { var finished = callback; this.gadgetLoaded(finished) }, this);
    
    // Sort the list of gadgets to render in order of their tab position
    sortRenderOrder();
    for (i in gadgetRenderOrder) {
      renderer.renderGadget(gadgets[gadgetRenderOrder[i].id], layoutOrder[gadgetRenderOrder[i].id], gadgetLoaded);
    }
  };

  this.getColumnWidth = function() {
    return $("#column0").width();
  }

  this.undo = function(callback) {
    dashboardModel.undo();
  }

  this.redo = function(callback) {
    dashboardModel.redo();
  }

  this.moveGadget = function(gadgetId, newPaneId, newColumnId, newTabPos) {
    // Find the gadget in the gadget list
    var serverGadgets = dashboardModel.at('gadgets').get();
    var oldLayoutObj = layoutOrder[gadgetId];
    var opsToSubmit = [];

    // Make sure to update the position of all existing tabs in the receiving pane
    var tabIndex = 0;
    var oldTabPos = -1;
    for (i in layoutOrder) {
      lObj = layoutOrder[i];
      // Skip over the tab that we are moving (it will be deleted)
      if (lObj.id === gadgetId) {
	oldTabPos = tabIndex;
	continue;
      }
      tabIndex++;
      if (lObj.parentColumnId === newColumnId && lObj.parentPaneId === newPaneId) {
	if (lObj.tabPos >= newTabPos && newTabPos !== oldTabPos) {
	  var newLayoutObj = { id: lObj.id, parentColumnId: lObj.parentColumnId, parentPaneId: lObj.parentPaneId, tabPos: lObj.tabPos+1 };
	  var op1 = {p : ['layoutOrder', lObj.id],
		     od : layoutOrder[lObj.id],
		     oi : newLayoutObj };
	  opsToSubmit.push(op1);
	}
      }
    }

    var newLayoutObj = { id: gadgetId, parentColumnId: newColumnId, parentPaneId: newPaneId, tabPos: newTabPos };
    var op1 = {p : ['layoutOrder', gadgetId],
               od : oldLayoutObj,
	       oi : newLayoutObj };
    opsToSubmit.push(op1);

    dashboardModel.submitOp(opsToSubmit);
  }

  this.removeGadget = function(gadgetId) {
    // Find the gadget in the gadget list
    var serverGadgets = dashboardModel.at('gadgets').get();
    var gadget = serverGadgets[gadgetId];
    var op1 = {p : ['gadgets', gadgetId],
               od : gadget};
    
    var layoutObj = layoutOrder[gadgetId];
    var op2 = {p : ['layoutOrder', gadgetId],
	       od : layoutObj};

    dashboardModel.submitOp([op1, op2]);
  }

  this.addGadget = function(gadgetName, columnId, paneId, tabPos, state) {
    // Make sure we create the newest instance of the gadget
    var index = 1;
    while (gadgets.hasOwnProperty(gadgetName+index.toString()))
      index++;
    
    var newGadgetId = gadgetName+index.toString();
    var newGadget = {gadgetInfoId: gadgetName, id: newGadgetId, state: state};

    var layoutObj = { id: newGadgetId, parentColumnId: columnId, parentPaneId: paneId, tabPos: tabPos };

    var op1 = {p : ['gadgets', newGadgetId],
               oi : newGadget};
    var op2 = {p : ['layoutOrder', newGadgetId],
               oi : layoutObj};

    dashboardModel.submitOp([op1, op2]);
  }

  this.createDataSet = function(name, source, query, success, error, staticData, existingRecords){
    var createDataSetSuccess = function(dataSetId){
      this.loadDataSet(dataSetId);
      success(dataSetId);
    }
    var queryData = { 
      "name" : name,
      "source" : source,
      "query" : query,
      "staticData" : staticData || false,
      "returnRecords" : true,
      "existingRecords" : existingRecords
    };
    
    UW.ajax({
      "url" : "/dataSet/",
      "type" : "POST",
      "data" : JSON.stringify(queryData),
      "success" : _.bind(createDataSetSuccess, this)
    });    
    
  };
  
  this.createDataSetFromRecords = function(name, records, success) {
  	var createDataSetSuccess = function(dataSetId){
      this.loadDataSet(dataSetId);
      success(dataSetId);
    }
    var data = {
    	"name" : name,
    	"existingRecords" : records
    };
    UW.ajax({
      "url" : "/dataSet/",
      "type" : "POST",
      "data" : JSON.stringify(data),
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
    var gadgetInstanceInfo;
    var loadGadgets = _.bind(function(){ 
    layoutOrder = dashboardState.layoutOrder;
    for (i in layoutOrder) {
      gadgetRenderOrder.push(layoutOrder[i]);
    }
    for(i in dashboardState.gadgets){
      gadgetInstanceInfo = dashboardState.gadgets[i];
      newGadget = this.makeGadgetInstance(gadgetInstanceInfo);
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
    
      var statePanes = dashboardState.layoutOrder.length;
      if (typeof statePanes === 'undefined')
	statePanes = 0
      renderer = new UW.Renderer(domContainer, dashboardState.numberOfColumns, statePanes);
      
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
