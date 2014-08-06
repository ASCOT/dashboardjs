class Ellipse extends Annotation
	numPoints: 20
	constructor: (a, b, id, color, xPos, yPos) ->
		super
		@a = a
		@b = b
		@id = id
		@color = color
		@xPos = xPos
		@yPos = yPos
		@handles = [new Handle(@xPos + @a, @yPos, @), new Handle(@xPos, @yPos-@b, @)]
		@handles[0].dragFunc = (xStart, yStart, xEnd, yEnd) =>
			dx = xEnd - @xPos
			@setA(dx)
		@handles[1].dragFunc = (xStart, yStart, xEnd, yEnd) =>
			dy = yEnd - @yPos
			@setB(dy)
	
	getOutlineVertices: ->
		vertices = new Float32Array(@numPoints*2+2)
		index = 0
		for theta in [-Math.PI/2.0..3.0*Math.PI/2.0] by 2.0*Math.PI/@numPoints
			x = @a*Math.cos(theta)
			y = @b*Math.sin(theta)
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
			x = @a*Math.cos(theta)
			y = @b*Math.sin(theta)
			vertices[index] = x + @xPos
			vertices[index+1] = y + @yPos
			vertices[index+2] = -x + @xPos
			vertices[index+3] = y + @yPos
			index += 4
		vertices[vertices.length-2] = @xPos
		vertices[vertices.length-1] = @yPos + @b
		
		return vertices
		
	setA: (newA) ->
		@handles[0].xPos = @xPos + newA
		@a = newA
	
	setB: (newB) ->
		@handles[1].yPos = @yPos + newB
		@b = newB
	
	isMouseOver: (mouseX, mouseY) ->
		val = (mouseX-@xPos)*(mouseX-@xPos)/(@a*@a) + (mouseY-@yPos)*(mouseY-@yPos)/(@b*@b)
		if val <= 1.0 then return true
		
		return false
	
	newDrag: (xStart, yStart, xEnd, yEnd) ->
		dx = xEnd - xStart
		dy = yEnd - yStart
		@setA(dx)
		@setB(dy)
		
	getFields: =>
		fields =
			position:
				xPos: @xPos
				yPos: @yPos
			dimensions:
				a: @a
				b: @b
		return fields
	
	setValues: (values) =>
		@setXpos(values.xPos)
		@setYpos(values.yPos)
		@setA(values.a)
		@setB(values.b)
