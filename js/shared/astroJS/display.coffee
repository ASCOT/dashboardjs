define ['cs!/astroJS/fits', 'cs!/astroJS/WebGL'], (FITS, WebGL) ->

	programs = null
	program = null
	stretch = {value: 'linear'}

	gl = null
	ext = null
	vertexShader = null

	canvas = null
	hdu = null
	container = null
	viewportWidth = null
	viewportHeight = null
	xOffset = null
	xOldOffset = null
	yOffset = null
	yOldOffset = null
	fitsWidth = null
	fitsHeight = null
	scale = null
	startScale = null
	minScale = null
	maxScale = null
	drag = null
	xMouseDown = null
	yMouseDown = null
	
	header = null
	
	resetParameters = ->
		programs = null
		program = null
		stretch = {value: 'linear'}

		gl = null
		ext = null
		vertexShader = null

		canvas = null
		hdu = null
		container = null
		viewportWidth = null
		viewportHeight = null
		xOffset = null
		xOldOffset = null
		yOffset = null
		yOldOffset = null
		fitsWidth = null
		fitsHeight = null
		scale = null
		minScale = null
		maxScale = null
		drag = null
		xMouseDown = null
		yMouseDown = null
		
		header = null

	init1 = (buffer) ->
		resetParameters()
		
		readImageData(buffer)
		
	init2 = (_container, _viewportWidth, _viewportHeight) ->
		container = _container
		viewportWidth = _viewportWidth
		viewportHeight = _viewportHeight
		
		setupWebGL()
		setupWebGLUI()

	readImageData = (buffer) ->
		fits = new FITS.File(buffer)
		hdu = if fits.hdus[0].data is undefined then fits.hdus[1] else fits.hdus[0]
		header = hdu.header

		data = hdu.data
		[fitsWidth, fitsHeight] = [data.width, data.height]

		# Initialize a Float32Array for WebGL
		data.data = new Float32Array(fitsWidth * fitsHeight)
		
		data.getFrame()
		data.getExtremes()
		
	setupWebGL = ->
		canvas = WebGL.setupCanvas(container, viewportWidth, viewportHeight)
		# Set up variables for panning and zooming
		xOffset = -fitsWidth / 2
		yOffset = -fitsHeight / 2
		xOldOffset = xOffset
		yOldOffset = yOffset
		scale = 2 / fitsWidth
		minScale = 1 / (viewportWidth * viewportWidth)
		maxScale = 2
		drag = false

		canvas.onmousedown = (e) =>
			drag = true

			xOldOffset = xOffset
			yOldOffset = yOffset
			xMouseDown = e.clientX 
			yMouseDown = e.clientY

		canvas.onmouseup = (e) =>
			drag = false

			# Prevents a NaN from being sent to the GPU
			return null unless xMouseDown?

			xDelta = e.clientX - xMouseDown
			yDelta = e.clientY - yMouseDown
			xOffset = xOldOffset + (xDelta / canvas.width / scale * 2.0)
			yOffset = yOldOffset - (yDelta / viewportHeight / scale * 2.0)
			drawScene()

		canvas.onmousemove = (e) =>
			xDelta = -1 * (canvas.width / 2 - e.offsetX) / canvas.width / scale * 2.0
			yDelta = (viewportHeight / 2 - e.offsetY) / viewportHeight / scale * 2.0

			x = ((-1 * (xOffset + 0.5)) + xDelta) + 0.5 << 0
			y = ((-1 * (yOffset + 0.5)) + yDelta) + 0.5 << 0

			return unless drag

			xDelta = e.clientX - xMouseDown
			yDelta = e.clientY - yMouseDown

			xOffset = xOldOffset + (xDelta / canvas.width / scale * 2.0)
			yOffset = yOldOffset - (yDelta / viewportHeight / scale * 2.0)

			drawScene()

		canvas.onmouseout = (e) =>
			drag = false

		canvas.onmouseover = (e) =>
			drag = false

		# Listen for the mouse wheel
		canvas.addEventListener('mousewheel', wheelHandler, false)
		canvas.addEventListener('DOMMouseScroll', wheelHandler, false)

		gl = WebGL.create3DContext(canvas)
		ext = gl.getExtension('OES_texture_float')

		unless ext
			alert "No OES_texture_float"
			return null

		vertexShader = WebGL.loadShader(gl, WebGL.vertexShader, gl.VERTEX_SHADER)
		
	wheelHandler = (e) =>
		e.preventDefault()
		e.stopPropagation()
		factor = if e.wheelDelta > 0 then 1.1 else 1/1.1
		scale *= if (e.detail or e.wheelDelta) < 0 then factor else 1 / factor

		# Probably not the most efficient way to do this ...
		scale = if scale > maxScale then maxScale else scale
		scale = if scale < minScale then minScale else scale
		drawScene()
		
	setupWebGLUI = ->
		# Store parameters needed for rendering
		stretch = stretch.value
		minimum = hdu.data.min
		maximum = hdu.data.max

		unless programs?
			programs = {}

			# No programs so we make them
			for func in ['linear', 'logarithm', 'sqrt', 'power']
				fragmentShader  = WebGL.loadShader(gl, WebGL.fragmentShaders[func], gl.FRAGMENT_SHADER)
				programs[func] = WebGL.createProgram(gl, [vertexShader, fragmentShader])

			# Select and use a program
			program = programs[stretch]
			gl.useProgram(program)

			# Grab locations of WebGL program variables
			positionLocation    = gl.getAttribLocation(program, 'a_position')
			texCoordLocation    = gl.getAttribLocation(program, 'a_textureCoord')
			extremesLocation    = gl.getUniformLocation(program, 'u_extremes')
			offsetLocation      = gl.getUniformLocation(program, 'u_offset')
			scaleLocation       = gl.getUniformLocation(program, 'u_scale')

			texCoordBuffer = gl.createBuffer()
			gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]), gl.STATIC_DRAW)

			gl.enableVertexAttribArray(texCoordLocation)
			gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0)

			texture = gl.createTexture()
			gl.bindTexture(gl.TEXTURE_2D, texture)

			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

			# Pass the uniforms
			gl.uniform2f(extremesLocation, minimum, maximum)
			gl.uniform2f(offsetLocation, xOffset, yOffset)
			gl.uniform1f(scaleLocation, scale)

			buffer = gl.createBuffer()
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
			gl.enableVertexAttribArray(positionLocation)
			gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
			setRectangle(0, 0, fitsWidth, fitsHeight)
			gl.drawArrays(gl.TRIANGLES, 0, 6)

		# Update texture
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, fitsWidth, fitsHeight, 0, gl.LUMINANCE, gl.FLOAT, hdu.data.data)
		gl.drawArrays(gl.TRIANGLES, 0, 6)

	setRectangle = (x, y, fitsWidth, fitsHeight) ->
		[x1, x2] = [x, x + fitsWidth]
		[y1, y2] = [y, y + fitsHeight]
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]), gl.STATIC_DRAW)
		
	drawScene = ->
		gl.clearColor(0.9, 0.9, 0.9, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
		offsetLocation = gl.getUniformLocation(program, 'u_offset')
		scaleLocation = gl.getUniformLocation(program, 'u_scale')
		gl.uniform2f(offsetLocation, xOffset, yOffset)
		gl.uniform1f(scaleLocation, scale)
		setRectangle(0, 0, fitsWidth, fitsHeight)
		gl.drawArrays(gl.TRIANGLES, 0, 6)
		
	getCanvas = ->
		return canvas
		
	cursorToPix = (xCursor, yCursor) ->
		imgViewPixRatio = (2/scale)/viewportWidth	# Image pixels per screen pixel
		originalScale = (2/fitsWidth)
		currentImgWidth = viewportWidth*(scale/originalScale) # Width of the image at current zoom
		currentImgHeight = viewportHeight*(scale/originalScale) # Height of the image at current zoom
		
		imgShiftX = xOffset+(fitsWidth/2)	# X and Y shift of image at no zoom
		imgShiftY = yOffset+(fitsHeight/2)
		
		cursorXNative = ((xCursor+((currentImgWidth-viewportWidth)/2)) / viewportWidth / scale * 2) - imgShiftX
		cursorYNative = ((yCursor+((currentImgHeight-viewportHeight)/2)) / viewportHeight / scale * 2) + imgShiftY
		
		# Correct y coordinate for rectangular images
		cursorYNative += (fitsHeight-fitsWidth)/2
		return (x: cursorXNative, y: cursorYNative)
		
	pixToScreen = (xPix, yPix) ->
		# Correct y coordinate for rectangular images
		yPix -= (fitsHeight-fitsWidth)/2

		imgViewPixRatioWidth = (2/scale)/viewportWidth	# Image pixels per screen pixel
		imgViewPixRatioHeight = (2/scale)/viewportHeight
		originalScale = (2/fitsWidth)
		currentImgWidth = viewportWidth*(scale/originalScale) # Width of the image at current zoom
		currentImgHeight = viewportHeight*(scale/originalScale) # Height of the image at current zoom
		
		imgShiftX = xOffset+(fitsWidth/2)	# X and Y shift of image at no zoom
		imgShiftY = yOffset+(fitsHeight/2)
		
		screenX = (-(currentImgWidth-viewportWidth)/2) + ((imgShiftX+xPix)/imgViewPixRatioWidth)
		screenY = (-(currentImgHeight-viewportHeight)/2) + ((-imgShiftY+yPix)/imgViewPixRatioHeight)
		return (x: screenX, y: screenY)

	getHeader = ->
		return header
		
	changeStretch = (newStretch) ->
		stretch = newStretch
		program = programs[stretch]
		gl.useProgram(program)
		drawScene()
	
	changeExtremes = (e1, e2) ->
		extremesLocation = gl.getUniformLocation(program, 'u_extremes')
		gl.uniform2f(extremesLocation, e1, e2)
		gl.drawArrays(gl.TRIANGLES, 0, 6)
	
	getImageExtremes = ->
		dataMin = hdu.data.min
		dataMax = hdu.data.max
		
		if stretch is 'linear'
			return (minimum: dataMin, maximum: dataMax)
		else if stretch is 'logarithm'
			return (minimum: log(dataMin), maximum: log(dataMax))
		else if stretch is 'sqrt'
			return (minimum: sqrt(dataMin), maximum: sqrt(dataMax))
		else if stretch is 'power'
			return (minimum: pow(dataMin,2.0), maximum: pow(dataMax,2.0))
	
	getPixelValue = (xPix, yPix) ->
		return hdu.data.getPixel(parseInt(xPix), parseInt(yPix))
	return ( init1: init1, init2: init2, getCanvas: getCanvas , getHeader: getHeader, cursorToPix: cursorToPix, pixToScreen: pixToScreen, changeStretch: changeStretch, changeExtremes: changeExtremes, getImageExtremes: getImageExtremes, getPixelValue: getPixelValue)
	
