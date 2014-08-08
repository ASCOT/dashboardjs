annoVertexShaderSource = 
	["attribute vec2 aVertexPosition;",
	"attribute vec4 aColor;",
	"uniform mat4 uMVMatrix;",
	
	"varying vec4 vColor;",
	
	"void main() {",
		"gl_PointSize = 5.0;",
		"gl_Position = uMVMatrix * vec4(aVertexPosition, 0.0, 1.0);",
		"vColor = aColor;",
	"}"].join("\n")
	
textVertexShaderSource = 
	["attribute vec2 aVertexPosition;",
	"attribute vec2 aTextureCoord;",
	
	"varying highp vec2 vTextureCoord;",
	
	"void main() {",
		"gl_Position = vec4(aVertexPosition, 0.0, 1.0);",
		"vTextureCoord = aTextureCoord;",
	"}"].join("\n")

imgVertexShaderSource = 
	["attribute vec2 aVertexPosition;",
	"attribute vec2 aTextureCoord;",
	
	"uniform mat4 uMVMatrix;",
	
	"varying highp vec2 vTextureCoord;",
	
	"void main() {",
		"gl_Position = uMVMatrix * vec4(aVertexPosition, 0.0, 1.0);",
		"vTextureCoord = aTextureCoord;",
	"}"].join("\n")

annoFragmentShaderSource =
	["precision highp float;",
	"varying vec4 vColor;",
	
	"void main() {",
		"gl_FragColor = vColor;",
	"}"].join("\n")

textFragmentShaderSource = 
	["varying highp vec2 vTextureCoord;",
	"uniform sampler2D texture;",
	
	"void main() {",
		"gl_FragColor = texture2D(texture, vTextureCoord);",
	"}"].join("\n")

imgFragmentShaderSource =
	'linear': [
			"varying highp vec2 vTextureCoord;",
			"uniform sampler2D texture;",
			"uniform highp vec2 uExtent;",
		
			"void main() {",
					"highp vec4 color = texture2D(texture, vTextureCoord);",
					"highp float min = uExtent[0];",
					"highp float max = uExtent[1];",
					"highp float val = (color.r - min)/(max - min);",
		
					"gl_FragColor = vec4(val, val, val, 1.0);",
			"}"
		].join("\n")
	
	'log': [
			"varying highp vec2 vTextureCoord;",
			"uniform sampler2D texture;",
			"uniform highp vec2 uExtent;",
	
			"void main() {",
					"highp vec4 color = texture2D(texture, vTextureCoord);",
					"highp float min = uExtent[0];",
					"highp float max = uExtent[1];",
					"highp float linearVal = (color.r - min)/(max - min);",
					"highp float val = log(1.0+1000.0*linearVal)/log(1000.0);",
	
					"gl_FragColor = vec4(val, val, val, 1.0);",
			"}"
		].join("\n")
		
		'power': [
				"varying highp vec2 vTextureCoord;",
				"uniform sampler2D texture;",
				"uniform highp vec2 uExtent;",
		
				"void main() {",
						"highp vec4 color = texture2D(texture, vTextureCoord);",
						"highp float min = uExtent[0];",
						"highp float max = uExtent[1];",
						"highp float linearVal = (color.r - min)/(max - min);",
						"highp float val = (pow(1000.0, linearVal) - 1.0)/1000.0;",
		
						"gl_FragColor = vec4(val, val, val, 1.0);",
				"}"
			].join("\n")
		
		'sqrt': [
				"varying highp vec2 vTextureCoord;",
				"uniform sampler2D texture;",
				"uniform highp vec2 uExtent;",
		
				"void main() {",
						"highp vec4 color = texture2D(texture, vTextureCoord);",
						"highp float min = uExtent[0];",
						"highp float max = uExtent[1];",
						"highp float linearVal = (color.r - min)/(max - min);",
						"highp float val = sqrt(linearVal);",
		
						"gl_FragColor = vec4(val, val, val, 1.0);",
				"}"
			].join("\n")
		
		'squared': [
				"varying highp vec2 vTextureCoord;",
				"uniform sampler2D texture;",
				"uniform highp vec2 uExtent;",
		
				"void main() {",
						"highp vec4 color = texture2D(texture, vTextureCoord);",
						"highp float min = uExtent[0];",
						"highp float max = uExtent[1];",
						"highp float linearVal = (color.r - min)/(max - min);",
						"highp float val = linearVal*linearVal;",
		
						"gl_FragColor = vec4(val, val, val, 1.0);",
				"}"
			].join("\n")
		
		'asinh': [
				"varying highp vec2 vTextureCoord;",
				"uniform sampler2D texture;",
				"uniform highp vec2 uExtent;",
		
				"highp float asinh(highp float val) {",
					"highp float tmp = val + sqrt(1.0 + val*val);",
					"return log(tmp);",
				"}",
		
				"void main() {",
						"highp vec4 color = texture2D(texture, vTextureCoord);",
						"highp float min = uExtent[0];",
						"highp float max = uExtent[1];",
						"highp float linearVal = (color.r - min)/(max - min);",
						"highp float val = asinh(linearVal);",
		
						"gl_FragColor = vec4(val, val, val, 1.0);",
				"}"
			].join("\n")
		
		'sinh': [
				"varying highp vec2 vTextureCoord;",
				"uniform sampler2D texture;",
				"uniform highp vec2 uExtent;",
		
				"highp float sinh(highp float val) {",
					"highp float tmp = exp(val);",
					"return (tmp - 1.0 / tmp) / 2.0;",
				"}",
		
				"void main() {",
						"highp vec4 color = texture2D(texture, vTextureCoord);",
						"highp float min = uExtent[0];",
						"highp float max = uExtent[1];",
						"highp float linearVal = (color.r - min)/(max - min);",
						"highp float val = sinh(linearVal);",
		
						"gl_FragColor = vec4(val, val, val, 1.0);",
				"}"
		].join("\n")

class Renderer
	###
	# Grab a gl context, setup the canvas event handlers and load the image data into a texture
	# Parameters:
	#		annotationManager - Annotation manager object from which to gather data to draw annotations
	#							 canvas - The HTML5 canvas object onto which the image will be drawn
	#							stretch - A string specifying the stretch program to use when the image is drawn
	# 				 imageState - Object containing pixel data, dimensions and extent
	#									wcs - Initialized wcs object to convert between pixel and sky coordinates
	###
	constructor: (@annotationManager, canvas, stretch, imageState, wcs) ->
		@imageWidth = imageState.width
		@imageHeight = imageState.height
		@extent = imageState.extent
		@imageData = imageState.data
		@wcs = wcs
		
	
		@gl = canvas.getContext('webgl')
		@gl.getExtension('OES_texture_float')
		@initViewport(canvas)
	
	initViewport: () ->
		@gl.viewportWidth = canvas.width
		@gl.viewportHeight = canvas.height
		@mouseDownLast = x: 0.0, y: 0.0
		@mouseLast = x: 0.0, y: 0.0
		@createAnno = false
		@dragAnno = false
		@dragHandle = false
		
		@xTrans = 0.0
		@yTrans = 0.0
		@scale = 1.0
		
		@initEventHandlers(canvas)
		@initGL(stretch)
	
	###
	# Setup the canvas event handlers
	# Click and drag to pan the image
	# Mouse wheel changes the zoom
	# Mouse movement updates the coordinate readout
	###
	initEventHandlers: (canvas) =>
		canvas.addEventListener "contextmenu", (e) =>
			e.preventDefault()
		canvas.addEventListener "dblclick", (e) =>
			imgCoords = @screenToImageCoords(e.offsetX, e.offsetY)
			@annotationManager.dblClick(imgCoords.x, imgCoords.y)
		canvas.addEventListener "mousedown", (e) =>
			if e.button == 0
				@leftMouseDown = true
				imgCoords = @screenToImageCoords(e.offsetX, e.offsetY)
				@mouseDownLast = x: imgCoords.x, y: imgCoords.y
				
				clickTarget = @annotationManager.dragStartClick(imgCoords.x, imgCoords.y, @startScale/@scale)
				if @selectAnno
					@annotationManager.selectAnnoClick(imgCoords.x, imgCoords.y)
				else if @createAnno
					@annotationManager.createAnnoClick(imgCoords.x, imgCoords.y)
				else if clickTarget != null
					if clickTarget instanceof Annotation
						@dragAnno = true
					else if clickTarget instanceof Handle
						@dragHandle = true
				
				@drawGL()
		canvas.addEventListener "mouseup", (e) =>
			if e.button == 0
				@leftMouseDown = false
				imgCoords = @screenToImageCoords(e.offsetX, e.offsetY)
				if @selectAnno
					@annotationManager.unclickSelectAnno(imgCoords.x, imgCoords.y)
					@selectAnno = false
				else if @createAnno
					@annotationManager.unclickCreateAnno(imgCoords.x, imgCoords.y)
					@createAnno = false
				else if @dragAnno
					@annotationManager.unclickDragAnno(imgCoords.x, imgCoords.y)
					@dragAnno = false
				else if @dragHandle
					@annotationManager.unclickDragHandle(imgCoords.x, imgCoords.y)
					@dragHandle = false
			
				@drawGL()
		canvas.addEventListener "mouseout", =>
			@leftMouseDown = false
		canvas.addEventListener "mousewheel", (e) => 
			e.preventDefault()
			@zoom e.wheelDelta/120
		canvas.addEventListener "mousemove", (e) =>
			imgCoords = @screenToImageCoords(e.offsetX, e.offsetY)
			if @leftMouseDown
				if @createAnno or @selectAnno
					@annotationManager.getPlaceholder().newDrag(@mouseDownLast.x, @mouseDownLast.y, imgCoords.x, imgCoords.y)
				else if @dragAnno
					if !@annotationManager.clickedObject.fromDs
						@annotationManager.clickedObject.dragFunc(@mouseDownLast.x, @mouseDownLast.y, imgCoords.x, imgCoords.y)
				else if @dragHandle
					if !@annotationManager.clickedObject.parent.fromDs
						@annotationManager.clickedObject.dragFunc(@mouseDownLast.x, @mouseDownLast.y, imgCoords.x, imgCoords.y)
				else
					@translate(e.offsetX-@mouseLast.x, @mouseLast.y-e.offsetY)
			else
				imgCoords = @screenToImageCoords(e.offsetX, e.offsetY)
				@annotationManager.mouseOver(imgCoords.x, imgCoords.y, @startScale/@scale)
			
			@mouseLast = x: e.offsetX, y: e.offsetY
			@drawGL()
	
	enableCreateAnno: (mode) ->
		@createAnno = true
		@selectAnno = false
		@annotationManager.setToolState(mode)
	
	enableSelectAnno: (mode) ->
		@selectAnno = true
		@createAnno = false
		@annotationManager.setToolState(mode)
	
	###
	# Convert canvas mouse coordinates to FITS image pixel coordinates
	###
	screenToImageCoords: (screenX, screenY) ->
		imgX = (screenX - (@xTrans/2.0*@gl.viewportWidth*@scale) - ((@gl.viewportWidth/2.0)*(1-@scale)))*@startScale/@scale
		imgY = @imageHeight - ((@yTrans/2.0*@gl.viewportHeight*@scale) - ((@gl.viewportHeight/2.0)*(1-@scale)) + screenY)*@startScale/@scale
		
		return { x: imgX, y: imgY }
	
	###
	# Convert FITS image pixel coordinates to GL coordinates
	###
	imageToGlCoords: (imageX, imageY) =>
		glX = (imageX/@imageWidth*2.0)-1.0
		glY = (imageY/@imageHeight*2.0)-1.0
	
		return { x: glX, y: glY }
		
	###
	# Convert canvas mouse coordinates to GL coordinates
	###
	screenToGlCoords: (screenX, screenY) =>
		glX = (screenX/@gl.viewportWidth*2.0)-1.0
		glY = (screenY/@gl.viewportHeight*2.0)-1.0
		
		return {x: glX, y: glY }
	
	###
	# Transform a list of vertices from image pixel coordinates to GL coordinates
	###
	transformVertices: (vertices) ->
		transformed = new Float32Array(vertices.length)
		for i in [0..vertices.length-1] by 2
			transCoord = @imageToGlCoords(vertices[i], vertices[i+1])
			transformed[i] = transCoord.x
			transformed[i+1] = transCoord.y
		
		return transformed
	
	###
	# Compile a shader object from source
	###
	loadShader: (source, type) ->
		shader = @gl.createShader(type)
		@gl.shaderSource(shader, source)
		@gl.compileShader(shader)
		
		compiled = @gl.getShaderParameter(shader, @gl.COMPILE_STATUS)
		unless compiled
			compLog = @gl.getShaderInfoLog(shader)
			throw "Error compiling shader " + shader + ": " + compLog
			@gl.deleteShader(shader);
			return null
		
		return shader
	
	###
	# Assemble a vertex and fragment shader into a program
	###
	createProgram: (vertexShader, fragmentShader) ->
		program = @gl.createProgram()
		@gl.attachShader(program, vertexShader)
		@gl.attachShader(program, fragmentShader)
		@gl.linkProgram(program)
		
		linked = @gl.getProgramParameter(program, @gl.LINK_STATUS)
		unless linked
			errorLog = @gl.getProgramInfoLog(program)
			throw "Error in program linking: " + errorLog
			return null
		
		return program
	
	###
	# Generate shader programs for the image data, text boxes, and annotations
	# Also generate a texture from the image data
	###
	initGL: (stretch) ->
		# Load up the shaders and generate programs
		
		# Program for rendering FITS data
		vertexShader = @loadShader(imgVertexShaderSource, @gl.VERTEX_SHADER)
		fragmentShader = @loadShader(imgFragmentShaderSource[stretch], @gl.FRAGMENT_SHADER)
		@imgProgram = @createProgram(vertexShader, fragmentShader)
		@gl.useProgram(@imgProgram)
		
		# Provide the extent of the image values to the program
		extentUniform = @gl.getUniformLocation(@imgProgram, "uExtent")
		@gl.uniform2f(extentUniform, @extent[0], @extent[1])
		
		# Provide the texture coordinates for the image to the program
		@texCoordBuffer = @gl.createBuffer()
		@gl.bindBuffer(@gl.ARRAY_BUFFER, @texCoordBuffer)
		textureCoords = new Float32Array([ 0.0, 1.0,
																			 1.0, 1.0,
																			 0.0, 0.0,
																			 1.0, 0.0 ])
		@gl.bufferData(@gl.ARRAY_BUFFER, textureCoords, @gl.STATIC_DRAW)
		
		# Generate the vertices of the rectangle onto which the image is drawn
		# Scale the rectangle so that the image aspect ratio is preserved, and
		# the image fits within a unit square
		@vertexBufferImg = @gl.createBuffer()
		@gl.bindBuffer(@gl.ARRAY_BUFFER, @vertexBufferImg)
		hwRatio = @imageHeight/@imageWidth
		if hwRatio < (@gl.viewportHeight/@gl.viewportWidth)
			@startScale = @imageWidth/@gl.viewportWidth
			vertices = new Float32Array([ -1.0, -1.0*hwRatio,
																		 1.0, -1.0*hwRatio,
																		-1.0, 1.0*hwRatio,
																		 1.0, 1.0*hwRatio ])
		else
			@startScale = @imageHeight/@gl.viewportHeight
			vertices = new Float32Array([ -1.0/hwRatio, -1.0,
																		 1.0/hwRatio, -1.0,
																		-1.0/hwRatio, 1.0,
																		 1.0/hwRatio, 1.0 ])
		@gl.bufferData(@gl.ARRAY_BUFFER, vertices, @gl.STATIC_DRAW)
		
		# Generate a texture from the image data
		@imgTexture = @gl.createTexture()
		@gl.bindTexture(@gl.TEXTURE_2D, @imgTexture)
		@gl.texImage2D(@gl.TEXTURE_2D, 0, @gl.LUMINANCE, @imageWidth, @imageHeight, 0, @gl.LUMINANCE, @gl.FLOAT, new Float32Array(@imageData))
		@gl.texParameteri(@gl.TEXTURE_2D, @gl.TEXTURE_WRAP_S, @gl.CLAMP_TO_EDGE)
		@gl.texParameteri(@gl.TEXTURE_2D, @gl.TEXTURE_WRAP_T, @gl.CLAMP_TO_EDGE)
		@gl.texParameteri(@gl.TEXTURE_2D, @gl.TEXTURE_MIN_FILTER, @gl.NEAREST)
		@gl.texParameteri(@gl.TEXTURE_2D, @gl.TEXTURE_MAG_FILTER, @gl.NEAREST)
		@gl.bindTexture(@gl.TEXTURE_2D, null)
		
		# Provide initial values for the MV matrix
		mvMatrix = mat4.create()
		mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, 0.0])
		uMVMatrix = @gl.getUniformLocation(@imgProgram, "uMVMatrix")
		@gl.uniformMatrix4fv(uMVMatrix, false, mvMatrix)
		
		# Program for rendering annotations
		vertexShader = @loadShader(annoVertexShaderSource, @gl.VERTEX_SHADER)
		fragmentShader = @loadShader(annoFragmentShaderSource, @gl.FRAGMENT_SHADER)
		@annoProgram = @createProgram(vertexShader, fragmentShader)
		@gl.useProgram(@annoProgram)
		
		uMVMatrix = @gl.getUniformLocation(@annoProgram, "uMVMatrix")
		@gl.uniformMatrix4fv(uMVMatrix, false, mvMatrix)
		
		# Program for text overlays
		vertexShader = @loadShader(textVertexShaderSource, @gl.VERTEX_SHADER)
		fragmentShader = @loadShader(textFragmentShaderSource, @gl.FRAGMENT_SHADER)
		@textProgram = @createProgram(vertexShader, fragmentShader)
		
		@drawGL()
	
	###
	# Transform the annotations and image based on the current offset and zoom
	###
	transformGL: ->
		mvMatrix = mat4.create()
		mat4.scale(mvMatrix, mvMatrix, [@scale, @scale, 0.0])
		mat4.translate(mvMatrix, mvMatrix, [@xTrans, @yTrans, 0.0])
		
		@gl.useProgram(@imgProgram)
		uMVMatrix = @gl.getUniformLocation(@imgProgram, "uMVMatrix")
		@gl.uniformMatrix4fv(uMVMatrix, false, mvMatrix)
		@gl.useProgram(@annoProgram)
		uMVMatrix = @gl.getUniformLocation(@annoProgram, "uMVMatrix")
		@gl.uniformMatrix4fv(uMVMatrix, false, mvMatrix)
		
		@drawGL()
	
	###
	# Draw the texture containing the FITS image data
	###
	drawFITS: ->
		@gl.useProgram(@imgProgram)
		@gl.activeTexture(@gl.TEXTURE0)
		@gl.bindTexture(@gl.TEXTURE_2D, @imgTexture)
		@gl.bindBuffer(@gl.ARRAY_BUFFER, @texCoordBuffer)
		texCoordAttribute = @gl.getAttribLocation(@imgProgram, "aTextureCoord")
		@gl.enableVertexAttribArray(texCoordAttribute)
		@gl.vertexAttribPointer(texCoordAttribute, 2, @gl.FLOAT, false, 0, 0)
		@gl.uniform1i(@gl.getUniformLocation(@imgProgram, "texture"), 0)
		@gl.bindBuffer(@gl.ARRAY_BUFFER, @vertexBufferImg)
		vertexPosAttribute = @gl.getAttribLocation(@imgProgram, "aVertexPosition")
		@gl.enableVertexAttribArray(vertexPosAttribute)
		@gl.vertexAttribPointer(vertexPosAttribute, 2, @gl.FLOAT, false, 0, 0)
		@gl.drawArrays(@gl.TRIANGLE_STRIP, 0, 4)
	
	###
	# Draw the mouse coordinate readout and other messages
	###
	drawText: ->
		@gl.useProgram(@textProgram)
		
		# Mouse coordinates output
		elements = []
		coords = @screenToImageCoords(@mouseLast.x, @mouseLast.y)
		mouseXText = "x: " + (Math.round(coords.x*10)/10).toString()
		mouseYText = "y: " + (Math.round(coords.y*10)/10).toString()
		elements.push(new TextElement(5, 12, mouseXText))
		elements.push(new TextElement(5, 27, mouseYText))
		
		coords = @wcs.pix2sky(coords.x, coords.y)
		mouseAlphaText = "\u03B1: " + (Math.round(coords[0]*1000)/1000).toString()
		mouseDeltaText = "\u03B4: " + (Math.round(coords[1]*1000)/1000).toString()
		elements.push(new TextElement(55, 12, mouseAlphaText))
		elements.push(new TextElement(55, 27, mouseDeltaText))
		boxWidth = 120
		boxHeight = 40
		coordTextBox = new GlTextBox(elements, @gl.viewportWidth-boxWidth, @gl.viewportHeight-boxHeight, boxWidth, boxHeight)
		
		coordTextBox.draw(@gl, @textProgram, @screenToGlCoords)
		
		if @createAnno
			elements = []
			elements.push(new TextElement(5, 10, "Drag the mouse to create an annotation"))
			textBox = new GlTextBox(elements, 0, 0, 225, 20)
			textBox.draw(@gl, @textProgram, @screenToGlCoords)
		else if @selectAnno
			elements = []
			elements.push(new TextElement(5, 10, "Drag the mouse to select annotations"))
			textBox = new GlTextBox(elements, 0, 0, 225, 20)
			textBox.draw(@gl, @textProgram, @screenToGlCoords)
	
	###
	# Draw all annotations tracked by the annotation manager
	###
	drawAnnotations: ->
		@gl.useProgram(@annoProgram)
		
		for anno in @annotationManager.annotations
			verticesList = anno.getOutlineVertices()
			for vertices in verticesList
				vertices = @transformVertices(vertices)
				
				if anno.mouseOver
					colorV = new Float32Array([1.0, 0.0, 0.0, 1.0])
				else
					colorV = anno.getColorRGBA()
				color = new Float32Array(vertices.length*4)
				for i in [0..color.length-1] by 4
					color[i] = colorV[0]
					color[i+1] = colorV[1]
					color[i+2] = colorV[2]
					color[i+3] = colorV[3]
		
				colorAttribute = @gl.getAttribLocation(@annoProgram, "aColor")
				@gl.enableVertexAttribArray(colorAttribute)
				colorBuffer = @gl.createBuffer()
				@gl.bindBuffer(@gl.ARRAY_BUFFER, colorBuffer)
				@gl.bufferData(@gl.ARRAY_BUFFER, color, @gl.STATIC_DRAW)
				@gl.vertexAttribPointer(colorAttribute, 4, @gl.FLOAT, false, 0, 0)
				
				vertexBuffer = @gl.createBuffer()
				@gl.bindBuffer(@gl.ARRAY_BUFFER, vertexBuffer)
				vertexPosAttribute = @gl.getAttribLocation(@annoProgram, "aVertexPosition")
				@gl.bufferData(@gl.ARRAY_BUFFER, vertices, @gl.STATIC_DRAW)
				@gl.enableVertexAttribArray(vertexPosAttribute)
				@gl.vertexAttribPointer(vertexPosAttribute, 2, @gl.FLOAT, false, 0, 0)
				@gl.drawArrays(@gl.LINE_STRIP, 0, vertices.length/2)
			
			# Draw the handles and fill if the annotation is selected
			if anno.selected
				vertexBuffer = @gl.createBuffer()
				@gl.bindBuffer(@gl.ARRAY_BUFFER, vertexBuffer)
				vertexPosAttribute = @gl.getAttribLocation(@annoProgram, "aVertexPosition")
				vertices = @transformVertices(anno.getHandleVertices())
				@gl.bufferData(@gl.ARRAY_BUFFER, vertices, @gl.STATIC_DRAW)
				@gl.enableVertexAttribArray(vertexPosAttribute)
				@gl.vertexAttribPointer(vertexPosAttribute, 2, @gl.FLOAT, false, 0, 0)
				@gl.drawArrays(@gl.POINTS, 0, vertices.length/2)
			
				# Drop the alpha and draw the filled sections
				for i in [3..color.length-1] by 4
					color[i] = 0.2
				@gl.bindBuffer(@gl.ARRAY_BUFFER, colorBuffer)
				@gl.bufferData(@gl.ARRAY_BUFFER, color, @gl.STATIC_DRAW)
				@gl.vertexAttribPointer(colorAttribute, 4, @gl.FLOAT, false, 0, 0)
				@gl.bindBuffer(@gl.ARRAY_BUFFER, vertexBuffer)
				vertices = @transformVertices(anno.getFillVertices())
				@gl.bufferData(@gl.ARRAY_BUFFER, vertices, @gl.STATIC_DRAW)
				@gl.enableVertexAttribArray(vertexPosAttribute)
				@gl.vertexAttribPointer(vertexPosAttribute, 2, @gl.FLOAT, false, 0, 0)
			
				@gl.drawArrays(@gl.TRIANGLE_STRIP, 0, vertices.length/2)
	
	###
	# Clear the screen and draw the image, annotations and text
	###
	drawGL: ->
		@gl.clearColor(0.95, 0.95, 0.95, 1.0)
		@gl.viewport(0, 0, @gl.viewportWidth, @gl.viewportHeight)
		@gl.clear(@gl.COLOR_BUFFER_BIT)
		@gl.enable(@gl.BLEND);
		@gl.blendFunc(@gl.SRC_ALPHA, @gl.ONE_MINUS_SRC_ALPHA);
		
		@drawFITS()
		@drawAnnotations()
		@drawText()
		
	###
	# Adjust the offset based on how far the mouse was dragged and 
	# transform the coordinate system
	###
	translate: (dxPix, dyPix) ->
		@xTrans += dxPix/@gl.viewportWidth/@scale
		@yTrans += dyPix/@gl.viewportHeight/@scale
		
		@transformGL()
	
	###
	# Adjust the zoom based on mouse wheel movement and transform
	# the coordinate system
	###
	zoom: (delta) ->
		if delta > 0.0 then @scale *= 1.1 else @scale *= 0.9
		
		@transformGL()
	
	###
	# Update the pixel value extent in the FITS image shader program
	# val1 and val2 must be between 0 and 1
	###
	setExtent: (val1, val2) ->
		@gl.useProgram(@imgProgram)
		val1t = @extent[0]+(@extent[1]-@extent[0])*val1
		val2t = @extent[0]+(@extent[1]-@extent[0])*val2
		
		extentUniform = @gl.getUniformLocation(@imgProgram, "uExtent")
		@gl.uniform2f(extentUniform, val1t, val2t)
		@drawGL()
	
@Renderer = Renderer
@imgFragmentShaderSource = imgFragmentShaderSource
