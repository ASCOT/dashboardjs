class Line extends Annotation
	constructor: (xPos, yPos, dx1, dy1, dx2, dy2, id, color) ->
		super
		@xPos = xPos
		@yPos = yPos
		@dx1 = dx1
		@dy1 = dy1
		@dx2 = dx2
		@dy2 = dy2
		@id = id
		@color = color
		@handles = [new Handle(@xPos + @dx1, @yPos + @dy1, @), new Handle(@xPos + @dx2, @yPos + @dy2, @)]
		@handles[0].dragFunc = (xStart, yStart, xEnd, yEnd) =>
			@setdx1(xEnd - @xPos)
			@setdy1(yEnd - @yPos)
		@handles[1].dragFunc = (xStart, yStart, xEnd, yEnd) =>
			@setdx2(xEnd - @xPos)
			@setdy2(yEnd - @yPos)
			
	getOutlineVertices: ->
		vertices = new Float32Array([ @xPos + @dx1, @yPos + @dy1, @xPos + @dx2, @yPos + @dy2 ])
		return [vertices]
	
	getFillVertices: ->
		return []
	
	getHandleVertices: ->
		vertices = new Float32Array([ @xPos + @dx1, @yPos + @dy1, @xPos + @dx2, @yPos + @dy2 ])
		return vertices
	
	isMouseOver: (mouseX, mouseY) ->
		dist = (pa, pb) ->
			return Math.sqrt((pa.x-pb.x)*(pa.x-pb.x)+(pa.y-pb.y)*(pa.y-pb.y))
		
		p =
			x: mouseX
			y: mouseY
		p1 =
			x: @xPos + @dx1
			y: @yPos + @dy1
		p2 =
			x: @xPos + @dx2
			y: @yPos + @dy2
		
		v =
			x: p2.x - p1.x
			y: p2.y - p1.y
		w =
			x: p.x - p1.x
			y: p.y - p1.y
			
		c1 = v.x*w.x + v.y*w.y
		c2 = v.x*v.x + v.y*v.y
		
		if c1 <= 0
			d = dist(p, p1)
		else if c2 <= c1
			d = dist(p, p2)
		else
			b = c1/c2
			pb =
				x: p1.x + b*v.x
				y: p1.y + b*v.y
			d = dist(p, pb)
			
		if d < 10.0 then return true
		return false
	
	setXpos: (newX) ->
		for handle in @handles
			handle.xPos += (newX-@xPos)
		@xPos = newX
	
	setYpos: (newY) ->
		for handle in @handles
			handle.yPos += (newY-@yPos)
		@yPos = newY
	
	setdx1: (dx1) ->
		@handles[0].xPos = @xPos + dx1
		@dx1 = dx1
	
	setdy1: (dy1) ->
		@handles[0].yPos = @yPos + dy1
		@dy1 = dy1
		
	setdx2: (dx2) ->
		@handles[1].xPos = @xPos + dx2
		@dx2 = dx2
		
	setdy2: (dy2) ->
		@handles[1].yPos = @xPos + dy2
		@dy2 = dy2
		
	newDrag: (xStart, yStart, xEnd, yEnd) ->
		dx = xEnd - xStart
		dy = yEnd - yStart
		@setdx2(dx)
		@setdy2(dy)
	
	getFields: =>
		fields =
			position:
				xPos: @xPos
				yPos: @yPos
			dimensions:
				dx1: @dx1
				dy1: @dy1
				dx2: @dx2
				dy2: @dy2
		return fields
