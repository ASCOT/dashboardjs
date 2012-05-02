// Draws a set of annotations onto a canvas
// Author: Spencer Wallace
// Email: spencerw@email.arizona.edu

define('canvasAnnotator', ['/wcs.js'], function() {

	var onScreenCanvas = null;
	var onScreenContext = null;
	var wcs = null;
	var fitsImageWidth = 0;
	var fitsImageHeight = 0;
	var annotations = []
	var idIndex = 0;
	var textHeight = 20;
	var defaultColor = "#ffffff";
	
	var viewportPosition = { x : 0, y : 0 };
	var zoomFactor = 1;
	var viewportWidth;
  var viewportHeight;
  var onScreenCanvasWidth = 640;
  var onScreenCanvasHeight = 480;
  var mouseDown = false;
  var dragStart = {x: '', y: ''};
	
	// Add a rectangle annotation to the list
	// Arguments:
	//					xPos - The x position of the upper left corner of the rectangle
	//					yPos - The y position of the upper left corner of the rectangle
	//					width - The width of the rectangle
	//					height - The height of the rectangle
	//					label - A string of text to be displayed next to the rectangle
	// Returns the unique id of the created annotation
	var addRectRegion = function(arg) {
		var visible = true;
		var textVisible = false;
		idIndex++;
		
		annotations.push({ 'type': 'rect',
											 'id': idIndex,
											 'visible': visible,
											 'textVisible': textVisible,
											 'xPos': arg.xPos,
											 'yPos': arg.yPos,
											 'width': arg.width,
											 'height': arg.height,
											 'label': arg.label,
											 'labelXPos': arg.xPos,
											 'labelYPos': arg.yPos+arg.height,
											 'color': defaultColor });
		 	
		draw(); 								 
		return idIndex;
	}
	
	// Add a circle annotation to the list
	// Arguments:
	//					xPos - The x position of the center of the circle
	//					yPos - The y position of the center of the circle
	//					radius - The radius of the circle
	//					label - A string of text to be displayed next to the rectangle
	// Returns the unique id of the created annotation
	var addCircleRegion = function(arg) {
		var visible = true;
		var textVisible = false;
		idIndex++;
		
		annotations.push({ 'type': 'circle',
											 'id': idIndex,
											 'visible': visible,
											 'textVisible': textVisible,
											 'xPos': arg.xPos,
											 'yPos': arg.yPos,
											 'radius': arg.radius,
											 'label': arg.label,
											 'labelXPos': arg.xPos,
											 'labelYPos': arg.yPos+arg.radius,
											 'color': defaultColor,
											 'prevColor': defaultColor });									 
		draw();
		return idIndex;
	}
	
	// Add a polygonal annotation to the list
	// Arguments:
	//					vertices - An array containing the coordinates of the vertices of the shape
	//					label - A string of text to be displayed somewhere near the polygon
	//					labelXPos - The x position of the top left corner of the label
	//					labelYPos - The y position of the top left corner of the label
	var addPolyRegion = function(arg) {
		var visible = true;
		var textVisible = false;
		idIndex++;
		
		annotations.push({ 'type': 'poly',
											 'id': idIndex,
											 'visible': visible,
											 'textVisible': textVisible,
											 'vertices' : arg.vertices,
											 'label': arg.label,
											 'labelXPos': arg.labelXPos,
											 'labelYPos': arg.labelYPos,
											 'color': defaultColor });
		
		draw();
		return idIndex;
	}
	
	// Remove an annotation from the list, if it exists
	// Arguments:
	//				id - The unique id of the annotation to remove
	var removeAnnotation = function(id) {
		annotations.splice(id, 1);
		draw();
	}
	
	// Set an annotation region to a certain color
	// Arguments:
	//				id - The unique id of the annotation to color
	//				color - A string giving the hexadecimal value of the color (ex. "#10ff00")
	var colorAnnotation = function(id, color) {
		for (i in annotations) {
			if (annotations[i].id == id) {
				annotations[i].previousColor = annotations[i].color;
				annotations[i].color = color;
			}
		}
		draw();
	}
	
	// Revert an annotation back to its previous color
	// Arguments:
	//				id - The unique id of the annotation
	var revertColor = function(id) {
		for (i in annotations) {
				if (annotations[i].id == id) {
					var t = annotations[i].color;
					annotations[i].color = annotations[i].previousColor;
					annotations[i].previousColor = t;
				}
		}
		draw();
	}
	
	// Draw a specific annotation onto the canvas
	// Arguments:
	//				anno - The annotation object to be drawn
	//	   context - The context to draw onto
	var drawAnno = function(anno, context) {
		if (!anno.visible)
			return;
	
		// Draw the annotation boundary
		switch (anno.type) {
			case 'rect':
				context.lineWidth = 1
				context.lineJoin = 1
				context.strokeStyle = anno.color;
				context.fillStyle = anno.color;
				context.globalAlpha = 0.3;
				context.fillRect(anno.xPos, anno.yPos, anno.width, anno.height);
				context.globalAlpha = 1.0;
				context.strokeRect(anno.xPos, anno.yPos, anno.width, anno.height);
				break;
				
			case 'circle':
				context.lineWidth = 1
				context.strokeStyle = anno.color;
				context.fillStyle = anno.color;
				context.beginPath();
				context.arc(anno.xPos, anno.yPos, anno.radius, 0, 2*Math.PI, false);
				context.globalAlpha = 0.3;
				context.fill();
				context.globalAlpha = 1.0;
				context.stroke();
				break;
				
			case 'poly':
				context.lineWidth = 1
				context.strokeStyle = anno.color;
				context.fillStyle = anno.color;
				context.beginPath();
				context.moveTo(anno.vertices[0][0],anno.vertices[0][1]);
				for (var i = 1; i < anno.vertices.length; i++) {
					context.lineTo(anno.vertices[i][0],anno.vertices[i][1]);
				}
				context.lineTo(anno.vertices[0][0],anno.vertices[0][1]);
				context.globalAlpha = 0.3;
				context.fill();
				context.globalAlpha = 1.0;
				context.stroke();
				break;
		}
		
		// Draw the annotation label
		if (anno.textVisible) {
			context.font = textHeight + "px sans-serif";
			context.fillStyle = "white";
			context.fillRect(anno.labelXPos, anno.labelYPos, context.measureText(anno.label).width, textHeight+2);
			context.fillStyle = "black";
			context.fillText(anno.label, anno.labelXPos, anno.labelYPos+textHeight);
		}
	}
	
	// Draw all visible annotations in the list onto the canvas
	var draw = function() {
		offScreenCanvas = document.createElement('canvas');
		offScreenContext = offScreenCanvas.getContext("2d");
		
		offScreenCanvas.setAttribute('width', fitsImageWidth);
    offScreenCanvas.setAttribute('height', fitsImageHeight);
	
		scaleViewport(zoomFactor);
		for (i in annotations)
			drawAnno(annotations[i], offScreenContext);
		onScreenContext.clearRect(0, 0, onScreenCanvasWidth, onScreenCanvasHeight);
		onScreenContext.drawImage(offScreenCanvas, viewportPosition.x, viewportPosition.y, viewportWidth, viewportHeight, 0, 0, onScreenCanvasWidth, onScreenCanvasHeight);
	}
	
	// Sets up mouse listener actions related to the annotations and grabs reference to the canvas
	// Arguments:
	//				canvas - A reference to the canvas that is listening for mouse events
	//				header - A JSON object containing header information for a FITS image
	var init = function(_canvas,header) {
		wcs = new WCS.Mapper(header);
		fitsImageWidth = header.NAXIS1;
		fitsImageHeight = header.NAXIS2;
		onScreenCanvas = _canvas;
		onScreenContext = onScreenCanvas.getContext("2d");
		//canvas.addEventListener('mouseover', handleMouseover, false);
		//canvas.addEventListener('mouseout', handleMouseout, false);
		//canvas.addEventListener('mousemove', handleMousemove, false);
		//canvas.addEventListener('mousedown', handleMousedown, false);
	}
	
	var cursorToPixel = function(cursorX, cursorY){
    var viewportPixelX = cursorX / zoomFactor;
    var viewportPixelY = cursorY / zoomFactor;
    var xCoordinate = Math.floor(viewportPosition.x + viewportPixelX);
    var yCoordinate = Math.floor(viewportPosition.y + viewportPixelY);
    var raDec;
    var cursorInfo = {
      "x" : xCoordinate,
      "y" : yCoordinate,
      "value" : 0//pixelValues[xCoordinate + yCoordinate*offScreenCanvasHeight]
    };
    /*if (FITS.wcsMapper) {
      raDec = FITS.wcsMapper.pixelToCoordinate(xCoordinate, yCoordinate);
      cursorInfo.ra = raDec.ra;
      cursorInfo.dec = raDec.dec;
    }*/
    return cursorInfo;
  };
	
	var scaleViewport = function(zoomFactor){
    viewportWidth = onScreenCanvasWidth / zoomFactor;
    viewportHeight = onScreenCanvasHeight / zoomFactor;
  };	
	
	var zoom = function(mouseX, mouseY, zoomIn){
		var newZoomFactor;
		if (zoomIn == true) 
			newZoomFactor = zoomFactor*2;
		else
			newZoomFactor = zoomFactor/2;
    if (newZoomFactor >= 1 && newZoomFactor < zoomFactor || // Zoom out
        newZoomFactor > zoomFactor && viewportHeight >= 2 && viewportWidth >= 2) { // Zoom In
      centerViewport(newZoomFactor, newZoomFactor > zoomFactor, mouseX, mouseY);    
      zoomFactor = newZoomFactor; 
      //highlightPixel(event.offsetX, event.offsetY);
      draw();
    }
  };
  
  var centerViewport = function(scaleFactor, zoomIn, cursorX, cursorY){
    var newPositionX;
    var newPositionY;
    var translationX = cursorX / scaleFactor;
    var translationY = cursorY / scaleFactor;
    var xOffset = zoomIn? translationX : - translationX / 2; 
    var yOffset = zoomIn? translationY : - translationY / 2; 
    newPositionX = viewportPosition.x + xOffset; 
    newPositionY = viewportPosition.y + yOffset; 
    if (newPositionX < 0 || newPositionY < 0) {
      return;
    }
    viewportPosition.x = newPositionX;
    viewportPosition.y = newPositionY;
  };
	
	// Convert a set of celestial coordinates to a pixel coordinate
	// Arguments:
	//					w1, w2: The celestial coordinates, in the native coordinate system of the image
	// Returns:
	//					An x and y coordinate of where the given celestial coordinates lie on the canvas
	var wcs2pix = function(w1, w2) {
		var pix = wcs.coordinateToPixel(w1, w2);
		return {x: pix.x, y: fitsImageHeight-pix.y};
	}
	
	// Convert a set pixel coordinates to celestial coordinates
	// Arguments:
	//					p1, p2: The pixel coordinates
	// Returns:
	//					An c1 and c2 coordinate of where the given pixels lie on the celestial sphere
	var pix2wcs = function(p1, p2) {
		var coord = wcs.pixelToCoordinate(p1, p2);
		return {c1: coord.ra, c2: coord.dec};
	}
	
	var handleMousedown = function(e) {
		mouseDown = true;
		dragStart = {x: e.offsetX, y: e.offsetY};
	}
	
	var handleMouseup = function(e) {
		mouseDown = false;
	}
	
	var handleMousemovePan = function(e) {
		// Pan if the mouse is being dragged
		if (mouseDown) {
			var scrollVector = {x: dragStart.x - e.offsetX, y: dragStart.y - e.offsetY};
			if (viewportPosition.x + scrollVector.x >= 0 && 
          viewportPosition.x + scrollVector.x + viewportWidth <= fitsImageWidth ) {
				viewportPosition.x += scrollVector.x/zoomFactor;
				dragStart.x = e.offsetX;
			}
			if (viewportPosition.y + scrollVector.y >= 0 && 
          viewportPosition.y + scrollVector.y + viewportWidth <= fitsImageHeight ) {
				viewportPosition.y += scrollVector.y/zoomFactor;
				dragStart.y = e.offsetY;
			}
			draw();
		}
	}
	
	var handleMousemove = function(e) {
	
		var mouse = cursorToPixel(e.offsetX, e.offsetY);
	
		// Activate and deactivate the text labels on annotations as the mouse moves inside the region
		for (i in annotations) {
			switch (annotations[i].type) {
				case 'rect':
					if (mouse.x >= annotations[i].xPos && mouse.x <= annotations[i].xPos+annotations[i].width &&
							mouse.y >= annotations[i].yPos && mouse.y <= annotations[i].yPos+annotations[i].height) {
							annotations[i].textVisible = true;
							draw();
					}
					else if (annotations[i].textVisible) {
						annotations[i].textVisible = false;
						draw();
					}
					break;
				case 'circle':
					var dist = Math.sqrt(Math.pow(mouse.x-annotations[i].xPos,2)+Math.pow(mouse.y-annotations[i].yPos,2));
					if (dist <= annotations[i].radius) {
						annotations[i].textVisible = true;
						draw();
					}
					else if (annotations[i].textVisible) {
						annotations[i].textVisible = false;
						draw();
					}
					break;
				case 'poly':
    			var c = false;
    			var k = annotations[i].vertices.length-1;
    			for (var j = 0; j < annotations[i].vertices.length; k = j++) {
    				if ( ((annotations[i].vertices[j][1] > mouse.y) != (annotations[i].vertices[k][1] > mouse.y)) && 
    				(mouse.x < (annotations[i].vertices[k][0]-annotations[i].vertices[j][0]) * (mouse.y-annotations[i].vertices[j][1]) / (annotations[i].vertices[k][1]-annotations[i].vertices[j][1]) + annotations[i].vertices[j][0]) )
       				c = !c;	
    			}
    			if (c) {
    				annotations[i].textVisible = true;
    				draw();
    			}
    			else if (annotations[i].textVisible) {
    				annotations[i].textVisible = false;
    				draw();
    			}
					break;
			}
		}
	}
	
	var hideAnnotations = function() {
		for (i in annotations) {
			annotations[i].visible = false;
		}
		draw();
	}
	
	var showAnnotations = function() {
		for (i in annotations) {
			annotations[i].visible = true;
		}
		draw();
	}
	
	var handleMouseout = function(e) {
		
		// Hide all annotations
		for (i in annotations) {
			annotations[i].visible = false;
		}
		draw();
	}
	
	var handleMouseover = function(e) {
	
		// Show all annotations
		for (i in annotations) {
			annotations[i].visible = true;
		}
		draw();
	}
	
	return {
		'init': init,
		'addRectRegion': addRectRegion,
		'addCircleRegion': addCircleRegion,
		'addPolyRegion': addPolyRegion,
		'removeAnnotation': removeAnnotation,
		'colorAnnotation': colorAnnotation,
		'revertColor': revertColor,
		'draw': draw,
		'wcs2pix': wcs2pix,
		'pix2wcs': pix2wcs,
		'cursorToPixel': cursorToPixel,
		'showAnnotations': showAnnotations,
		'hideAnnotations': hideAnnotations,
		'handleMousemove': handleMousemove,
		'handleMousemovePan': handleMousemovePan,
		'handleMousedown': handleMousedown,
		'handleMouseup': handleMouseup,
		'zoom': zoom
	};
});
