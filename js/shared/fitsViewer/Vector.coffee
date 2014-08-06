class Vector extends Line
	getOutlineVertices: ->
		r = 15.0
		theta = Math.atan2((@yPos+@dy2)-(@yPos+@dy1), (@xPos+@dx2)-(@xPos+@dx1))
		p1x = r*Math.cos(theta-(3.0*Math.PI/4.0))+@xPos+@dx2
		p1y = r*Math.sin(theta-(3.0*Math.PI/4.0))+@yPos+@dy2
		p2x = r*Math.cos(theta+(3.0*Math.PI/4.0))+@xPos+@dx2
		p2y = r*Math.sin(theta+(3.0*Math.PI/4.0))+@yPos+@dy2
		vertices = new Float32Array([ @xPos+@dx1, @yPos+@dy1, @xPos+@dx2, @yPos+@dy2, p1x, p1y, @xPos+@dx2, @yPos+@dy2, p2x, p2y ])
		return [vertices]
