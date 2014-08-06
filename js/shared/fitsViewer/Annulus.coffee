class Annulus extends Annotation
	numPoints: 20
	constructor: (r1, r2, id, color, xPos, yPos) ->
		super
		@r1 = r1
		@r2 = r2
		@id = id
		@color = color
		@xPos = xPos
		@yPos = yPos
		@handles = [new Handle(@xPos + @r1, @yPos, @), new Handle(@xPos + @r2, @yPos, @)]
		@handles[0].dragFunc = (xStart, yStart, xEnd, yEnd) =>
			dx = xEnd - @xPos
			@setR1(dx)
		@handles[1].dragFunc = (xStart, yStart, xEnd, yEnd) =>
			dx = xEnd - @xPos
			@setR2(dx)
		
	getOutlineVertices: ->
		vInner = new Float32Array(@numPoints*2+2)
		index = 0
		for theta in [-Math.PI/2.0..3.0*Math.PI/2.0] by 2.0*Math.PI/@numPoints
			x = @r1*Math.cos(theta)
			y = @r1*Math.sin(theta)
			vInner[index] = x + @xPos
			vInner[index+1] = y + @yPos
			index += 2
		vInner[index] = vInner[0]
		vInner[index+1] = vInner[1]
		index += 2
		
		vOuter = new Float32Array(@numPoints*2+2)
		index = 0
		for theta in [-Math.PI/2.0..3.0*Math.PI/2.0] by 2.0*Math.PI/@numPoints
			x = @r2*Math.cos(theta)
			y = @r2*Math.sin(theta)
			vOuter[index] = x + @xPos
			vOuter[index+1] = y + @yPos
			index += 2
		vOuter[index] = vOuter[0]
		vOuter[index+1] = vOuter[1]
		index += 2
		
		return [vInner, vOuter]
	
	getFillVertices: ->
		vertices = new Float32Array(@numPoints*4+4)
		index = 0
		for theta in [-Math.PI/2.0..3.0*Math.PI/2.0] by 2.0*Math.PI/@numPoints
			x1 = @r1*Math.cos(theta)
			y1 = @r1*Math.sin(theta)
			x2 = @r2*Math.cos(theta)
			y2 = @r2*Math.sin(theta)
			vertices[index] = x1 + @xPos
			vertices[index+1] = y1 + @yPos
			vertices[index+2] = x2 + @xPos
			vertices[index+3] = y2 + @yPos
			index += 4
		
		vertices[vertices.length-4] = vertices[0]
		vertices[vertices.length-3] = vertices[1]
		vertices[vertices.length-2] = vertices[2]
		vertices[vertices.length-1] = vertices[3]
		
		return vertices
	
	getHandleVertices: ->
		vertices = new Float32Array([@xPos+@r1, @yPos,
																 @xPos+@r2, @yPos])
		return vertices
	
	isMouseOver: (mouseX, mouseY) ->
		dx = mouseX-@xPos
		dy = mouseY-@yPos
		dist = Math.sqrt(dx*dx+dy*dy)
		if dist < @r2 and dist > @r1
			return true
		return false
	
	setR1: (r1) ->
		if r1 > @r2 or r1 < 0 then return
		@handles[0].xPos = @xPos + r1
		@r1 = r1
		
	setR2: (r2) ->
		if r2 < @r1 then return
		@handles[1].xPos = @xPos + r2
		@r2 = r2
		
	newDrag: (xStart, yStart, xEnd, yEnd) ->
		dx = xEnd - xStart
		dy = yEnd - yStart
		r = Math.sqrt((dx*dx)+(dy*dy))
		@setR1(r/2.0)
		@setR2(r)
	
	getFields: =>
		fields =
			position:
				xPos: @xPos
				yPos: @yPos
			dimensions:
				r1: @r1
				r2: @r2
		return fields
