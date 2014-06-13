var dataSetsManager = require("./dataSetsManager");
var async = require('async');

var dashboardIdCounter = 0;

var defaultDashboards = [{
	author: 'UW',
	numberOfColumns: 2,
	layout: 
	{ '0': [ {'pane': '0', 'tabs': ['skyView1']}, {'pane': '2', 'tabs': ['dataSetSelector1']}, {'pane': '4', 'tabs': ['tableView1']} ], 
	  '1': [ {'pane': '1', 'tabs': ['nameResolver1']}, {'pane': '3', 'tabs': ['dataInquirer1']}, {'pane': '5', 'tabs': ['plotView1']} ] 
	 },
  paneIdCounter: 6,
  activeTab: 
   { '0': 'skyView1',
     '1': 'nameResolver1',
     '2': 'dataSetSelector1',
     '3': 'dataInquirer1',
     '4': 'tableView1',
     '5': 'plotView1' },
	gadgets: {
		"skyView1": {
			"id": "skyView1",
			"gadgetInfoId": "skyView",
			state: {
				"longitude": -47.17500000000001,
				"latitude": 11.8,
				"flySpeed": 1
			}
		},
		"nameResolver1": {
			"id": "nameResolver1",
			"gadgetInfoId": "nameResolver"
		},
		"dataSetSelector1": {
			"id": "dataSetSelector1",
			"gadgetInfoId": "dataSetSelector"
		},
		"dataInquirer1": {
			"id": "dataInquirer1",
			"gadgetInfoId": "dataInquirer"
		},
		"tableView1": {
			"id": "tableView1",
			"gadgetInfoId": "tableView"
		},
		"plotView1": {
			"id": "plotView1",
			"gadgetInfoId": "plotView"
		}
	},
	dataSets: {},
	comments: []
}, {
	author: 'GalaxyZOO',
	numberOfColumns: 2,
	layout: 
	{ '0': [ {'pane': '0', 'tabs': ['skyView1']}, {'pane': '2', 'tabs': ['dataSetSelector1']}, {'pane': '4', 'tabs': ['tableView1']} ], 
	  '1': [ {'pane': '1', 'tabs': ['nameResolver1']}, {'pane': '3', 'tabs': ['dataInquirer1']} ] 
	 },
  paneIdCounter: 5,
  activeTab: 
   { '0': 'skyView1',
     '1': 'nameResolver1',
     '2': 'dataSetSelector1',
     '3': 'dataInquirer1',
     '4': 'tableView1' },
	gadgets: {
		"skyView1": {
			"id": "skyView1",
			"gadgetInfoId": "skyView",
			state: {
				"longitude": -47.17500000000001,
				"latitude": 11.8,
				"flySpeed": 1
			}
		},
		"nameResolver1": {
			"id": "nameResolver1",
			"gadgetInfoId": "nameResolver"
		},
		"dataSetSelector1": {
			"id": "dataSetSelector1",
			"gadgetInfoId": "dataSetSelector"
		},
		"dataInquirer1": {
			"id": "dataInquirer1",
			"gadgetInfoId": "dataInquirer"
		},
		"tableView1": {
			"id": "tableView1",
			"gadgetInfoId": "tableView"
		}
	},
	dataSets: {},
	comments: []
}, {
	author: 'GalaxyZOO',
	numberOfColumns: 2,
	layout: 
	{ '0': [ {'pane': '0', 'tabs': ['skyView1']}, {'pane': '2', 'tabs': ['dataSetSelector1']} ], 
	  '1': [ {'pane': '1', 'tabs': ['nameResolver1']} ] 
	 },
  paneIdCounter: 3,
  activeTab: 
   { '0': 'skyView1',
     '1': 'nameResolver1',
     '2': 'dataSetSelector1' },
	gadgets: {
		"skyView1": {
			"id": "skyView1",
			"gadgetInfoId": "skyView",
			state: {
				"longitude": -47.17500000000001,
				"latitude": 11.8,
				"flySpeed": 1
			}
		},
		"nameResolver1": {
			"id": "nameResolver1",
			"gadgetInfoId": "nameResolver"
		},
		"dataSetSelector1": {
			"id": "dataSetSelector1",
			"gadgetInfoId": "dataSetSelector"
		}
	},
	dataSets: {},
	comments: []
}, {
	author: 'Spencer',
	name: 'astroJsFitsViewer',
	numberOfColumns: 2,
	layout: 
	{ '0': [ {'pane': '0', 'tabs': ['dataInquirer1']}, {'pane': '2', 'tabs': ['astroJsFitsViewer1']} ], 
	  '1': [ {'pane': '1', 'tabs': ['plotView1']} ] 
	 },
  paneIdCounter: 3,
  activeTab: 
   { '0': 'dataInquirer1',
     '1': 'astroJsFitsViewer1',
     '2': 'plotView1' },
	gadgets: {
		"dataInquirer1": {
			"id": "dataInquirer1",
			"gadgetInfoId": "dataInquirer"
		},
		"astroJsFitsViewer1": {
			"id": "astroJsFitsViewer1",
			"gadgetInfoId": "astroJsFitsViewer"
		},
		"plotView1": {
			"id": "plotView1",
			"gadgetInfoId": "plotView"
		}
	},
	dataSets: {},
	comments: []
}, {
	author: 'Spencer',
	name: 'ScatterPlotHistogramAndASCIILoader',
	numberOfColumns: 2,
	layout: 
	{ '0': [ {'pane': '0', 'tabs': ['ASCIIDataLoader1']}, {'pane': '2', 'tabs': ['dataSetSelector1']}, {'pane': '4', 'tabs': ['tableView1']}, {'pane': '6', 'tabs': ['histogramView1']} ], 
	  '1': [ {'pane': '1', 'tabs': ['nameResolver1']}, {'pane': '3', 'tabs': ['dataInquirer1']}, {'pane': '5', 'tabs': ['scalableScatter1']} ] 
	 },
  paneIdCounter: 7,
  activeTab: 
   { '0': 'ASCIIDataLoader1',
     '1': 'nameResolver1',
     '2': 'dataSetSelector1',
     '3': 'dataInquirer1',
     '4': 'tableView1',
     '5': 'scalableScatter1',
     '6': 'histogramView1' },
  gadgets: {
		"ASCIIDataLoader1": {
			"id": "ASCIIDataLoader1",
			"gadgetInfoId": "ASCIIDataLoader"
		},
		"nameResolver1": {
			"id": "nameResolver1",
			"gadgetInfoId": "nameResolver"
		},
		"dataSetSelector1": {
			"id": "dataSetSelector1",
			"gadgetInfoId": "dataSetSelector"
		},
		"dataInquirer1": {
			"id": "dataInquirer1",
			"gadgetInfoId": "dataInquirer"
		},
		"tableView1": {
			"id": "tableView1",
			"gadgetInfoId": "tableView"
		},
		"scalableScatter1": {
			"id": "scalableScatter1",
			"gadgetInfoId": "scalableScatter"
		},
		"histogramView1": {
			"id": "histogramView1",
			"gadgetInfoId": "histogramView"
		}
	},
	dataSets: {},
	comments: []
}];

var defaultGadgetsSet = {
	skyView: {
		number: 1
	},
	nameResolver: {
		number: 1
	},
	dataInquirer: {
		number: 1
	},
	plotView: {
		number: 1
	}
};

module.exports = function (app, model) {

	var createDashboard = function (dashboardObj, callback) {
		var data = {};
		var dashboardCreated = function () {
			callback(dashboardObj.id);
		}
		dashboardObj.id = dashboardIdCounter.toString();
		data.snapshot = dashboardObj;
		model.create(dashboardObj.id, 'json', data, callback);
		dashboardIdCounter++;
	}

	var cloneObject = function (obj) {
		if (null == obj || "object" != typeof obj) return obj;
		var copy = obj.constructor();
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
		}
		return copy;
	}

	var parseConfiguration = function (configuration, callback) {
		var i;
		var newDashboard = {
			author: 'UW',
			numberOfColumns: 2,
			layout: {},
			paneIdCounter: 0,
			activeTab: {},
			gadgets: {},
			dataSets: {},
			comments: []
		};

		var gadgets = (configuration && configuration.gadgets) || defaultGadgetsSet;
		var dataSets = (configuration && configuration.dataSets) || [];
		var currentDataSet = dataSets.length;
		var newGadget;

		var dataSetsLoaded = function (err, dataSetsIds) {
			var newDataSet;
			var i = 0;
			if (!err) {
				while (i < dataSetsIds.length) {
					dataSet = {
						"id": dataSetsIds[i],
						"modifiers": []
					};
					newDashboard.dataSets[dataSet.id] = dataSet;
					i += 1;
				}
				callback(newDashboard);
			}
		};

		for (var i = 0; i < newDashboard.numberOfColumns; i++) {
			newDashboard.layout[i] = [];
		}

		// Expand list of gadgets  
		var putInLeft = true;
		for (id in gadgets) {
			if (gadgets.hasOwnProperty(id)) {
				i = gadgets[id].number;
				for (i; i > 0; --i) {
					newGadget = {};
					newGadget['id'] = id + i;
					newGadget['gadgetInfoId'] = id;
					if (gadgets[id].state) {
						newGadget['state'] = gadgets[id].state;
					}
					newDashboard.gadgets[newGadget.id] = newGadget;
					var col = putInLeft ? 0 : 1;
					putInLeft = !putInLeft;
					var paneObj = {'pane': newDashboard.paneIdCounter.toString(), 'tabs': [(id+i).toString()]};
					newDashboard.layout[col].push(paneObj);
					newDashboard.activeTab[newDashboard.paneIdCounter] = (id+i).toString();
					newDashboard.paneIdCounter++;
				}
			}
		}

		// Load Data Sets
		async.map(
			dataSets,
			function (dataSetInfo, callback) {
				dataSetsManager.createDataSet(dataSetInfo,
					function (id) {
						callback(null, id);
					}
				);
			},
			dataSetsLoaded
		);

	};

	async.forEach(
		defaultDashboards,
		createDashboard,
		function (err) {
			if (!err) {
				console.log("Dashboards initialized!");
			}
		}
	);

	//// REST API ////

	app.get('/dashboard/gadgets/', function (req, res) {
		res.send(JSON.stringify(dashboardsManager.find(req.params.id)));
	});

	app.get('/dashboard/:id', function (req, res) {
		res.render("dashboardPanel", {
			locals: {
				id: req.params.id,
				resourceUrl: '"/dashboard"'
			}
		});
	});

	app.post('/dashboard/', function (req, res) {
		var configuration = req.body || undefined;
		async.waterfall([

			function (callback) {
				parseConfiguration(configuration,
					function (dashboard) {
						callback(null, dashboard);
					});
			},
			function (dashboard, callback) {
				console.log(dashboard);
				createDashboard(dashboard,
					function () {
						callback(null, dashboard.id);
					});
			},
			function (dashboardId, callback) {
				res.send(dashboardId.toString());
			}
		]);
	});

	app.post('/dashboard/:id', function (req, res) {
		var state = req.body || undefined;
		dashboardsManager.set(req.params.id, state);
		res.send("Dashboard saved");
	});

	app.post('/forkdashboard/:id', function (req, res) {
		var data = {};
		async.waterfall([

			function (callback) {
				if (req.params.id) {
					app.model.getSnapshot(req.params.id, callback);
				}
			},
			function (dashboard, callback) {
				data.snapshot = cloneObject(dashboard.snapshot);
				data.snapshot.id = dashboardIdCounter.toString();
				app.model.create(data.snapshot.id, 'json', data, callback);
				dashboardIdCounter++;
			},
			function () {
				res.send(data.snapshot.id);
			}
		]);
	});

};
