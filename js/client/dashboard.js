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
UW.Dashboard = function (_id, container, dashboardUrl) {

	// Dashboard id
	var id;
	// Renders the gadgets
	var renderer;
	// List of gadgets
	var gadgets = {};
	// Represents the state of the dashboard that will be saved to and load from the server

	var layout = {};
	var paneIdCounter;
	var activeTab = {};
	var loadedDataSets = {};
	var dashboardModel;

	var gadgetsInfo;
	var dashboard = this;

	var bayeuxClient;
	var bayeuxClientId;

	var domContainer = container;
	var url = dashboardUrl;

	function debugMessage(msg) {
		UW.debugMessage("MANAGER: " + msg);
	}

	var addDataSet = function (data, silent) {
		var newDataSet = new UW.DataSet(data);
		var id = newDataSet.id;
		loadedDataSets[id] = newDataSet;
		var modifiers;
		if ((dashboardModel.at('dataSets').get())[id]) {
			modifiers = (dashboardModel.at('dataSets').get())[id].modifiers || [];
			loadedDataSets[id].applyModifiers(modifiers);
		}
		newDataSet.bind('changed', _.bind(function (data) {
			if (data && data.modifiers) {
				for (var i = 0; i < data.modifiers.length; ++i) {
					dashboardModel.submitOp({
						p: ['dataSets', data.id, 'modifiers', 0],
						li: data.modifiers[i],
						ld: dashboardModel.at('dataSets').get()[data.id].modifiers[0]
					});
				}
			}
			else {
				dashboard.trigger('dataSetChanged', {});
			}
		}, dashboard));
		if (!silent) {
			dashboard.trigger('dataSetChanged', {});
		}
		return newDataSet;
	};

	var removeDataSet = function (id, silent) {
		delete loadedDataSets[id];
		if (!silent) {
			dashboard.trigger('dataSetChanged', id);
		}
	}

	_.extend(this, Backbone.Events);

	this.loadedGadgets = 0;

	this.init = function (callback) {
		var stateLoaded = _.bind(function (state) {
			this.inflateState(state, callback);
		}, this)
		var gadgetsLoaded = _.bind(function (gadgets) {
			gadgetsInfo = gadgets;
			this.loadState(stateLoaded);
		}, this);

		this.loadGadgets(gadgetsLoaded);
		this.onNotification('dataSetLoaded', addDataSet)
		this.onNotification('dataSetUnloaded', removeDataSet)
	};

	this.onNotification = function (notification, callback) {
		var newCallback = function (notificationObject) {
			if (notificationObject['private']) {
				return;
			}
			callback(notificationObject.data);
		}
		this.bind(notification, newCallback);
	};

	this.loadGadgets = function (callback) {
		$.ajax({
			url: /gadgets/,
			type: 'GET',
			success: callback
		});
	};

	this.loadState = function (callback) {

		var dashboardModelChanged = _.bind(function (op) {
			var communications = bayeuxClient;
			var modifiers;
			if (communications) {
				for (index in op) {
					
					// Changes to dashboard layout
					if (op[index].p[0] === 'layout') {
						var colIndex = op[index].p[1];
						var paneIndex = op[index].p[2];
						
						// Pane addition/removal
						if (op[index].p.length === 3) {
							if (op[index].ld) {
								layout[colIndex].splice(paneIndex, 1);
								renderer.removePane(op[index].ld.pane);
							}
							else if (op[index].li) {
								layout[colIndex].splice(paneIndex, 0, op[index].li);
								var paneId = op[index].li.pane;
								renderer.addPane(colIndex, paneId, paneIndex);
							}
						}
						
						// Tab addition/removal
						if (op[index].p.length === 5) {
							var tabIndex = op[index].p[4]
							if (op[index].ld) {
								var tabId = layout[colIndex][paneIndex].tabs[tabIndex];
								renderer.removeTab(tabId);
								layout[colIndex][paneIndex].tabs.splice(tabIndex, 1);
							}
							else if (op[index].li) {
								layout[colIndex][paneIndex].tabs.splice(tabIndex, 0, op[index].li);
								var paneId = layout[colIndex][paneIndex].pane;
								renderer.addTab(paneId, tabIndex, op[index].li);
							}
							
							renderer.refreshTabs();
						}
						renderer.refreshPanes();			
					}
					
					// Change active tab
					if (op[index].p[0] === 'activeTab') {
						if (op[index].od) {
							delete activeTab[op[index].p[1]];
						}
						if (op[index].oi) {
							activeTab[op[index].p[1]] = op[index].oi;
							if (op[index].oi !== 'none') {
								renderer.selectTab(op[index].oi);
							}
						}
					}
					
					// Increment pane ID counter
					if (op[index].p[0] === 'paneIdCounter') {
						paneIdCounter = op[index].oi;
					}
					
					// Gadget state changes
					if (op[index].p[0] === 'gadgets') {
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

					// Add a comment to the comments page
					if (op[index].p[0] === 'comments') {
						this.notify("commentPublished", op[index].li, {
							'self': true
						});
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
								var modColor = {
									"field": "color",
									"grey": []
								};
								var modVis = {
									"field": "visible",
									"true": []
								};
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
		var onDocOpened = function (error, doc) {
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
				dashboardModel.submitOp([{
					p: [],
					oi: {
						"gadgets": gadgets,
						"dataSets": {},
						"comments": [],
					}
				}])
			}
		};

		var sharejsTest = function (state) {
			sharejs.open(state.id, 'json',
				function (error, doc) {
					onDocOpened(error, doc);
					callback(state);
				}
			)
		};

		$.ajax({
			url: url + '/state',
			type: 'GET',
			success: sharejsTest
		});

	};

	this.setContainer = function (container) {
		domContainer = container;
	};

	this.setUrl = function (dashboardUrl) {
		url = dashboardUrl;
	};

	this.makeGadgetInstance = function (gadgetInstanceInfo) {
		newGadgetModel = new UW.GadgetModel(gadgetInstanceInfo.state);
		newGadget = new UW.Gadget({
			model: newGadgetModel
		});
		newGadget.id = gadgetInstanceInfo.id;
		newGadget.gadgetInfoId = gadgetInstanceInfo.gadgetInfoId;
		newGadget.dashboard = this;
		newGadget.dashboardModel = dashboardModel;
		newGadget.url = '/gadgets/' + gadgetsInfo[newGadget.gadgetInfoId].fileName;
		return newGadget;
	}

	this.renderGadgets = function (callback) {
		var gadgetLoaded = _.bind(function () {
			var finished = callback;
			this.gadgetLoaded(finished)
		}, this);
	};

	this.undo = function (callback) {
		dashboardModel.undo();
	}

	this.redo = function (callback) {
		dashboardModel.redo();
	}
	
	this.removePane = function (pos, colIndex) {
		var op1 = {
			p: ['layout', colIndex, pos],
			ld: layout[colIndex][pos]
		};
		
		var paneId = layout[colIndex][pos].pane;
		var op2 = {
			p: ['activeTab', paneId],
			od: activeTab[paneId]
		};
		
		dashboardModel.submitOp([op1, op2]);
	}
	
	this.addPane = function (pos, colIndex, paneId) {
		var opsToSubmit = [];
		
		// If no pane id given, increment the paneIdCounter on the server and use that
		if (paneId === undefined) {
			paneId = paneIdCounter.toString();
			var op = {p: ['paneIdCounter'], od: paneIdCounter, oi: paneIdCounter+1};
			opsToSubmit.push(op);
		}
		
		var paneObj = {'pane': paneId, 'tabs': []};
		
		var op1 = {
			p: ['layout', colIndex, pos],
			li: paneObj
			};
		
		var op2 = {
			p: ['activeTab', paneId],
			oi: 'none'
		}
		
		opsToSubmit.push(op1);
		opsToSubmit.push(op2);
		dashboardModel.submitOp(opsToSubmit);
		
		return paneId;
	}
	
	this.removeTab = function (colIndex, pos, paneId) {
		var paneIndex = -1;
		for (index in layout[colIndex]) {
			if (layout[colIndex][index].pane === paneId) {
				paneIndex = index;
				break;
			}
		}
		
		var opsToSubmit = []
		var tabToRemove = layout[colIndex][paneIndex].tabs[pos];
		
		// Make sure to remove this tab from the 'active tab' list if it is selected
		if (activeTab[tabToRemove] !== undefined) {
			var op1 = {
				p: ['activeTab', paneId],
				od: tabToRemove
			}
			opsToSubmit.push(op1);
		}
		
		var op2 = {
			p: ['layout', colIndex, paneIndex, 'tabs', pos],
			ld: tabToRemove
		};
		opsToSubmit.push(op2);
		
		dashboardModel.submitOp(opsToSubmit);
	}
	
	this.addTab = function (colIndex, pos, paneId, tabId) {
		var paneIndex = -1;
		for (index in layout[colIndex]) {
			if (layout[colIndex][index].pane === paneId) {
				paneIndex = index;
				break;
			}
		}
		
		var op = {
			p: ['layout', colIndex, paneIndex, 'tabs', pos],
			li: tabId
		};
		
		dashboardModel.submitOp(op);
	}
	
	this.selectTab = function (paneId, tabId) {
		var op = {
			p: ['activeTab', paneId],
			oi: tabId
		};
		
		dashboardModel.submitOp(op);
	}
	
	this.addGadget = function (gadgetName, columnNum) {
		// Add the gadget to the dashboard
		var gadgetCount = 1;
		while (gadgets[gadgetName+gadgetCount.toString()] !== undefined) {
			gadgetCount++;
		}
		var gadgetId = gadgetName+gadgetCount.toString();
		var gadgetObj = { 'id': gadgetId, 'gadgetInfoId': gadgetName };
		var op = {
			p: ['gadgets', gadgetId],
			oi: gadgetObj
		};
		dashboardModel.submitOp(op);
		
		// Add a new pane at the bottom of the column
		var pos = layout[columnNum].length;
		var newPaneId = this.addPane(pos, columnNum);
		
		// Add a tab to the new pane
		this.addTab(columnNum, 0, newPaneId, gadgetId);
	}
	
	this.removeGadget = function (gadgetId) {
		var gadgetToRemove = dashboardModel.at('gadgets').get()[gadgetId];
		var op = {
			p: ['gadgets', gadgetId],
			od: gadgetToRemove
		}
		
		dashboardModel.submitOp(op);
	}

	this.createDataSet = function (name, source, query, success, error, staticData, existingRecords) {
		var createDataSetSuccess = function (dataSetId) {
			this.loadDataSet(dataSetId);
			success(dataSetId);
		}
		var queryData = {
			"name": name,
			"source": source,
			"query": query,
			"staticData": staticData || false,
			"returnRecords": true,
			"existingRecords": existingRecords
		};

		UW.ajax({
			"url": "/dataSet/",
			"type": "POST",
			"data": JSON.stringify(queryData),
			"success": _.bind(createDataSetSuccess, this)
		});

	};

	this.createDataSetFromRecords = function (name, records, success) {
		var createDataSetSuccess = function (dataSetId) {
			this.loadDataSet(dataSetId);
			success(dataSetId);
		}
		var data = {
			"name": name,
			"existingRecords": records
		};
		UW.ajax({
			"url": "/dataSet/",
			"type": "POST",
			"data": JSON.stringify(data),
			"success": _.bind(createDataSetSuccess, this)
		});
	};

	this.getComments = function () {
		return dashboardModel.at('comments').get();
	};

	this.publishComment = function (comment) {
		var currentDate = new Date();
		var commentObj = {
			"text": comment,
			"author": 'Anonymous',
			"day": currentDate.getDate(),
			"hours": currentDate.getHours(),
			"minutes": currentDate.getMinutes(),
			"month": currentDate.getMonth(),
			"weekday": currentDate.getDay(),
			"year": currentDate.getFullYear()
		}
		dashboardModel.submitOp({
			p: ['comments', 0],
			li: commentObj
		});
	}

	this.getDataSet = function (id) {
		return loadedDataSets[id];
	};

	this.getDataSetList = function () {
		var dataSetsIds = [];
		for (var id in loadedDataSets) {
			dataSetsIds.push({
				"id": id,
				"text": loadedDataSets[id].name
			});
		}
		return dataSetsIds;
	};

	this.fork = function (success, error) {
		var successFork = function (id) {
			console.log("Dashboard forked");
			success(id);
		};

		UW.ajax({
			"url": "/forkdashboard/" + dashboardModel.at('id').get(),
			"type": "post",
			"success": successFork
		});

	};

	this.notify = function (notification, data, options) {
		options = options || {};
		var notificationObject = {};
		notificationObject['notification'] = notification;
		if (data) {
			notificationObject['data'] = data;
		}
		if (options.sourceId) {
			notificationObject['sourceId'] = options.sourceId;
		}
		if (options['private']) {
			notificationObject['private'] = true;
		}
		this.trigger(notification, notificationObject);
		if (!options.self) {
			bayeuxClient.publish('/dashboard/' + id, notificationObject);
		}
	};

	this.initCommunications = function (channelId) {
		var processNotification = _.bind(function (message) {
			this.trigger(message.notification, message);
		}, this);

		var processHandshake = function (message) {
			console.log("Client connected: " + message.clientId);
		};

		bayeuxClient = new Faye.Client('/faye', {
			timeout: 120
		});
		bayeuxClient.addExtension({
			incoming: function (message, callback) {
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

		bayeuxClient.subscribe('/dashboard/' + channelId, function (message) {
			if (message.selfPublished) return;
			processNotification(message);
		});
	};

	this.inflateState = function (dashboardState, success, error) {
		var newGadget;
		var gadgetInstanceInfo;
		var loadGadgets = _.bind(function () {
			for (i in dashboardState.gadgets) {
				gadgetInstanceInfo = dashboardState.gadgets[i];
				newGadget = this.makeGadgetInstance(gadgetInstanceInfo);
				gadgets[newGadget.id] = newGadget;
				this.loadedGadgets++;
			}

			success();

			this.renderGadgets(_.bind(function () {
				this.notify('dataSetChanged');
			}, this));

		}, this);

		if (!dashboardState)
			return;
		
		layout = dashboardState.layout;
		paneIdCounter = dashboardState.paneIdCounter;
		activeTab = dashboardState.activeTab;

		if (id) {
			this.initCommunications(id);
		}
		else {

			id = dashboardState.id;
			this.initCommunications(id);

			if (dashboardModel.at('dataSets').get()) {
				this.loadDataSets(dashboardModel.at('dataSets').get(), loadGadgets);
			}
			else {
				loadGadgets();
			}
		
			renderer = new UW.Renderer(domContainer, layout, activeTab, gadgets);
		}
	};

	this.fetchDataSet = function (url, success, error) {
		var successLoadingDataSet = function (data) {
			addDataSet(JSON.parse(data));
			if (success) {
				success();
			}
		};
		UW.ajax({
			"url": url,
			"type": "get",
			"success": _.bind(successLoadingDataSet, this)
		});
	}

	this.loadDataSet = function (id) {
		dashboardModel.submitOp({
			p: ['dataSets', id],
			oi: {
				"id": id,
				"url": '/dataSet/' + id,
				"modifiers": []
			}
		});
	}

	this.unloadDataSet = function (id) {
		dashboardModel.submitOp({
			p: ['dataSets', id],
			od: null
		});
	}

	this.loadDataSets = function (dataSets, success, error) {
		var remainingDataSets = 0;
		var succesFetchingDataSet = _.bind(function (data) {
			remainingDataSets--;
			if (remainingDataSets === 0) {
				success();
			}
		}, this);

		var dataSetId;
		for (dataSetId in dataSets) {
			if (dataSets.hasOwnProperty(dataSetId)) {
				remainingDataSets += 1;
			}
		}

		if (remainingDataSets === 0) {
			success();
		}

		for (dataSetId in dataSets) {
			if (dataSets.hasOwnProperty(dataSetId)) {
				this.fetchDataSet(/dataSet/ + dataSetId, succesFetchingDataSet);
			}
		}

	};

	this.gadgetLoaded = function (callback) {
		this.loadedGadgets--;
		if (this.loadedGadgets == 0) {
			callback();
		}
	};

};
