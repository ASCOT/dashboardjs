//     Date: 6/14
//     Author: Spencer Wallace (spencerw@email.arizona.edu)
//
//     Layout Manager
// ----------
//     Handles the organization of gadgets in tabs, panes and columns

// Framework global variable
var UW = UW || {};

// The constructor takes the element to which columns will be appended
UW.layoutManager = function (rootElement) {
	// Need to keep track of initalization state. Prevents unexpected behavior if
	// the dashboard state changes while the layout is being initialized
	var layoutInitialized = false;

	// This function sets up the DOM using jQuery's sortable API.
	// Call this whenever the layout needs to be refreshed
	function makeSortable() {
		// Keep track of information about drag before elements are dropped
		var movePane = this.movePane;
		var paneDragSourceColId;
		var paneDragSourcePos;
		var tabsInPane;
		var oldSelectedTab;
		var tabDragSourcePaneId;
		var tabDragSourcePos;
		var sourcePanePos;
		var sourceCol;

		// Placeholder for elements currently being dragged
		function helperEl() {
			var helperDiv = $("<div class='helper'></div>");
			return helperDiv;
		}
		// Panes are sortable
		$(".column").sortable({
			connectWith: $(".column"),
			placeholder: 'panePlaceholder',
			forcePlaceholderSize: true,
			forceHelperSize: true,
			opacity: 0.8,
			handle: '.ui-widget-header',
			helper: helperEl,
			dropOnEmpty: true,
			// Keep track of information about the source when a pane is dragged
			start: function (e, ui) {
				paneDragSourceColId = ui.item.parent().attr('id').charAt(ui.item.parent().attr('id').length-1);
				paneDragSourcePos = ui.item.parent().children().index(ui.item);
				oldSelectedTab = ui.item.find('.ui-state-active').attr('id').substring(5);
				
				tabsInPane = [];
				ui.item.children().find('li').each(function(index) {
					tabsInPane.push($(this).attr('id').substring(5));
				});
			},
			// When a pane is dropped, remove all tabs from the old pane, remove the pane,
			// add an empty pane in the new position and add all of the old tabs to the new pane.
			stop: function (e, ui) {
				var paneId = ui.item.attr('id').charAt(ui.item.attr('id').length-1);
				var toColId = ui.item.parent().attr('id').charAt(ui.item.parent().attr('id').length-1);
				var dropPos = ui.item.parent().children().index(ui.item);
	
				// This function simply sends commands to the server. The response from the server is what
				// actually manipulates the DOM
				$(this).sortable('cancel');
				for (index in tabsInPane) {
					ASCOT.dashboard.removeTab(paneDragSourceColId, 0, paneId);
				}
				ASCOT.dashboard.removePane(paneDragSourcePos, paneDragSourceColId);
				
				ASCOT.dashboard.addPane(dropPos, toColId, paneId);
				for (index in tabsInPane) {
					ASCOT.dashboard.addTab(toColId, index, paneId, tabsInPane[index]);
				}
				ASCOT.dashboard.selectTab(paneId, oldSelectedTab);
			}
		});

		// Tabs are also sortable
		var sortableItems = $(".tabHandle");
		$(".tabHandle").sortable({
			items: sortableItems,
			connectWith: $('.ui-tabs-nav'),
			placeholder: 'tabPlaceholder',
			forcePaceholderSize: true,
			helper: helperEl,
			forceHelperSize: true,
			opacity: 0.8,
			delay: 50,
			// Keep track of information about the source when a tab is dragged
			start: function (e, ui) {
				tabDragSourcePaneId = ui.item.parent().parent().parent().parent().attr('id').charAt(ui.item.parent().parent().parent().parent().attr('id').length-1);
				tabDragSourcePos = ui.item.parent().children("li").index(ui.item);
				sourcePanePos = ui.item.parent().parent().parent().parent().parent().children().index(ui.item.parent().parent().parent().parent());
				sourceCol = ui.item.parent().parent().parent().parent().parent().attr('id').charAt(ui.item.parent().parent().parent().parent().parent().attr('id').length-1);
				
				ui.placeholder.css('min-width', ui.item.width() + 'px');
				ui.placeholder.css('min-height', ui.item.height() + 'px');
			},
			// When a tab is dropped, remove the old tab and add a tab in the drop position
			stop: function (e, ui) {
				var tabId = ui.item.attr('id').substring(5);
				var destCol;
				
				var toPaneId = ui.item.parent().parent().parent().parent().attr('id').charAt(ui.item.parent().parent().parent().parent().attr('id').length-1);
				var dropPos = ui.item.parent().children().index(ui.item);
				destCol = ui.item.parent().parent().parent().parent().parent().attr('id').charAt(ui.item.parent().parent().parent().parent().parent().attr('id').length-1);
				
				// Dont do anything if we dropped the tab back into the same spot
				if (sourceCol === destCol && tabDragSourcePos === dropPos && tabDragSourcePaneId === toPaneId) return;
				
				// Again, the response from the server is what modifies the DOM. We don't want the drop action to do anything besides
				// send a request to the server.
				$(this).sortable('cancel');
				ASCOT.dashboard.removeTab(sourceCol, tabDragSourcePos, tabDragSourcePaneId);
				// Be sure to remove the old pane if this was the last tab in it
				if ($("#paneTabs"+tabDragSourcePaneId+ " ul").children().length === 0) {
					ASCOT.dashboard.removePane(sourcePanePos, sourceCol);
				}
				ASCOT.dashboard.addTab(destCol, dropPos, toPaneId, tabId);
				// Immediately activate the new tab
				ASCOT.dashboard.selectTab(toPaneId, tabId)
			}
		});
	}

	// This function gets a list of available gadgets from the server and puts them
	// into an unordered list. liClickFunction is the function that executes when
	// one of the list elements is clicked.
	function populateGadgetList(listUl, liClickFunction) {
		var success = function(listResults) {
			listUl.empty();
			for (id in listResults) {
				if (listResults.hasOwnProperty(id)) {
					var li = $("<li id='"+id+"'>"+listResults[id].name+"</li>");
					li.click(function(e) { liClickFunction(e) });
					listUl.append(li);
				}
			}
		};
		
		$.ajax({
			'url': '/gadgets/',
			success: success
		});
	}

	// This function returns a new DOM element for an add gadget control. These are the
	// purple buttons which appear at the bottom of each column on the dashboard.
	function getAddGadgetDiv(colId) {
		var addGadgetDiv = $("<div id='addToCol"+colId+"'></div>");
		
		// The button
		var addButton = $("<button id='addGadgetToCol"+colId+"' style='width: 100%'></button>");
		var addIcon = $("<span class='ui-icon ui-icon-plus' id='addSpan"+colId+"' role='presentation'>Add Pane</span>");
		addButton.append(addIcon);
		
		// The gadgets list
		var list = $("<ul id='colGadgetsList"+colId+"' class='gadgetsListInternal'></ul>");
		addGadgetDiv.append(list);
		
		addGadgetDiv.append(addButton);
		list.hide();
		addButton.click(function() { 
			addIcon.toggleClass('ui-icon-plus');
			addIcon.toggleClass('ui-icon-minus');
			list.toggle();
		});
		
		// Tell the server to add a new gadget to the dashboard when a gadget name is clicked.
		var clickGadgetName = function(e) {
			var gadgetName = $(e.target).attr('id');
			var columnNum = $(e.target).parent().parent().parent().attr('id').charAt($(e.target).parent().parent().parent().attr('id').length-1);
			
			ASCOT.dashboard.addGadget(gadgetName, columnNum);
			addIcon.toggleClass('ui-icon-plus');
			addIcon.toggleClass('ui-icon-minus');
			list.hide();
		}
		populateGadgetList(list, clickGadgetName);
		return addGadgetDiv;
	}

	// Adds a column with the specified id and width (in pixels) to the container. Also adds an "add gadget" control at the bottom.
	function addColumn(colId, width) {
		var colDiv = $("<div id='colContainer" + colId + "' class='columnContainer' style='width: "+width+"'></div>");
		var newCol = $("<ul id='col" + colId + "' class='column'></ul>");
		rootElement.append(colDiv);
		colDiv.append(newCol);
	
		var addGadgetDiv = getAddGadgetDiv(colId);
		colDiv.append(addGadgetDiv);
	}

	// Adds a pane to the specified column and position with the given id
	function addPane(colNum, paneId, pos) {
		var newPane = $("<li class='pane' id='pane" + paneId + "'></li>");
		var paneContent = $("<div class='paneContent' id='paneContent" + paneId + "'></div>");
		var paneTabs = $("<div id='paneTabs" + paneId + "' class='tabContainer'><ul></ul></div>");

		// If no position specified, add it to the bottom
		if (pos === undefined) {
			$("#col" + colNum).append(newPane);
		}
		else if (pos > 0) {
			$("#col" + colNum).children().eq(pos - 1).after(newPane);
		}
		else if (pos === 0) {
			$("#col" + colNum).prepend(newPane);
		}

		newPane.append(paneContent);
		paneContent.append(paneTabs);
	}
	
	// Remove a specific pane from the DOM
	function removePane(paneId) {
		$("#pane" + paneId).remove();
	}

	// Add a new tab element to a certain pane and position with the given id and content
	function addTab(tabContentCode, paneNum, pos, tabId) {
		var pos = parseInt(pos);
		var tabDiv = $("#paneTabs" + paneNum);
		var ul = $("#paneTabs" + paneNum + " > ul");
		var newLi = $("<li id='tabLi" + tabId + "' class='tabHandle'><a href='#tabContent" + tabId + "' style='padding-right: 0px'>" + tabId + "</a></li>");
		var newContent = $("<div id='tabContent" + tabId + "'></div>");

		var numTabs = ul.children().length;

		if (pos > 0) {
			ul.children().eq(pos - 1).after(newLi);
			tabDiv.children("div").eq(pos - 1).after(newContent);
		}
		else if (pos === 0) {
			ul.prepend(newLi);
			ul.after(newContent);
		}

		// The eject button puts this tab in its own pane
		var ejectTabButton = $("<span class='ui-icon ui-icon-arrowthickstop-1-n' id='ejectTab" + tabId + "' style='float: right' role='presentation'>Remove Tab</span>");
		ejectTabButton.click(function (e) {
			var sourceCol = $(e.target).parent().parent().parent().parent().parent().parent().attr('id').charAt($(e.target).parent().parent().parent().parent().parent().parent().attr('id').length-1);
			var tabPos = $(e.target).parent().parent().children().index($(e.target).parent());
			var ejectPaneId = $(e.target).parent().parent().parent().attr('id').charAt($(e.target).parent().parent().parent().attr('id').length-1);
			var panePos = $(e.target).parent().parent().parent().parent().parent().parent().children().index($(e.target).parent().parent().parent().parent().parent());
			
			ASCOT.dashboard.removeTab(sourceCol, tabPos, ejectPaneId);
			if ($("#paneTabs"+ejectPaneId+ " ul").children().length === 0) {
				ASCOT.dashboard.removePane(panePos, sourceCol);
			}
			var newPaneId = ASCOT.dashboard.addPane(panePos, sourceCol);
			ASCOT.dashboard.addTab(sourceCol, 0, newPaneId, tabId);
			ASCOT.dashboard.selectTab(newPaneId, tabId);
		});

		// The close button completely removes this tab from the dashboard state
		var closeTabButton = $("<span class='ui-icon ui-icon-close' id='closeTab" + tabId + "' style='float: right' role='presentation'>Remove Tab</span>");
		closeTabButton.click(function (e) {
			var tabToClose = e.target.id.charAt(e.target.id.length - 1);
			var colIndex = $(e.target).parent().parent().parent().parent().parent().parent().attr('id').charAt($(e.target).parent().parent().parent().parent().parent().parent().attr('id').length-1);
			var panePos = $(e.target).parent().parent().parent().parent().parent().parent().children().index($(e.target).parent().parent().parent().parent().parent());
			var tabPos = $(e.target).parent().parent().children().index($(e.target).parent());
			var paneId = $(e.target).parent().parent().parent().attr('id').charAt($(e.target).parent().parent().parent().attr('id').length-1);
			var gadgetId = e.target.id.substr(8);
			
			// Tell the server to remove the tab and gadget
			ASCOT.dashboard.removeTab(colIndex, tabPos, paneId);
			ASCOT.dashboard.removeGadget(gadgetId);
			// Remove the pane if this is the last tab in it
			if ($("#paneTabs"+paneId+ " ul").children().length === 0) {
				ASCOT.dashboard.removePane(panePos, colIndex);
			}
		});
		newLi.append(closeTabButton);
		newLi.append(ejectTabButton);

		var tabContent = $(tabContentCode);
		newContent.append(tabContent);
		
		return tabContent;
	}

	// Remove the given tab from the DOM
	function removeTab(tabId) {
		$("#tabLi" + tabId).remove();
		$("#tabContent" + tabId).remove();
	}
	
	// Activate the given tab in the DOM
	function selectTab(tabId) {
		var tabLi = $("#tabLi"+tabId);
		var index = tabLi.parent().children().index(tabLi);
		var paneId = tabLi.parent().parent().attr('id').charAt(tabLi.parent().parent().attr('id').length-1);
		$("#paneTabs"+paneId).tabs('option', 'active', index);
	}

	// Moves tab at the specified position and pane to a new position and pane in the DOM
	function moveTab(fromPaneId, fromPos, toPaneId, toPos) {
		var liToMove = $("#paneTabs" + fromPaneId + " > ul").children().eq(fromPos);
		var contentToMove = $("#paneTabs" + fromPaneId + " > div").eq(fromPos);
		var toUl = $("#paneTabs" + toPaneId + " > ul");
		var toContent = $("#paneTabs" + toPaneId);

		if (toPos > 0) {
			toUl.children().eq(toPos - 1).after(liToMove);
			toContent.children("div").eq(toPos - 1).after(contentToMove);
		}
		else if (toPos === 0) {
			toUl.prepend(liToMove);
			toUl.after(contentToMove);
		}

		// Remove the old pane if it is now empty
		var numSourceTabs = $("#paneTabs" + fromPaneId + " > ul").children().length;
		if (numSourceTabs === 0) {
			$("#pane" + fromPaneId).remove();
		}
	}
	
	// Notify the server if the user activates a tab
	function initTabs($container) {
		$container.tabs({
			activate: function (event, ui) {
				if (!layoutInitialized) return false;
				var paneId = ui.newTab.parent().parent().attr('id').charAt(ui.newTab.parent().parent().attr('id').length-1)
				var tabId = ui.newTab.attr('id').substring(5)
				ASCOT.dashboard.selectTab(paneId, tabId);
			}
		});
	}
	
	// Initalize any new tab containers and refresh existing ones
	function refreshTabs() {
		$(".tabContainer").each(function() {
			if ($(this).hasClass("ui-tabs")) {
				$(this).tabs('refresh');
			}
			else {
				initTabs($(this));
			}
		});
	}
	
	// Set up the DOM given a list of tabs
	function initialize(activeTabs) {
		refreshTabs();
		makeSortable();
		
		for (i in activeTabs) {
			selectTab(activeTabs[i]);
		}
		
		layoutInitialized = true;
	}

	return {
		addCol: addColumn,
		addPane: addPane,
		removePane: removePane,
		addTab: addTab,
		removeTab: removeTab,
		selectTab: selectTab,
		refreshPanes: makeSortable,
		refreshTabs: refreshTabs,
		initialize: initialize
	}
};
