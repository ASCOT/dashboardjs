class Rectangle extends Annotation
	constructor: (width, height, id, color, xPos, yPos) ->
		super
		@width = width
		@height = height
		@id = id
		@color = color
		@xPos = xPos
		@yPos = yPos
		@handles = [new Handle(@xPos, @yPos, @), new Handle(@xPos + @width, @yPos, @),
								new Handle(@xPos + @width, @yPos + @height, @), new Handle(@xPos, @yPos + @height, @)]
		@handles[0].dragFunc = (xStart, yStart, xEnd, yEnd) =>
			@setWidth(@xPos+@width-xEnd)
			@setXpos(xEnd)
			@setHeight(@yPos+@height-yEnd)
			@setYpos(yEnd)
		@handles[1].dragFunc = (xStart, yStart, xEnd, yEnd) =>
			@setWidth(xEnd-@xPos)
			@setHeight(@yPos+@height-yEnd)
			@setYpos(yEnd)
		@handles[2].dragFunc = (xStart, yStart, xEnd, yEnd) =>
			@setWidth(xEnd-@xPos)
			@setHeight(yEnd-@yPos)
		@handles[3].dragFunc = (xStart, yStart, xEnd, yEnd) =>
			@setWidth(@xPos+@width-xEnd)
			@setXpos(xEnd)
			@setHeight(yEnd-@yPos)
		
	getOutlineVertices: ->
		vertices = new Float32Array([ @xPos, @yPos,
																	@xPos+@width, @yPos,
																	@xPos+@width, @yPos+@height,
																	@xPos, @yPos+@height,
																	@xPos, @yPos ])
		
		return [vertices]
	
	getFillVertices: ->
			vertices = new Float32Array([@xPos, @yPos,
																	 @xPos+@width, @yPos,
																	 @xPos, @yPos+@height,
																	 @xPos+@width, @yPos+@height])
			return vertices
	
	getHandleVertices: ->
		vertices = new Float32Array([ @xPos, @yPos,
																	@xPos+@width, @yPos,
																	@xPos, @yPos+@height,
																	@xPos+@width, @yPos+@height])
		return vertices
	
	isMouseOver: (mouseX, mouseY) ->
		if @width > 0
			if mouseX < @xPos or mouseX > @xPos+@width
				return false
		else
			if mouseX > @xPos or mouseX < @xPos+@width
				return false
			
		if @height > 0
			if mouseY < @yPos or mouseY > @yPos+@height
				return false
		else
			if mouseY > @yPos or mouseY < @yPos+@height
				return false
				
		return true
	
	setWidth: (width) ->
		@handles[1].xPos = @xPos + width
		@handles[2].xPos = @xPos + width
		@width = width
	
	setHeight: (height) ->
		@handles[2].yPos = @yPos + height
		@handles[3].yPos = @yPos + height
		@height = height
		
	setXpos: (xPos) ->
		@handles[0].xPos = xPos
		@handles[1].xPos = xPos + @width
		@handles[2].xPos = xPos + @width
		@handles[3].xPos = xPos
		@xPos = xPos
	
	setYpos: (yPos) ->
		@handles[0].yPos = yPos
		@handles[1].yPos = yPos
		@handles[2].yPos = yPos + @height
		@handles[3].yPos = yPos + @height
		@yPos = yPos
		
	newDrag: (xStart, yStart, xEnd, yEnd) ->
		dx = xEnd - xStart
		dy = yEnd - yStart
		@setXpos(xStart)
		@setYpos(yStart)
		@setWidth(dx)
		@setHeight(dy)

	getFields: =>
		fields =
			position:
				xPos: @xPos
				yPos: @yPos
			dimensions:
				width: @width
				height: @height
		return fields
