class Circle extends Annotation
	numPoints: 20
	constructor: (radius, id, color, xPos, yPos) ->
		super
		@radius = radius
		@id = id
		@color = color
		@xPos = xPos
		@yPos = yPos
		@handles = [new Handle(@xPos + @radius, @yPos, @)]
		@handles[0].dragFunc = (xStart, yStart, xEnd, yEnd) =>
			dx = xEnd - @xPos
			dy = yEnd - @yPos
			r = Math.sqrt((dx*dx)+(dy*dy))
			@setRadius(r)
	
	getOutlineVertices: ->
		vertices = new Float32Array(@numPoints*2+2)
		index = 0
		for theta in [-Math.PI/2.0..3.0*Math.PI/2.0] by 2.0*Math.PI/@numPoints
			x = @radius*Math.cos(theta)
			y = @radius*Math.sin(theta)
			vertices[index] = x + @xPos
			vertices[index+1] = y + @yPos
			index += 2
		vertices[vertices.length-2] = vertices[0]
		vertices[vertices.length-1] = vertices[1]
		
		return [vertices]
	
	getFillVertices: ->
		vertices = new Float32Array(@numPoints*2+2)
		index = 0
		for theta in [-Math.PI/2.0..Math.PI/2.0] by 2.0*Math.PI/@numPoints
			x = @radius*Math.cos(theta)
			y = @radius*Math.sin(theta)
			vertices[index] = x + @xPos
			vertices[index+1] = y + @yPos
			vertices[index+2] = -x + @xPos
			vertices[index+3] = y + @yPos
			index += 4
		vertices[vertices.length-2] = @xPos
		vertices[vertices.length-1] = @yPos + @radius
		
		return vertices
	
	setRadius: (newR) ->
		for handle in @handles
			handle.xPos = @xPos + newR
		@radius = newR
	
	isMouseOver: (mouseX, mouseY) ->
		dx = mouseX-@xPos
		dy = mouseY-@yPos
		dist = Math.sqrt(dx*dx+dy*dy)
		if dist < @radius
			return true
		return false
	
	newDrag: (xStart, yStart, xEnd, yEnd) ->
		dx = xEnd - xStart
		dy = yEnd - yStart
		r = Math.sqrt((dx*dx)+(dy*dy))
		@setRadius(r)
	
	getFields: =>
		fields =
			position:
				xPos: @xPos
				yPos: @yPos
			dimensions:
				radius: @radius
		return fields
	
	setValues: (values) =>
		@setXpos(values.xPos)
		@setYpos(values.yPos)
		@setRadius(values.radius)
