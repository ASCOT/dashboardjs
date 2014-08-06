class Annotation
	constructor: (@id, @xPos, @yPos) ->
		@selected = false
		@mouseOver = false
		@isDragging = false
		@handles = []
		@color = "green"
	
	getColorRGBA: ->
		if @color == "red"
			return new Float32Array([1.0, 0.0, 0.0, 1.0])
		else if @color == "green"
			return new Float32Array([0.0, 1.0, 0.0, 1.0])
		else if @color == "blue"
			return new Float32Array([0.0, 0.0, 1.0, 1.0])
		else if @color == "yellow"
			return new Float32Array([1.0, 1.0, 0.0, 1.0])
		else if @color == "grey"
			return new Float32Array([0.8, 0.8, 0.8, 1.0])
	
	getOutlineVertices: ->
	getFillVertices: ->
	getHandleVertices: ->
		vertices = new Float32Array(@handles.length*2)
		for i in [0...@handles.length*2] by 2
			vertices[i] = @handles[i/2].xPos
			vertices[i+1] = @handles[i/2].yPos
			
		return vertices
	
	setXpos: (newX) ->
		for handle in @handles
			handle.xPos += (newX-@xPos)
		@xPos = newX
	
	setYpos: (newY) ->
		for handle in @handles
			handle.yPos += (newY-@yPos)
		@yPos = newY
	
	isMouseOver: (mouseX, mouseY) ->
	
	dragFunc: (xStart, yStart, xEnd, yEnd) ->
		@setXpos(xEnd-@drStart.x)
		@setYpos(yEnd-@drStart.y)
		
	newDrag: (xStart, yStart, xEnd, yEnd) ->
	
	getFields: =>
		fields =
			position:
				xPos: @xPos
				yPos: @yPos
		return fields

###
# Represents a draggable handle on an annotation, which can be used to change
# properties such as radius or width
###
class Handle
	constructor: (@xPos, @yPos, @parent) ->
		@isDragging = false
	
	dragFunc: (xStart, yStart, dx, dy) ->
	
	isMouseOver: (mouseX, mouseY, scaleFactor) ->
		dx = mouseX-@xPos
		dy = mouseY-@yPos
		d = Math.sqrt((dx*dx)+(dy*dy))
		if d < 5.0*scaleFactor then return true
		
		return false
