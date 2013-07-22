// List of remote image to load from server           
var imageFiles = [
    {
      path: 'none',
      name: '--From Server--'
    }, 
    {
      path: '/images/FITSViewerSamples/m101_dss.fits',
      name: 'm101.fits'
    },
    {
    	path: '/images/FITSViewerSamples/stsci_dss_001.fits',
    	name: 'stsci_dss_001.fits'
    }];

// Options for image stretch
var stretchOptions = ['linear', 'logarithm', 'sqrt', 'power'];

// Selection color options
var DEFAULT_MARKER_COLOR = '#ffffff';
var MARKER_COLOR = {
  red: '#ff0000',
  green: '#00ff00',
  blue: '#0000ff',
  yellow: '#dcdc00',
  unselect: '#ffffff' 
};  

var EDIT_TYPE = {ADD: 1, REMOVE: 2, ZOOM: 3, PAN: 4, SELECT: 5};
var ANNO_TYPE = {RECT: 1, CIRCLE: 2, POLY: 3, DATA: 4};
var COORD_TYPE = {PIXEL: 1, WCS: 2};

var selectedEditType;
var mouseDown;
var dragStart;
var annotatorCanvas;

function TabState() {
    var file;
    var wcs;
    var webfits;
}

// Tab stuff
var activeTabNumber = 0;
var tabStates = new Array();

gadget.saveState = function() {

};
gadget.loadState = function(state) {
	if (!state) {
	    return;
	}
	/*
    if (state.showAnnotations != undefined) {
        showAnnotations = state.showAnnotations;
    }
    $(getElement('showAnnotations')).prop('checked', showAnnotations);
    savedImagePath = state.imagePath;
    if (state.savedDataSetId !== undefined) {
        selectedDataSetId = state.savedDataSetId;
    }
    */
}

gadget.init = function(callback) {
	initTabViewer(0);
	initTabViewer(1);
	
	gadget.update = function() {};
	
	gadget.onNotification('dataSetChanged', dataSetChanged);
	
	callback();
};

var getElement = function(id, tabNumber) {
    if (!tabNumber) {
        tabNumber = activeTabNumber;
    }
    
    var element = $("#tab" + tabNumber + " ." + id);
    
    if(element) {
        return element[0];
    }
    return;
}

var restoreTabState = function(tabNumber) {
    if (tabStates[tabNumber]) {
        var tabState = tabStates[tabNumber];
    } else {
        console.log("Tab state not found for tab " + tabNumber);
    }
    
}

var saveTabState = function(tabNumber) {
    if (tabStates[tabNumber]) {
        var tabState = tabStates[tabNumber];

    } else {
        console.log("Unable to save tab state for tab " + tabNumber);
    }
}

var createNewTab = function() {
    
    
}

// Initalizes a Tab with default options
var initTabViewer = function(tabNumber) {
    if (!tabStates[tabNumber]) {
        tabStates[tabNumber] = new TabState();
    }
    
    $(getElement("loadingImage", tabNumber)).hide();
    $(getElement("showImage", tabNumber)).hide();
    $(getElement("imageControlContainer", tabNumber)).hide();
    
    // Load an image from the server when one is selected from the 'remote files' dropdown box
    var imageList = $(getElement("loadFromServer", tabNumber));
    $.each(imageFiles, function() {
        imageList.append($("<option />").val(this.path).text(this.name));
    });
    
    var stretchSelect = $(getElement("stretchSelect", tabNumber));
    $.each(stretchOptions, function() {
        stretchSelect.append($("<option />").val(this).text(this));
    });
    
    // Construct the dropdown box for the selection colors
    var colorSelect = $(getElement("selectionColorSelect", tabNumber));
    var items = ["red", "green", "blue", "yellow", "unselect"];
    $.each(items, function(index, value) {
        colorSelect.append($("<option />").val(value).text(value));
    });
    
    $(".annoContorls").position({
        my: "center",
        at: "center",
        of: "body"
    });
    
    $(getElement("addControls", tabNumber)).hide();
    $(getElement("selectControls", tabNumber)).hide();
    $(getElement("removeControls", tabNumber)).hide();
  
    // Bring up an existing image if one is saved to the dashboard state
//        if (savedImagePath != undefined)
//            loadFromUrl(savedImagePath);
    
    console.log("Tab init " + tabNumber);
}

// Called when the user clicks 'unload image'
// Sets the gadget back to its initial blank state
var clickUnloadImage = function(tabNumber) {
    if (!tabNumber) {
	    tabNumber = activeTabNumber;
	}
	
	$(getElement("showImage", tabNumber)).html("");
	
    $(getElement("noImage", tabNumber)).show();
    $(getElement("loadImageControls", tabNumber)).show();
    $(getElement("showImage", tabNumber)).hide();
    $(getElement("imageControlContainer", tabNumber)).hide();
    
    gadget.resize();
}

// Send a file object to the FITS parser to be displayed
/*
var loadFromFile = function(file) {
	$(getElement('init')).hide();
	gadget.resize();
	$(getElement('dropLabel')).html('Loading file...');
	$(getElement('loadingBar')).show();
	
	// Need to convert the file to an arraybuffer to be read by astroJsFits
	var reader = new FileReader();
	reader.onload = function(event) {
		  var contents = event.target.result;
		  astroJsFits.init1(contents);
		  fitsHeader = astroJsFits.getHeader();
		  renderSuccess();
	};
	reader.readAsArrayBuffer(file);
}
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
*/

// Loads Fits file from a URL
var loadFromUrl = function(path, tabNumber) {
    if (!path || path == "None") {
		return;
	}
    if (!tabNumber) {
	    tabNumber = activeTabNumber;
	}
	
    $(getElement("noImage", tabNumber)).hide();
    $(getElement("loadImageControls", tabNumber)).hide();
    $(getElement("loadingImage", tabNumber)).show();
	gadget.resize();
    
    var options = {
        tabNumber: tabNumber
    };
    
    var file = new astro.FITS.File(path, getImage, options);
}

// Define callback to be executed after image is received from the server
var getImage = function (file, options) {
    // Get first data unit
    var dataunit = file.getDataUnit();
    options.dataunit = dataunit;
    
    // Asynchronously get pixels representing the image
    dataunit.getFrameAsync(0, createVisualization, options);
    
    // WCS
    //TODO: get header info from file object
    var header = {
        'WCSAXES': 2,
		'NAXIS1': 3600,
		'NAXIS2': 3600,
		'CRPIX1': 1801,
		'CRPIX2': 1801,
		'CD1_1': -2.4763600114e-05,
		'CD1_2': -1.0252035064e-08,
		'CD2_1': 2.0179923602e-08,
		'CD2_2': 2.476824249e-05,
		'CRVAL1': 15.7305338,
		'CRVAL2': -49.2609679,
		'CTYPE1': 'RA---TAN',
		'CTYPE2': 'DEC--TAN',
		'CUNIT1': 'deg',
		'CUNIT2': 'deg'
    };
    
    var wcs = new WCS.Mapper(header);
    
    var tabState = tabStates[options.tabNumber];
    tabState.file = file;
    tabState.wcs = wcs;
}

// Define callback for when pixels have been read from file
var createVisualization = function (array, options) {
    var dataunit = options.dataunit;
    var tabNumber = options.tabNumber;
    
    var width = dataunit.width;
    var height = dataunit.height;
    var extent = dataunit.getExtent(array);
    
    // Get the DOM element
    var el = getElement("showImage", tabNumber);
    
    // Initialize the WebFITS context
    var webfits = new astro.WebFITS(el, width);
    
    // Add mouse controls
    var opts = {arr: array, width: width};
    var callbacks = {
      onmousedown: onmousedown,
      onmouseup: onmouseup,
      onmousemove: onmousemove,
      onmouseout: onmouseout,
      onmouseover: onmouseover
    };
    webfits.setupControls(callbacks, opts);
    
    // Load image from fitsjs
    webfits.loadImage('some-identifier', array, width, height);
    webfits.setExtent(extent[0], extent[1]);
    webfits.setStretch('linear');
    
    $(getElement("loadingImage", tabNumber)).hide();
    $(getElement("showImage", tabNumber)).show();
    $(getElement("imageControlContainer", tabNumber)).show();
    
    // scaling slider
    $(getElement("scalingSlider")).slider({
        range: true,
        min: extent[0],
        max: extent[1],
        values: [extent[0], extent[1]],
        slide: function(event, ui) {
            var lo = parseInt($(getElement("scalingSlider")).slider("values", 0));
            var hi = parseInt($(getElement("scalingSlider")).slider("values", 1));
            webfits.setExtent(lo, hi);
        }
    });
    
    // stretch
    $(getElement("stretchSelect")).on("change", function() {
            webfits.setStretch(this.options[this.selectedIndex].value);
    });
    
    $(getElement("canvas")).height(height);
    $(getElement("canvas")).width(width);
    getElement("showImage").style.backgroundColor = "transparent";
    
    //////////////////////////////////////////////////////////////////////////////7

    
    var zoom = d3.behavior.zoom()
	.on("zoom", function() {
	        /*
	    console.log(d3.event.scale, d3.event.translate);
        d3.selectAll("circle") // svg elements have the transform="" attribute
            .attr("transform", function(d,i) {
                        return "scale("+d3.event.scale+")"
                + "translate("+d3.event.translate+")" //2elm array.
            })
        d3.selectAll("canvas") // html elements can use css3. must specify "px" or other
            .style("transform", function(d,i) { // firefox
                        return "scale("+d3.event.scale+","+d3.event.scale+")"
                + "translate("+d3.event.translate[0]+"px,"+d3.event.translate[1]+"px)"
            })
            .style("-webkit-transform", function(d,i) { //  chrome
                        return "scale("+d3.event.scale+","+d3.event.scale+")"
                + "translate("+d3.event.translate[0]+"px,"+d3.event.translate[1]+"px)"
            })
            */
          var factor;
          factor = e.shiftKey ? 1.01 : 1.1;
          this.zoom *= (e.wheelDelta || e.deltaY) < 0 ? 1 / factor : factor;
          this.zoom = this.zoom > this.maxZoom ? this.maxZoom : this.zoom;
          this.zoom = this.zoom < this.minZoom ? this.minZoom : this.zoom;
          return typeof this.zoomCallback === "function" ? this.zoomCallback() : void 0;
	});

    
    // Without this, the image starts as tranaslated down by its height.
    var canvas =d3.select("canvas").style("-webkit-transform","translate(0px,0px)");
    
    // binding two initial data to the svg
    var svg =d3.select("#wicked-science-visualization").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g") //creating svg group to bring them all
        .call(zoom);     // calling the zoom function previously defined

    svg.append("rect") // without the rectangle, I cannot drag/zoom the group
    	.attr("width",width)
    	.attr("height",height)
    	.attr("fill","orange")
    	.attr("fill-opacity",0); // almost invisible

    svg.append("circle") // some circle
        .attr("cx",100)
        .attr("cy",10)
        .attr("r",6)
        .attr("fill","red");

    svg.append("circle")
        .attr("cx",width/2)
        .attr("cy",height/2)
        .attr("r",6)
        .attr("fill","red");

    svg.append("circle")
        .attr("cx",30)
        .attr("cy",40)
        .attr("r",6)
        .attr("fill","green");

	//////////////////////////////////////////////////////////////////////////////7
	
	/*
	var annotatorCanvas = document.createElement('canvas');
	annotatorCanvas.setAttribute('width', width);
	annotatorCanvas.setAttribute('height', height);
	
    var ann_context = annotatorCanvas.getContext("2d");
    ann_context.fillStyle = "#FF0000";
    ann_context.fillRect(50, 25, 150, 100);
    
    $(getElement("showImage")).append(annotatorCanvas);
	*/
	gadget.resize();
}

var onmousedown = function(array, event) {
    console.log('onmousedown');
    
    mouseDown = true;
    
    if (selectedEditType == EDIT_TYPE.ADD || selectedEditType == EDIT_TYPE.SELECT) {
		dragStart = {x: e.offsetX, y: e.offsetY};
	}
	
	if(selectedEditType != EDIT_TYPE.PAN) {
	    return true;
	}
}

var onmouseup = function(array) {
    console.log('onmouseup');
    
    mouseDown = false;
    
    if(selectedEditType != EDIT_TYPE.PAN) {
	    return true;
	}
}

var onmousemove = function(x, y, options) {
    console.log('onmousemove');
    var array = options.arr;
    var width = options.width;

    // Update pixel readout
    var wcs = tabStates[activeTabNumber].wcs;
    if(wcs) {
        var wcsPoint = wcs.pixelToCoordinate([x, y]);
        getElement("alpha").innerHTML = wcsPoint.ra.toFixed(5);
        getElement("delta").innerHTML = wcsPoint.dec.toFixed(5);
    }
    getElement("xPix").innerHTML = x;
    getElement("yPix").innerHTML = y;
    var pixValue = array[y*width + x];
    if(pixValue) {
        getElement("pixValue").innerHTML = pixValue.toFixed(8);
    }
    
    if (mouseDown) {
		if (selectedEditType == EDIT_TYPE.ADD || selectedEditType == EDIT_TYPE.SELECT) {
			editContext.clearRect(0,0,$('#dropbox').width(),$('#dropbox').height());
			editContext.fillStyle = "#ffffff";
			editContext.globalAlpha = 0.3;
			if (selectedAnnoType == ANNO_TYPE.RECT || selectedEditType == EDIT_TYPE.SELECT) {
				editContext.fillRect(dragStart.x, dragStart.y, e.offsetX-dragStart.x, e.offsetY-dragStart.y);
			} else if (selectedAnnoType == ANNO_TYPE.CIRCLE && selectedEditType != EDIT_TYPE.SELECT) {
				editContext.beginPath();
				editContext.arc(dragStart.x	, dragStart.y, Math.abs(e.offsetX-dragStart.x), 0, 2 * Math.PI, false);
				editContext.fill();
			}
		}
	}
	
	if(selectedEditType != EDIT_TYPE.PAN) {
	    return true;
	}
}

var onmouseout = function(array) {
    console.log('onmouseout');
}

var onmouseover = function(array) {
    console.log('onmouseover');
}

var changeAnnotation = function(editType) {
	$(getElement("addControls")).hide();
	$(getElement("removeControls")).hide();
	$(getElement("selectControls")).hide();
	
	selectedEditType = editType;
	
    switch (editType) {
		case EDIT_TYPE.ADD:
			$(getElement("addControls")).show();
			break;
		case EDIT_TYPE.REMOVE:
			$(getElement("removeControls")).show();
			break;
		case EDIT_TYPE.ADD:
			$(getElement("selectControls")).show();
			break;
	}
	
	gadget.resize();
}




// Draw the fits image, annotations, and edit marks
var draw = function() {
    var $dropbox = $(getElement('dropbox'));
    
	annotator.draw();
	displayContext.clearRect(0, 0, displayWidth, $dropbox.height());
	displayContext.drawImage(fitsCanvas, 0, 0, displayWidth, $dropbox.height(), 0, 0, displayWidth, $dropbox.height());
	displayContext.drawImage(annotatorCanvas, 0, 0, displayWidth, $dropbox.height(), 0, 0, displayWidth, $dropbox.height());
	displayContext.drawImage(editCanvas, 0, 0, displayWidth, $dropbox.height(), 0, 0, displayWidth, $dropbox.height());
}

// Used to prevent something from happening when an event fires
var noopHandler = function(evt) {
	evt.stopPropagation();
	evt.preventDefault();
}

// Select all annotations between two pixel coordinates on the image and mark those
// annotations in the global dataset
var selectAnnotations = function(start, end) {
	var startNative = astroJsFits.cursorToPix(start.x, start.y);
	var endNative = astroJsFits.cursorToPix(end.x, end.y);

	var selectEl = getElement("selectionColorSelect");
	var colorName = selectEl.options[selectEl.selectedIndex].value;
	var idsToColor = annotator.selectAnnotations(startNative, endNative, MARKER_COLOR[colorName]);
	
	if (selectedDataSet == undefined)
		return;
	setTimeout(function() { selectedDataSet.setRecords({'color': colorName}, idsToColor); }, .1);
}

// If a dataset is selected, sync the color of the annotations up with the 
// color of the points in the dataset
var updateSelectedPoints = function() {
	if (selectedDataSet == undefined) {
		selectedDataSetId = -1;
		annotator.removeAllAnnotations();
		return;
	}
 	for (var i = 0; i < selectedDataSet.length(); i++) {
 		var color = MARKER_COLOR[selectedDataSet.getRecord(i).color];
 		var id = selectedDataSet.getRecord(i).id;
 		if (color != undefined)
 			annotator.colorAnnotation(id, color);
 	}
}

// Repopulate the data selection dropdown and update all of the displayed points
// when the global dataset changes
var dataSetChanged = function() {
	
	populateDataSetSelect();
	
	if (!imageLoaded)
		return;
	
	updateSelectedPoints();
	draw();
}

var stretchSelectChange = function() {
	var el = getElement("stretchSelect");
	var newStretch = el.options[el.selectedIndex].value;
	astroJsFits.changeStretch(newStretch);
}

var dataSetSelectChange = function() {
	var el = getElement("datasetNameSelect");
	selectedDataSetId = parseInt(el.options[el.selectedIndex].value);
}

// Gets all of the dataset names and puts them in the import dataset dropdown
var populateDataSetSelect = function() {
	var el = getElement("datasetNameSelect");
	var items = gadget.dashboard.getDataSetList();
	el.options.length = 0;
	for (i in items) {
		var option = document.createElement("OPTION");
		option.text = items[i].text;
		option.value = items[i].id;
		el.options.add(option);
	}
	selectedDataSet = gadget.dashboard.getDataSet(selectedDataSetId);
}

// Event handlers for the canvases
var handleMousedown = function(e) {
	if (!imageLoaded)
		return;
		
	// Send event to fits image canvas
	if (selectedEditType == EDIT_TYPE.PAN) {
		var evObj = document.createEvent('MouseEvents');
		evObj.initMouseEvent( 'mousedown', false, true, window, 1, e.screenX, e.screenY, e.clientX, e.clientY, false, false, true, false, 0, null );
		fitsCanvas.dispatchEvent(evObj);
	}

	leftMouseDown = true;
	if (selectedEditType == EDIT_TYPE.ADD || selectedEditType == EDIT_TYPE.SELECT) {
		dragStart = {x: e.offsetX, y: e.offsetY};
	}
	annotator.handleMousedown(e.originalEvent);
	draw();
}

var finishDrag = function(e) {
	if (selectedEditType == EDIT_TYPE.ADD) {
		editContext.clearRect(0,0,$(getElement('dropbox')).width(),$(getElement('dropbox')).height());
		var start = astroJsFits.cursorToPix(dragStart.x, dragStart.y);
		var end = astroJsFits.cursorToPix(e.offsetX, e.offsetY);
		if (selectedAnnoType == ANNO_TYPE.RECT) {
			annotator.addRectRegion({'xPos':start.x, 'yPos': start.y, 
													 		 'width': end.x-start.x, 'height': end.y-start.y, 
															 'label': "rect"});
 			getElement("annoSelect").add(new Option("rect", "0"), null);
		}
		else if (selectedAnnoType == ANNO_TYPE.CIRCLE) {
			annotator.addCircleRegion({'xPos': start.x, 'yPos': start.y, 'radius': Math.abs(end.x-start.x), label: ["another"]});
			getElement("annoSelect").add(new Option("circle", "0"), null);
		}
	}
	if (selectedEditType == EDIT_TYPE.SELECT) {
		editContext.clearRect(0,0,$(getElement('dropbox')).width(),$(getElement('dropbox')).height());
		var start = {x: dragStart.x, y: dragStart.y};
		var end = {x: e.offsetX, y: e.offsetY};
		selectAnnotations(start, end);
	}
	annotator.handleMouseup(e.originalEvent);
	draw();
}

var handleMouseup = function(e) {
	if (!imageLoaded)
		return;
	
	// Send event to fits image canvas
	var evObj = document.createEvent('MouseEvents');
	evObj.initMouseEvent( 'mouseup', false, true, window, 1, e.screenX, e.screenY, e.clientX, e.clientY, false, false, true, false, 0, null );
	// Only notify the fits canvas of the mouse event if we are in pan mode
	if (selectedEditType == EDIT_TYPE.PAN) 
	    fitsCanvas.dispatchEvent(evObj);

	leftMouseDown = false;
	finishDrag(e);
}

var handleMousewheel = function(e) {
	if (!imageLoaded)
		return;
	e.preventDefault();
	// Send event to fits image canvas
	var evObj = document.createEvent('MouseEvents');
	evObj.initMouseEvent( 'mousewheel', false, true, window, 1, e.originalEvent.screenX-22, e.originalEvent.screenY-22, e.originalEvent.clientX-22, e.originalEvent.clientY-22, false, false, true, false, 0, null );
	evObj.wheelDelta = e.originalEvent.wheelDelta;
	fitsCanvas.dispatchEvent(evObj);
	//annotator.handleMousewheel(e.originalEvent);
	draw();
}

var handleMouseout = function(e) {
	leftMouseDown = false;
	if (!imageLoaded)
		return;
	// Send event to fits image canvas
	var evObj = document.createEvent('MouseEvents');
	evObj.initMouseEvent( 'mouseout', false, true, window, 1, e.screenX, e.screenY, e.clientX, e.clientY, false, false, true, false, 0, null );
	fitsCanvas.dispatchEvent(evObj);
	if (leftMouseDown) finishDrag(e);
}

var handleMousemove = function(e) {
	if (!imageLoaded)
		return;
		
	// Update pixel readout
	var nativeMouse = astroJsFits.cursorToPix(e.offsetX, e.offsetY);
	nativeMouse.y = fitsHeader.get("NAXIS2")[1] - nativeMouse.y;
	getElement("xPix").innerHTML = parseInt(nativeMouse.x);
	getElement("yPix").innerHTML = parseInt(nativeMouse.y);
	var wcsMouse = wcs.pixelToCoordinate([nativeMouse.x, nativeMouse.y]);
	getElement("alpha").innerHTML = wcsMouse.ra.toFixed(5);
	getElement("delta").innerHTML = wcsMouse.dec.toFixed(5);
	getElement("pixValue").innerHTML = parseInt(astroJsFits.getPixelValue(nativeMouse.x, nativeMouse.y));
	
	// Send event to fits image canvas
	var evObj = document.createEvent('MouseEvents');
	evObj.initMouseEvent( 'mousemove', false, true, window, 1, e.screenX, e.screenY, e.clientX, e.clientY, false, false, true, false, 0, null );
	fitsCanvas.dispatchEvent(evObj);

	if (leftMouseDown) {
		if (selectedEditType == EDIT_TYPE.ADD || selectedEditType == EDIT_TYPE.SELECT) {
			editContext.clearRect(0,0,$(getElement('dropbox')).width(),$(getElement('dropbox')).height());
			editContext.fillStyle = "#ffffff";
			editContext.globalAlpha = 0.3;
			if (selectedAnnoType == ANNO_TYPE.RECT || selectedEditType == EDIT_TYPE.SELECT)
				editContext.fillRect(dragStart.x, dragStart.y, e.offsetX-dragStart.x, e.offsetY-dragStart.y);
			else if (selectedAnnoType == ANNO_TYPE.CIRCLE && selectedEditType != EDIT_TYPE.SELECT) {
				editContext.beginPath();
				editContext.arc(dragStart.x	, dragStart.y, Math.abs(e.offsetX-dragStart.x), 0, 2 * Math.PI, false);
				editContext.fill();
			}
		}
		else if (selectedEditType == EDIT_TYPE.PAN)
			annotator.handleMousemovePan(e);
	}
	else
		annotator.handleMousemove(e);
	draw();
}

var clickRadioAdd = function() {
	getElement("removeControls").style.display = "none";
	getElement("addControls").style.display = "block";
	getElement("polyControls").style.display = "none";
	getElement("selectControls").style.display = "none";
	gadget.resize();
	selectedEditType = EDIT_TYPE.ADD;
	
	switch (selectedAnnoType) {
		case ANNO_TYPE.CIRCLE:
			getElement("circleControls").style.display = "block";
			break;
		case ANNO_TYPE.RECT:
			getElement("rectControls").style.display = "block";
			break;
		case ANNO_TYPE.POLY:
			getElement("polyControls").style.display = "block";
			break;
	}
}

var clickRadioCircle = function() {
	getElement("rectControls").style.display = "none";
	getElement("circleControls").style.display = "block";
	getElement("polyControls").style.display = "none";
	getElement("datasetControls").style.display = "none";
	gadget.resize();
	selectedAnnoType = ANNO_TYPE.CIRCLE;
}

var clickRadioRect = function() {
	getElement("rectControls").style.display = "block";
	getElement("circleControls").style.display = "none";
	getElement("polyControls").style.display = "none";
	getElement("datasetControls").style.display = "none";
	gadget.resize();
	selectedAnnoType = ANNO_TYPE.RECT;
}

var clickRadioPoly = function() {
	getElement("rectControls").style.display = "none";
	getElement("circleControls").style.display = "none";
	getElement("polyControls").style.display = "block";
	getElement("datasetControls").style.display = "none";
	gadget.resize();
	selectedAnnoType = ANNO_TYPE.POLY;
}

var clickRadioDataset = function() {
	getElement("rectControls").style.display = "none";
	getElement("circleControls").style.display = "none";
	getElement("polyControls").style.display = "none";
	getElement("datasetControls").style.display = "block";
	selectedAnnoType = ANNO_TYPE.DATA;
}

var clickRadioPix = function() {
	selectedCoordType = COORD_TYPE.PIX;
}

var clickRadioWCS = function() {
	selectedCoordType = COORD_TYPE.WCS;
}

var clickRemovalSelection = function() {
	var selectedIndex = getElement("annoSelect").selectedIndex+1;
	prevSelectedIndex = selectedIndex;
}

var clickShowAnnotations = function() {
	if (showAnnotations) {
		annotator.hideAnnotations();
		showAnnotations = false;
		gadget.setState({ showAnnotations : false});
		draw();
	}
	else {
		annotator.showAnnotations();
		showAnnotations = true;
		gadget.setState({ showAnnotations : true});
		draw();
	}
}

var addPolyPoint = function() {
	var coordA = getElement("polyPosA").value;
	var coordB = getElement("polyPosB").value;
	var str = "(" + coordA + ", " + coordB + ")";
	getElement("polyPointsSelect").add(new Option(str, "0"), null);
	polyCreateList.push([coordA, coordB]);
}

var removeSelectedPolyPoint = function() {
	var list = getElement("polyPointsSelect");
	var selectedId = list.selectedIndex;
	if (selectedId != -1) {
		list.remove(selectedId);
	}
	polyCreateList.splice(selectedId,1);
}

var removeAnnotations = function() {
	var numAnnos = getElement("annoSelect").length;
	var list = getElement("annoSelect");
	for (var i = 0; i < numAnnos; i++) {
		annotator.removeAnnotation(0);
		list.remove(0);
		draw();
	}
}

var removeSelectedAnnotation = function () {
	var list = getElement("annoSelect");
	var selectedId = list.selectedIndex;
	if (selectedId != -1) {
		annotator.removeAnnotation(selectedId);
		list.remove(selectedId);
		draw();
	}
}

var createCircleAnno = function() {
	var coordA = getElement('circlePosA').value;
	var coordB = getElement('circlePosB').value;
	var radius = getElement('circleRadius').value;
	var label = [getElement('circleLabel').value];
	
	var circlePos;
	if (selectedCoordType == COORD_TYPE.WCS)
		circlePos = wcs.coordinateToPixel(coordA,coordB);
	else
		circlePos = {"x": parseFloat(coordA), "y": parseFloat(coordB)};
	annotator.addCircleRegion({'xPos': circlePos.x, 'yPos': imageDimensions.height-circlePos.y, 'radius': parseFloat(radius), label: label});
	getElement("annoSelect").add(new Option(label, "0"), null);
	draw();
}

var createRectAnno = function() {
	var corner1A = getElement('rectPosA').value;
	var corner1B = getElement('rectPosB').value;
	var width = getElement('rectWidth').value;
	var height = getElement('rectHeight').value;
	var label = [getElement('rectLabel').value];

	var corner1;
	var corner2;
	if (selectedCoordType == COORD_TYPE.WCS) {
		corner1 = wcs.coordinateToPixel(corner1A,corner1B);
		corner2 = wcs.coordinateToPixel(parseFloat(corner1A)-parseFloat(width),parseFloat(corner1B)-parseFloat(height));
	}
	else {
		corner1 = {"x": parseFloat(corner1A), "y": parseFloat(corner1B)};
		corner2 = {"x": parseFloat(corner1A)+parseFloat(width), "y": parseFloat(corner1B)+parseFloat(height)};
	}
	annotator.addRectRegion({'xPos': corner1.x, 'yPos': imageDimensions.height-corner1.y, 
  												 'width': -(corner2.x-corner1.x), 'height': -(corner2.y-corner1.y), 
  												 'label': label});
 	getElement("annoSelect").add(new Option(label, "0"), null);
 	draw();
}

var createPolyAnno = function() {
	var list = getElement("polyPointsSelect");
	var polyPoints = [];
	for (i in polyCreateList) {
		var point = {"x": polyCreateList[i][0], "y": polyCreateList[i][1]};
		list.remove(0);
		
		if (selectedCoordType == COORD_TYPE.WCS)
			point = wcs.coordinateToPixel(polyCreateList[i][0], polyCreateList[i][1])
		polyPoints.push([point.x, imageDimensions.height-point.y]);
	}
	
	polyCreateList = [];
	var label = [getElement("polyLabel").value];
	
	annotator.addPolyRegion({'vertices': polyPoints, 'label': label, 'labelXPos': 0, 'labelYPos': 0});
	getElement("annoSelect").add(new Option("polygon", "0"), null);
	draw();
}

var addDataSetPoints = function() {
	if (gadget.dashboard.getDataSetList()[0] == undefined)
		return;
	if (selectedDataSetId == -1 || selectedDataSetId == undefined)
		selectedDataSetId = gadget.dashboard.getDataSetList()[0].id;
	selectedDataSet = gadget.dashboard.getDataSet(selectedDataSetId);
	removeAnnotations();
	var coordA;
	var coordB;
	for (var i = 0; i < selectedDataSet.length(); i++) {
    coordA = selectedDataSet.getRecord(i)["ra"]; 
    coordA = /\./.test(coordA)? parseFloat(coordA) : coordA;
    coordB = selectedDataSet.getRecord(i)["dec"];
    coordB = /\./.test(coordB)? parseFloat(coordB) : coordB;
    
    var label = [("ra: " + coordA),("dec: " + coordB)]
    
    if (coordA !== NaN && coordB !== NaN) {
    	var circlePos = wcs.coordinateToPixel(coordA, coordB);
      annotator.addCircleRegion({'id': selectedDataSet.getRecord(i)["id"],
                    						 'xPos': circlePos.x, 
												         'yPos': fitsHeader.get("NAXIS2")[1]-circlePos.y,
												         'color': MARKER_COLOR[selectedDataSet.getRecord(i).color],
												         'radius': 5,
												         'label': label});
     getElement("annoSelect").add(new Option("circle", "0"), null);
    }
  }
  gadget.setState({savedDataSetId: selectedDataSetId});
  draw();
}

$(document).ready(function() {
    $( "#tabs" ).tabs(
        {
            beforeActivate: function(event, ui) {
                gadget.resize();

                saveTabState(activeTabNumber);
                activeTabNumber = ui.newTab.index();
                restoreTabState(activeTabNumber);
              
                console.log("Tab Switch to tab " + activeTabNumber);
            }
        }
    );
    
    $(document).on("click", ".loadFromUrl",  
        function(event) {
            //loadFromUrl($(getElement("imageUrl")).val());
            
            var path = "http://vega.cs.washington.edu:5551/get/m101_r.fits";
            loadFromUrl(path);
        }
    );
    
    $(document).on("change", ".loadFromServer",  
        function(event) {
            loadFromUrl($(this).val());
        }
    );
    
    $(document).on("change", ".loadFromFile",  
        function(event) {
            loadFromFile(this.files[0]);
        }
    );
    
    $(document).on("click", ".unloadImage",  
        function(event) {
            clickUnloadImage();
        }
    );
    
    $(document).on("change", ".stretchSelect",  
        function(event) {
            stretchSelectChange();
        }
    );
    
    
    
    gadget.resize();
});

