// Draws a set of annotations onto a canvas
// Author: Spencer Wallace
// Email: spencerw@email.arizona.edu

define('canvasAnnotator', [], function() {

	var canvas;
	var context;
	
	var pixToScreen;

  var viewportPosition = { x : 0, y : 0 };
  var zoomFactor = 1;
  
  var mouseDown = false;
  var dragStart = {x: '', y: ''};

	var annotations = []
	var idIndex = 0;
	var textHeight = 20;
	var defaultColor = "#ffffff";
	
	// Initalize the canvas attributes
	// Arguments:
	//					canvas - The canvas to draw onto
	//					pixToScreen - The method that converts native pixel coordinates to screen coordinates
	var init = function(_canvas, _pixToScreen) {
		canvas = _canvas;
		context = canvas.getContext('2d');
		
		pixToScreen = _pixToScreen
	}
	
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
											 'screenPosX': arg.xPos,
											 'screenPosY': arg.yPos,
											 'width': arg.width,
											 'height': arg.height,
											 'screenWidth': arg.width,
											 'screenHeight': arg.height,
											 'label': arg.label,
											 'labelXPos': arg.xPos,
											 'labelYPos': arg.yPos+arg.height,
											 'screenLabelX': arg.xPos,
											 'screenLabelY': arg.yPos+arg.height,
											 'color': defaultColor});
		 	
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
		var useId;
		var useColor;
		
		if (arg.id == undefined)
			useId = ++idIndex;
		else
			useId = arg.id;
		if (arg.color == undefined)
			useColor = defaultColor
		else
			useColor = arg.color;
		annotations.push({ 'type': 'circle',
											 'id': useId,
											 'visible': visible,
											 'textVisible': textVisible,
											 'xPos': arg.xPos,
											 'yPos': arg.yPos,
											 'screenPosX': arg.xPos,
											 'screenPosY': arg.yPos,
											 'radius': arg.radius,
											 'standardRadius': arg.radius,
											 'hoverRadius': arg.radius*1.5,
											 'screenRadius': arg.radius,
											 'label': arg.label,
											 'labelXPos': arg.xPos,
											 'labelYPos': arg.yPos+arg.radius,
											 'screenLabelX': arg.xPos,
											 'screenLabelY': arg.yPos+arg.radius,
											 'color': useColor});						
											 
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
											 'screenVertices': arg.vertices,
											 'label': arg.label,
											 'labelXPos': arg.labelXPos,
											 'labelYPos': arg.labelYPos,
											 'screenLabelX': arg.labelXPos,
											 'screenLabelY': arg.labelYPos,
											 'color': defaultColor });
		
		return idIndex;
	}
	
	// Calculates positions and sizes of an annotation depending on zoom level and viewport position
	var calcScreenAttributes = function(id) {
		switch (annotations[id].type) {
			case 'rect':
				var wh = 
					{'x': Math.abs(pixToScreen(annotations[id].xPos,annotations[id].yPos).x-pixToScreen(annotations[id].xPos+annotations[id].width,annotations[id].yPos+annotations[id].height).x),
					'y': Math.abs(pixToScreen(annotations[id].xPos,annotations[id].yPos).y-pixToScreen(annotations[id].xPos+annotations[id].width,annotations[id].yPos+annotations[id].height).y)};
				annotations[id].screenWidth = wh.x;
				annotations[id].screenHeight = wh.y;
				
				var pxy = pixToScreen(annotations[id].xPos,annotations[id].yPos);
				annotations[id].screenPosX = pxy.x;
				annotations[id].screenPosY = pxy.y;
				
				var lxy = pixToScreen(annotations[id].labelXPos,annotations[id].labelYPos);
				annotations[id].screenLabelX = lxy.x;
				annotations[id].screenLabelY = lxy.y;
			break;
			case 'circle':
				annotations[id].screenRadius = Math.abs(pixToScreen(annotations[id].xPos,0).x-pixToScreen(annotations[id].xPos+annotations[id].radius,0).x);
				var pxy = pixToScreen(annotations[id].xPos,annotations[id].yPos);
				annotations[id].screenPosX = pxy.x;
				annotations[id].screenPosY = pxy.y;
				
				var lxy = pixToScreen(annotations[id].labelXPos,annotations[id].labelYPos);
				annotations[id].screenLabelX = lxy.x;
				annotations[id].screenLabelY = lxy.y;
			break;
			case 'poly':
				var screenVertices = []
				for (j in annotations[id].vertices) {
					var pxy = pixToScreen(annotations[id].vertices[j][0],annotations[id].vertices[j][1]);
					var point = [pxy.x, pxy.y];
					screenVertices.push(point);
				}
				annotations[id].screenVertices = screenVertices;
				var lxy = pixToScreen(annotations[id].labelXPos,annotations[id].labelYPos);
				annotations[id].screenLabelX = lxy.x;
				annotations[id].screenLabelY = lxy.y;
			break;
		}
	}
	
	// Remove an annotation from the list, if it exists
	// Arguments:
	//				id - The unique id of the annotation to remove
	var removeAnnotation = function(id) {
		annotations.splice(id, 1);
	}
	
	var removeAllAnnotations = function() {
		annotations = []
	}
	
	// Set an annotation region to a certain color
	// Arguments:
	//				id - The unique id of the annotation to color
	//				color - A string giving the hexadecimal value of the color (ex. "#10ff00")
	var colorAnnotation = function(id, color) {
		for (i in annotations) {
			if (annotations[i].id == id)
				annotations[i].color = color;
		}
	}
	
	// Draw a specific annotation onto the canvas
	// Arguments:
	//				anno - The annotation object to be drawn
	//	   context - The context to draw onto
	var drawAnno = function(anno) {
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
				context.fillRect(anno.screenPosX, anno.screenPosY, anno.screenWidth, anno.screenHeight);
				context.globalAlpha = 1.0;
				context.strokeRect(anno.screenPosX, anno.screenPosY, anno.screenWidth, anno.screenHeight);
				break;
				
			case 'circle':
				context.lineWidth = 1
				context.strokeStyle = anno.color;
				context.fillStyle = anno.color;
				context.beginPath();
				context.arc(anno.screenPosX, anno.screenPosY, anno.screenRadius, 0, 2*Math.PI, false);
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
				context.moveTo(anno.screenVertices[0][0]*zoomFactor,anno.screenVertices[0][1]);
				for (var i = 1; i < anno.vertices.length; i++) {
					context.lineTo(anno.screenVertices[i][0],anno.screenVertices[i][1]);
				}
				context.lineTo(anno.screenVertices[0][0],anno.screenVertices[0][1]);
				context.globalAlpha = 0.3;
				context.fill();
				context.globalAlpha = 1.0;
				context.stroke();
				break;
		}
	}
	
	
	// Draw all visible annotation labels at their specified positions
	var drawVisibleLabel = function() {
		/*for (j in annotations) {
			if (annotations[j].textVisible && annotations[j].label !== undefined) {
				context.font = textHeight + "px sans-serif";
				var labelToUse = annotations[j].label;
				var textWidth = 0;
				for (i in labelToUse) {
					if (context.measureText(labelToUse[i]).width > textWidth)
						textWidth = context.measureText(labelToUse[i]).width;
				}
				
				// Shift the label along on the x or y axis if it goes outside the viewport
				var labelX = annotations[j].screenLabelX;
				var labelY = annotations[j].screenLabelY;
				if ((labelX + textWidth) > viewportWidth)
					labelX -= textWidth;
				if ((labelY+(textHeight*labelToUse.length)+2) > viewportHeight)
					labelY -= (textHeight*labelToUse.length)+2;
				
				context.fillStyle = "white";
				context.roundRect(labelX, labelY, labelX+textWidth, labelY+(textHeight*labelToUse.length)+2, 5);
				context.fill();
				context.strokeStyle = "gray";
				context.stroke();
				context.fillStyle = "black";
				for (i in labelToUse)
					context.fillText(labelToUse[i], labelX, (labelY+(i*textHeight))+textHeight);
			}
		}*/
	}
	
	// Draw all visible annotations in the list onto the canvas
	var draw = function() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		for (i in annotations) {
			calcScreenAttributes(i);
			drawAnno(annotations[i]);
		}
		drawVisibleLabel();
	}
	
	var handleMousemove = function(canvasMouse) {
		var mouse = {x: canvasMouse.offsetX, y: canvasMouse.offsetY};
		var labelIdToDraw = -1;
	
		// Activate and deactivate the text labels on annotations as the mouse moves inside the region
		for (i in annotations) {
			switch (annotations[i].type) {
				case 'rect':
					if (mouse.x >= annotations[i].screenPosX && mouse.x <= annotations[i].screenPosX+annotations[i].screenWidth &&
							mouse.y >= annotations[i].screenPosY && mouse.y <= annotations[i].screenPosY+annotations[i].screenHeight) {
							labelIdToDraw = i;
					}
					else if (annotations[i].textVisible) {
						annotations[i].textVisible = false;
						draw();
					}
					break;
				case 'circle':
					var dist = Math.sqrt(Math.pow(mouse.x-annotations[i].screenPosX,2)+Math.pow(mouse.y-annotations[i].screenPosY,2));
					if (dist <= (annotations[i].screenRadius*1.5)) {
						labelIdToDraw = i;
						annotations[i].radius = annotations[i].hoverRadius;
					}
					else if (annotations[i].textVisible) {
						annotations[i].radius = annotations[i].standardRadius;
						annotations[i].textVisible = false;
						draw();
					}
					break;
				case 'poly':
    			var c = false;
    			var k = annotations[i].vertices.length-1;
    			for (var j = 0; j < annotations[i].screenVertices.length; k = j++) {
    				if ( ((annotations[i].screenVertices[j][1] > mouse.y) != (annotations[i].screenVertices[k][1] > mouse.y)) && 
    				(mouse.x < (annotations[i].screenVertices[k][0]-annotations[i].screenVertices[j][0]) * (mouse.y-annotations[i].screenVertices[j][1]) / (annotations[i].screenVertices[k][1]-annotations[i].screenVertices[j][1]) + annotations[i].screenVertices[j][0]) )
       				c = !c;	
    			}
    			if (c) {
    				labelIdToDraw = i;
    			}
    			else if (annotations[i].textVisible) {
    				annotations[i].textVisible = false;
    				draw();
    			}
					break;
			}
		}
		if (labelIdToDraw != -1)
			annotations[labelIdToDraw].textVisible = true;
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
			viewportPosition.x += scrollVector.x;
			dragStart.x = e.offsetX;
			viewportPosition.y += scrollVector.y;
			dragStart.y = e.offsetY;
			draw();
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
	
	// Select all annotations within the box defined by dragstart to dragend (in pixel coordinates)
	// and give them the specified color. Returns the id of every annotation that was selected
	var selectAnnotations = function(dragStart, dragEnd, color) {
		if (dragStart.x > dragEnd.x) {
			var t = dragStart.x;
			dragStart.x = dragEnd.x;
			dragEnd.x = t;
		}
		if (dragStart.y > dragEnd.y) {
			var t = dragStart.y;
			dragStart.y = dragEnd.y;
			dragEnd.y = t;
		}
		
		var idList = []
		for (i in annotations) {
			if (annotations[i].xPos > dragStart.x && annotations[i].yPos > dragStart.y) {
				if (annotations[i].xPos < dragEnd.x && annotations[i].yPos < dragEnd.y) {
					var id = annotations[i].id;
					colorAnnotation(id, color);
					idList.push(id);
				}
			}
		}
		return idList;
	}
	
	// Draws a rounded rectangle
	CanvasRenderingContext2D.prototype.roundRect = function(sx,sy,ex,ey,r) {
    var r2d = Math.PI/180;
    if( ( ex - sx ) - ( 2 * r ) < 0 ) { r = ( ( ex - sx ) / 2 ); } //ensure that the radius isn't too large for x
    if( ( ey - sy ) - ( 2 * r ) < 0 ) { r = ( ( ey - sy ) / 2 ); } //ensure that the radius isn't too large for y
    this.beginPath();
    this.moveTo(sx+r,sy);
    this.lineTo(ex-r,sy);
    this.arc(ex-r,sy+r,r,r2d*270,r2d*360,false);
    this.lineTo(ex,ey-r);
    this.arc(ex-r,ey-r,r,r2d*0,r2d*90,false);
    this.lineTo(sx+r,ey);
    this.arc(sx+r,ey-r,r,r2d*90,r2d*180,false);
    this.lineTo(sx,sy+r);
    this.arc(sx+r,sy+r,r,r2d*180,r2d*270,false);
    this.closePath();
	}
	
	return {
		'init': init,
		'addRectRegion': addRectRegion,
		'addCircleRegion': addCircleRegion,
		'addPolyRegion': addPolyRegion,
		'removeAnnotation': removeAnnotation,
		'removeAllAnnotations': removeAllAnnotations,
		'colorAnnotation': colorAnnotation,
		'draw': draw,
		'showAnnotations': showAnnotations,
		'hideAnnotations': hideAnnotations,
		'selectAnnotations': selectAnnotations,
		'handleMousemove': handleMousemove,
		'handleMouseup': handleMouseup,
		'handleMousedown': handleMousedown,
		'handleMousemovePan': handleMousemovePan
	};
});
