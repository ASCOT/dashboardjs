//     Date: 4/11
//     Author: Diego Marcos (diego.marcos@gmail.com)
//
//     Renderer
// ----------
//     Interface through which the dashboard state controls the DOM

// Framework global variable
var UW = UW || {};

// Create a new layout given a container and information about the layout and gadgets
// contained within.
UW.Renderer = function(container, layout, activeTab, gadgets) {
	// Add a new pane to the DOM
	this.addPane = function (colNum, paneId, pos) {
		layoutManager.addPane(colNum, paneId, pos);
	};
	
	// Remove a pane from the DOM
	this.removePane = function (paneId) {
		layoutManager.removePane(paneId);
	};
	
	// Add a new tab to the DOM. The tab content is an iframe containing the gadget
	this.addTab = function (paneNum, pos, tabId) {
		
		var gadget = gadgets[tabId];
		
		var successCallback = function(id) {
			return function() {
				autoResize(id);
				gadget.inflateState();
			}
		}(gadget.id);
		
		var autoResize = function(id) {
			var height = document.getElementById(id).contentDocument['body'].offsetHeight;
			document.getElementById(id).style.height = height + 'px';
		}
	
		var tabCode = "<iframe src='"+ gadget.url +"' id='"+gadget.id+"' style='width: 100%; height: 100%'>";
		var tabContentEl = layoutManager.addTab(tabCode, paneNum, pos, tabId);
		tabContentEl.load(function(){ gadget.init(successCallback); });
		tabContentEl[0].contentWindow.gadget = gadget;
		gadget.resize = function() { autoResize(this.id); };
	};
	
	// Remove a tab from the DOM
	this.removeTab = function (tabId) {
		layoutManager.removeTab(tabId);
	};
	
	// Activate a tab in the DOM
	this.selectTab = function (tabId) {
		layoutManager.selectTab(tabId);
	}
	
	// Init all panes in the DOM
	this.refreshPanes = function() {
		layoutManager.refreshPanes();
	};
	
	// Init all tabs in the DOM
	this.refreshTabs = function() {
		layoutManager.refreshTabs();
	};

	// Add the specified number of columns to the dashboard
	var columns = $("<div id='columns'></div>");
	var layoutManager = UW.layoutManager(columns);
	$(container).append(columns);
	var width = Object.keys(layout).length;
	var widthStr = (100/width).toString() + "%";
	
	// Add columns and panes, according to the layout tracked by the
	// dashboard state
	for (colIndex in layout) {
		layoutManager.addCol(colIndex, widthStr);
		for (paneIndex in layout[colIndex]) {
			var paneId = layout[colIndex][paneIndex].pane;
			layoutManager.addPane(colIndex, paneId);
			
			var tabs = layout[colIndex][paneIndex].tabs;
			for (tabIndex in tabs) {
				var tabId = tabs[tabIndex];
				this.addTab(paneId, tabIndex, tabId);
			}
		}
	}
	
	// Final initalization of the layout
	layoutManager.initialize(activeTab);
}
