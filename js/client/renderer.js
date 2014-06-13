/**
 *  Date: 4/11
 * @author Diego Marcos (diego.marcos@gmail.com)
 */

var UW = UW || {};

UW.Renderer = function(container, layout, activeTab, gadgets) {
	this.addPane = function (colNum, paneId, pos) {
		layoutManager.addPane(colNum, paneId, pos);
	};
	
	this.removePane = function (paneId) {
		layoutManager.removePane(paneId);
	};
	
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
		tabContentEl[0].contentWindow.resize = autoResize;
	};
	
	this.removeTab = function (tabId) {
		layoutManager.removeTab(tabId);
	};
	
	this.selectTab = function (tabId) {
		layoutManager.selectTab(tabId);
	}
	
	this.refreshPanes = function() {
		layoutManager.refreshPanes();
	};
	
	this.refreshTabs = function() {
		layoutManager.refreshTabs();
	};

	var columns = $("<div id='columns'></div>");
	var layoutManager = UW.layoutManager(columns);
	$(container).append(columns);
	var width = Object.keys(layout).length;
	var widthStr = (100/width).toString() + "%";
	
	// Add columns and panes
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
	
	layoutManager.initalize(activeTab);
}
