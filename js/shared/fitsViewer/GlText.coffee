class GlTextBox
	constructor: (@textElements, @xPos, @yPos, @width, @height) ->
	
	generatePixelData: ->
		canvas = document.createElement('canvas')
		canvas.width = @width
		canvas.height = @height
		ctx = canvas.getContext('2d')
		
		ctx.fillStyle = '#F1F1F1'
		ctx.strokeStyle = '#aaa'
		strokeWidth = 1
		ctx.fillRect(0, 0, @width, @height)
		ctx.lineWidth = strokeWidth
		ctx.strokeRect(0, 0, @width, @height)
		
		for el in @textElements
			el.render(ctx)
		
		return canvas
	
	draw: (gl, textProgram, pixToGlCoords) ->
		# generate a texture to display the text
		pixelData = @generatePixelData()
		textTexture = gl.createTexture()
		gl.bindTexture(gl.TEXTURE_2D, textTexture)
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pixelData)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
		gl.activeTexture(gl.TEXTURE0)
		gl.uniform1i(gl.getUniformLocation(textProgram, "texture"), 0)
		
		# provide the vertex and texture coordinates to the program
		texCoordBuffer = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
		textureCoords = new Float32Array([ 0.0, 1.0,
																			 1.0, 1.0,
																			 0.0, 0.0,
																			 1.0, 0.0 ])
		gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW)
		
		vertexBufferText = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferText)
		
		c1 = pixToGlCoords(@xPos, @yPos)
		c2 = pixToGlCoords(@xPos+@width, @yPos+@height)
		vertices = new Float32Array([ c1.x, c1.y,
																	c2.x, c1.y
																	c1.x, c2.y
																	c2.x, c2.y ])
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
		
		gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
		texCoordAttribute = gl.getAttribLocation(textProgram, "aTextureCoord")
		gl.enableVertexAttribArray(texCoordAttribute)
		gl.vertexAttribPointer(texCoordAttribute, 2, gl.FLOAT, false, 0, 0)
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferText)
		vertexPosAttribute = gl.getAttribLocation(textProgram, "aVertexPosition")
		gl.enableVertexAttribArray(vertexPosAttribute)
		gl.vertexAttribPointer(vertexPosAttribute, 2, gl.FLOAT, false, 0, 0)
	
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
		
class TextElement
	constructor: (@xPos, @yPos, @text) ->
	
	render: (ctx) ->
		fontSize = 12
		ctx.font = fontSize+'px Arial'
		ctx.textAlign = 'left'
		ctx.textBaseline = 'middle'
		ctx.fillStyle = '#555'
		ctx.fillText(@text, @xPos, @yPos)
