/**
 * @namespace The global ASCOT namespace
 * @type {Object} 
 */
var UW = UW || {};


var logConsole = window.console ? window.console :
                 window.opera   ? window.opera.postError : undefined;

/**
 * @static
 * @namespace Support for basic logging capability.
 * @name UW.log
 */
UW.log = function (){

	function logMessage(level, message) {
  
 		 if (level === "WARNING" && logConsole.warn) {
 		   logConsole.warn(message);
 		 } else if (level === "ERROR" && logConsole.error) {
 		   logConsole.error(message);
 		 } else if (logConsole.log) {
 		   logConsole.log(message);
 		 }
  
	};

	return{
	
		warning: function(message){
			logMessage("WARNING",message);
		},
		error: function(message){
			logMessage("ERROR",message);
		},
		log: function(message){
			logMessage("LOG",message);
		}
	
	};

}();	

UW.tabbedLayoutManager = function(numberOfPanes) {

  var rootElement;
  var numColumns = 0;
  var columns = [];
  var paneObjects = [];
  var gadgetObjects = [];

  var tabCount = 0;
  var paneCount = numberOfPanes;

  function setupAddToPaneButton(pane) {
    var addToPaneHTML =
    "<div id='addGadgetPane"+pane+"' style='float: right'>" +
      "<div id='gadgetSelectionPane"+pane+"' class='addGadgetPane addGadgetPaneSmall' style='float: left'>" +
	"<div style='float: left'><b>Add a gadget:</b></div>"+
	"<span class='ui-icon ui-icon-close closeGadgetSelectButton' id='gadgetSelectClosePane"+pane+"' role='presentation' style='float: right'>"+
	  "Close Gadget Selection"+
	"</span><br>" +
	"<form action='#' method='get'>" +
	  "<ul id='paneGadgetsList"+pane+"' class='gadgetsListInternal gadgetsListSmall'></ul>" +
	"</form>" +
      "</div>"+
      "<button id='addGadgetToPane"+pane+"' class='addGadgetToPanelButton'>"+
	"<span class='ui-icon ui-icon-plus adjustPlusIcon' role='presentation'>Add Pane</span>"+
      "</button>"+
    "</div>";
    $("#pane"+pane).append(addToPaneHTML);
    $("#gadgetSelectionPane"+pane).hide();
    $("#addGadgetToPane"+pane).click(function() {
      var buttonId = $(this).attr('id');
      var paneId = parseInt(buttonId.charAt(buttonId.length-1));
      var success = function() {
	$("#gadgetSelectionPane"+paneId).show();
      }
      constructPaneGadgetSelect(paneId, success);
    });

    $("#gadgetSelectClosePane"+pane).click(function() {
      var buttonId = $(this).attr('id');
      var colId = parseInt(buttonId.charAt(buttonId.length-1));
      $("#gadgetSelectionPane"+colId).hide();
      $("#addGadgetToPane"+colId).show();
    });
  }

  function setupAddToColButton(column) {
    var addButtonHTML = 
    "<div id='addGadgetCol"+column+"' class='addGadgetColFrame'>" +
      "<div id='gadgetSelectionCol"+column+"' class='addGadgetCol' style='float: left'>" +
	"<div style='float: left'><b>Add a gadget:</b></div>"+
	"<span class='ui-icon ui-icon-close' id='gadgetSelectCloseCol"+column+"' class='closeGadgetSelectButton' role='presentation' style='float: right'>"+
	  "Close Gadget Selection"+
	"</span><br>" +
	"<form action='#' method='get'>" +
	  "<ul id='colGadgetsList"+column+"' class='gadgetsListInternal'></ul>" +
	"</form>" +
      "</div>"+
      "<button id='addGadgetToCol"+column+"' style='width: 100%'>"+
	"<span class='ui-icon ui-icon-plus' role='presentation'>Add Pane</span>"+
      "</button>"+
    "</div>";
    $("#column"+column).append(addButtonHTML);
    $("#gadgetSelectionCol"+column).hide();
    $("#addGadgetToCol"+column).click(function() {
      var buttonId = $(this).attr('id');
      var colId = parseInt(buttonId.charAt(buttonId.length-1));
      $(this).hide();
      var success = function() {
	$("#gadgetSelectionCol"+colId).show();
      }
      constructColGadgetSelect(colId, success);
    });
    
    $("#gadgetSelectCloseCol"+column).click(function() {
      var buttonId = $(this).attr('id');
      var colId = parseInt(buttonId.charAt(buttonId.length-1));
      $("#gadgetSelectionCol"+colId).hide();
      $("#addGadgetToCol"+colId).show();
    });
  }

  function constructPaneGadgetSelect(paneId, success) {
    function populateGadgetsList(gadgetsList) {
      var entryHTML;  
      gadgets = gadgetsList; 
      $("#paneGadgetsList"+paneId).empty();
      for (id in gadgetsList){
	if(gadgetsList.hasOwnProperty(id)){
	  entryHTML = "<li id='"+id+"'>"+gadgetsList[id].name+"</li>";
	  $("#paneGadgetsList"+paneId).append(entryHTML);
	}
      }
      $("#paneGadgetsList"+paneId+" li").click(function() {
	var buttonId = $(this).parent().attr('id');
	var paneId = parseInt(buttonId.charAt(buttonId.length-1));
	var columnId = paneObjects[paneId].parentColumnId;
	ASCOT.dashboard.addGadget($(this).attr('id'), columnId, paneId);
	$("#gadgetSelectionPane"+paneId).hide();
      });
      success();
    }

    $.ajax({
      'url': '/gadgets/',
      success: populateGadgetsList });
  }

  function constructColGadgetSelect(colId, success) {
    function populateGadgetsList(gadgetsList) {
      var entryHTML;  
      gadgets = gadgetsList; 
      $("#colGadgetsList"+colId).empty();
      for (id in gadgetsList){
	if(gadgetsList.hasOwnProperty(id)){
	  entryHTML = "<li id='"+id+"'>"+gadgetsList[id].name+"</li>";
	  $("#colGadgetsList"+colId).append(entryHTML);
	}
      }
      $("#colGadgetsList"+colId+" li").click(function() {
	var buttonId = $(this).parent().attr('id');
	var colId = parseInt(buttonId.charAt(buttonId.length-1));

        // Keep incrementing the pane id until we find a nonexistent one
	var paneId = 0;
	while ($("#pane"+paneId).length !== 0)
	   paneId++;
	ASCOT.dashboard.addGadget($(this).attr('id'), colId, paneId);
	paneCount++;
	$("#gadgetSelectionCol"+colId).hide();
	$("#addGadgetToCol"+colId).show();
      });
      success();
    }
    
    $.ajax({
      'url': '/gadgets/',
      success: populateGadgetsList });
  }

  function getNewPaneHTML(paneId) {
    var tabsList = "<ul id='tabList"+paneId+"' class='tabBar'></ul>";
    return "<div id='pane"+paneId+"' class='tabPane'>"+tabsList+"</div>"
  }

  function getNewTabHTML(tabName) {
    var li = "<li id='tab"+tabCount+"' class='draggableTab'><span class='ui-icon ui-icon-close' id='closeTab"+tabCount+"' style='float: right' role='presentation'>Remove Tab</span><a href='#tabContent"+tabCount+"'>"+tabName+"</a></li>";
    var content = "<div id='tabContent"+tabCount+"' class='tabContentOuter'></div>";
    return { tab: li, newContent: content };
  }

  function initDraggableTabs() {
    $(".draggableTab").draggable({
     revert: "invalid",
     zIndex: 300
    });
    $(".draggableTab").droppable({
     accept: ".draggableTab",
     hoverClass: "ui-state-highlight",
     drop: function(event, ui) {
        var tabToMove = parseInt(ui.draggable[0].id.charAt(3));
	var moveFrom = parseInt(ui.draggable[0].parentNode.id.charAt(7));
        var moveTo = parseInt(this.parentNode.id.charAt(7));
	var nodeList = this.parentElement.childNodes;
	var insertIndex = 0;
	for (i in nodeList) {
	  if (nodeList[i] === this) {
	    break;
	  }
	  if (moveFrom === moveTo) {
	    if (nodeList[i] === $("#tab"+tabToMove)[0]) {
	      continue;
	    }
	  }
	  insertIndex++;
	}
	handleMoveTab(tabToMove, moveFrom, moveTo, insertIndex);
      }
    });
  }

  // tabToMove - The id of the tab that is being dragged
  // moveFrom - The id of the panel from which the drag started
  // moveTo - The id of the panel to which the tab is being dragged
  // insertIndex - The position in the tab list that the new tab will have (0 = first position)
  function handleMoveTab(tabToMove, moveFrom, moveTo, insertIndex) {
    var gadgetId = gadgetObjects[tabToMove].id;
    var newColumnId = paneObjects[moveTo].parentColumnId;
    ASCOT.dashboard.moveGadget(gadgetId, moveTo, newColumnId);
    /*// Generate a new DOM object for the tab
    var li = "<li id='tab"+tabToMove+"' class='draggableTab'><a href='#tabContent"+tabToMove+"'>Tab "+tabToMove+"</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>"
    
    $("#tab"+tabToMove).remove();
    
    // Add the new tab DOM object in the correct position
    var insertIndexCount = 0;
    $("#tabList"+moveTo+" > .draggableTab").each(function(index) {
	if (insertIndexCount === insertIndex) {
	  $(this).before(li);
	  return false;
	}
	else
	  insertIndexCount++;
    });
    // Make sure the new tab is draggable and droppable
    initDraggableTabs();

    // Set the iframe content window to the 'gadget' namespace
    $("#pane"+moveTo).append($("#tabContent"+tabToMove));
    $("#tabContent"+tabToMove).children().children().children()[0].contentWindow.gadget = gadgetObjects[tabToMove]; 

    $("#pane"+moveTo).tabs("refresh");
    $("#pane"+moveFrom).tabs("refresh");
    cleanEmptyPanes();*/
  }
  
  function cleanEmptyPanes() {
    for (i in paneObjects) {
      if ($("#tabList"+i).children().length < 1) {
	$("#pane"+i).remove();
	delete paneObjects[i];
      }
    }
  }

  function initInterface() {
    for (i in paneObjects) {
      if (paneObjects[i].initalized) {
	$("#pane"+i).tabs('refresh');
      }
      else {
	$("#pane"+i).tabs();
	paneObjects[i].initalized = true;
      }
    } 
    initDraggableTabs();
  }

  function addPane(columnNum, newPaneId) {
    column = $("#column"+columnNum);
    var newPane = $(getNewPaneHTML(newPaneId));
    var paneObject = { element: newPane, parentColumnId: columnNum, id: newPaneId, initalized: false  };
    paneObjects[newPaneId] = paneObject;
    $("#addGadgetCol"+columnNum).before(newPane);
    setupAddToPaneButton(newPaneId);
  }

  function addTab(paneId, tabContent, tabName) {
    var tabList = $("#tabList"+paneId);
    var newTab = getNewTabHTML(tabName);
    var newTabContent = $(newTab.newContent);
    newTabContent.append(tabContent);
    var tabId = tabCount;
    tabCount++;

    var parentPane = $("#pane"+paneId);
    parentPane.append(newTabContent);
    tabList.append($(newTab.tab));

    $("#closeTab"+tabId).click(function() {
      var idStr = $(this).attr('id');
      var id = parseInt(idStr.charAt(idStr.length-1));
      ASCOT.dashboard.removeGadget(gadgetObjects[id].id);
    });

    initInterface();
    return tabId;
  }

  return {
    // Providing a column id or a pane id of -1 tells the layout manager
    // to automatically choose an (unused) id
    addGadget: function(gadgetFrame, gadgetObject, layoutObj) {
      var columnId = layoutObj.parentColumnId;
      var paneId = layoutObj.parentPaneId;   

      if (columnId === -1)
	columnId = 1;
      if (paneId === -1) {
        paneIndex = 0
        while($("#pane"+paneIndex).length !== 0)
          paneIndex++;
        paneId = paneIndex;
      }
   
      if ($("#pane"+paneId).length === 0) {
	addPane(columnId, paneId);
      }
      var id = addTab(paneId, gadgetFrame, gadgetObject.id);
      gadgetObjects[id] = gadgetObject;
    },
    removeGadget: function(gadgetId) {
      var index;
      for (i in gadgetObjects) {
	if (gadgetObjects[i].id === gadgetId) {
	  index = i;
	  break;
	}
      }
      $("#tab"+index).remove();
      $("#tabContent"+index).remove();
      delete gadgetObjects[index];
      cleanEmptyPanes();
    },
    setRootElement: function(el) {
      rootElement = el;
    },
    setClickAddEvent: function(addFunc) {
      clickAddGadget = addFunc;
    },
    setNumColumns: function(newNumColumns) {

      if(typeof rootElement == "undefined")
	UW.log.error("PRECONDITION VIOLATION","Undefined root element");
					
      for(var i=0; i < numColumns; i++){
	delete columns[i];
      }
      columns = [];
	
      numColumns = newNumColumns;
      var columnWidth = (100 / numColumns) + "%";

      for(var i=0; i < numColumns; i++){
	var newColumn = document.createElement('div');
	newColumn.id = "column" + i;
	newColumn.style.width =  columnWidth;
	newColumn.style.cssFloat = "left";
	
	columns.push(newColumn);
	rootElement.appendChild(newColumn);

	setupAddToColButton(i);
      }

      // To make sure that the root element adapts its size to the content
      var closeElement = document.createElement('div');
      closeElement.style.clear = 'both';
      rootElement.appendChild(closeElement); 

      return columns;
    }
  };
};
