class AnnotationManager
	# propWindowCallback is a function that pulls up a dialog box
	# to edit properties of an annotation
	constructor: (@propWindowCallback, @gadgetAddAnno, @gadgetModifyAnno, @gadgetSelectAnnos)  ->
		@toolState = "panTool"
		@clickedObject = null
		@clear()
		
		@draggingHandle = false
	
	clear: ->
		@idCounter = 0
		@annotations = []
	
	setToolState: (val) ->
		@toolState = val
	
	# Create a new annotation based on annotation metadata
	addAnno: (anno) ->
		if anno.type == 'circle'
			newAnno = new Circle(anno.radius, @idCounter, anno.color, anno.xPos, anno.yPos)
		else if anno.type == 'ellipse'
			newAnno = new Ellipse(anno.a, anno.b, @idCounter, anno.color, anno.xPos, anno.yPos)
		else if anno.type == 'rectangle'
			newAnno = new Rectangle(anno.width, anno.height, @idCounter, anno.color, anno.xPos, anno.yPos)
		else if anno.type == 'annulus'
			newAnno = new Annulus(anno.r1, anno.r2, @idCounter, anno.color, anno.xPos, anno.yPos)
		else if anno.type == 'line'
			newAnno = new Line(anno.xPos, anno.yPos, anno.dx1, anno.dy1, anno.dx2, anno.dy2, @idCounter, anno.color)
		else if anno.type == 'vector'
			newAnno = new Vector(anno.xPos, anno.yPos, anno.dx1, anno.dy1, anno.dx2, anno.dy2, @idCounter,  anno.color)
		if anno.fromDs
			newAnno.fromDs = anno.fromDs
		@annotations.push(newAnno)
		@idCounter++
	
	removeAnnotation: (id) ->
		for anno in @annotations
			if anno.id == id
				i = @annotations.indexOf(anno)
				@annotations.splice(i, 1)
	
	selectAnnotation: (id) ->
		for anno in @annotations
			if anno.id == id then anno.selected = true
			else anno.selected = false
	
	getAnnotation: (id) ->
		for anno in @annotations
			if anno.id == id
				return anno
	
	getPlaceholder: ->
		return @getAnnotation(@idCounter)
	
	# Return the object that the mouse is currently over
	# Handles take precedence over annotations
	mouseOver: (mouseX, mouseY, scaleFactor) ->
		mousedOverAnno = null
		mousedOverHandle = null
		for anno in @annotations
			for handle in anno.handles
				if handle.isMouseOver(mouseX, mouseY, scaleFactor) and anno.selected
					mousedOverHandle = handle
			if anno.isMouseOver(mouseX, mouseY)
				anno.mouseOver = true
				mousedOverAnno = anno
			else
				anno.mouseOver = false
		
		if mousedOverHandle != null
			return mousedOverHandle
		else 
			return mousedOverAnno
	
	dblClick: (mouseX, mouseY) ->
		for anno in @annotations
			if anno.isMouseOver(mouseX, mouseY)
				if !anno.fromDs
					@propWindowCallback(anno.id, anno.getFields)
					return
	
	selectAnnoClick: (mouseX, mouseY) ->
		annoMeta = @createSelectAnnoMeta(mouseX, mouseY, 1, 1)
		@addAnno(annoMeta)
		@idCounter--
	
	createAnnoClick: (mouseX, mouseY) ->
		annoMeta = @createAnnoMeta(mouseX, mouseY, 1, 1)
		@addAnno(annoMeta)
		@idCounter--
	
	dragStartClick: (mouseX, mouseY, scaleFactor) ->
		@dragStart =
			x: mouseX
			y: mouseY
		@clickedObject = @mouseOver(mouseX, mouseY, scaleFactor)
		if @clickedObject instanceof Annotation
			if !@clickedObject.fromDs
				@selectAnnotation(@clickedObject.id)
			@clickedObject.drStart = x: mouseX-@clickedObject.xPos, y: mouseY-@clickedObject.yPos
		return @clickedObject
	
	# Construct an annotation metadata object based on a mouse drag and tool state
	createAnnoMeta: (xPos, yPos, dx, dy) ->
		dr = Math.sqrt(dx*dx+dy*dy)
		if @toolState == "circleTool"
			newAnno =
				type: 'circle'
				id: @idCounter
				color: 'green'
				radius: dr
				xPos: xPos
				yPos: yPos
		else if @toolState == "ellipseTool"
			newAnno =
				type: 'ellipse'
				id: @idCounter
				color: 'green'
				a: dx
				b: dy
				xPos: xPos
				yPos: yPos
		else if @toolState == "rectTool"
			newAnno =
				type: 'rectangle'
				id: @idCounter
				color: 'green'
				width: dx
				height: dy
				xPos: xPos
				yPos: yPos
		else if @toolState == "annulusTool"
			newAnno =
				type: 'annulus'
				id: @idCounter
				color: 'green'
				r1: dr/2.0
				r2: dr
				xPos: xPos
				yPos: yPos
		else if @toolState == "lineTool"
			newAnno =
				type: 'line'
				id: @idCounter
				color: 'green'
				xPos: xPos
				yPos: yPos
				dx1: 0
				dy1: 0
				dx2: dx
				dy2: dy
		else if @toolState == "vectorTool"
			newAnno =
				type: 'vector'
				id: @idCounter
				color: 'green'
				xPos: xPos
				yPos: yPos
				dx1: 0
				dy1: 0
				dx2: dx
				dy2: dy
		
		return newAnno
	
	createSelectAnnoMeta: (xPos, yPos, dx, dy) ->
		newAnno =
			type: 'rectangle'
			id: @idCounter
			color: 'green'
			width: dx
			height: dy
			xPos: xPos
			yPos: yPos
		
		return newAnno
	
	unclickSelectAnno: (mouseX, mouseY) ->
		@removeAnnotation(@idCounter)
		@gadgetSelectAnnos(@dragStart.x, @dragStart.y, mouseX, mouseY)
	
	# Create annotation metadata on mouse release and send it to the gadget state
	unclickCreateAnno: (mouseX, mouseY) ->
		dx = mouseX - @dragStart.x
		dy = mouseY - @dragStart.y
		
		newAnno = @createAnnoMeta(@dragStart.x, @dragStart.y, dx, dy)
		@gadgetAddAnno(newAnno)
	
	unclickDragAnno: (mouseX, mouseY) ->
		if @clickedObject.fromDs
			return
		
		dx = @dragStart.x - mouseX
		dy = @dragStart.y - mouseY
		dr = Math.sqrt(dx*dx+dy*dy)
		if dr > 10.0
			fields = ['xPos', 'yPos']
			values = [mouseX-@clickedObject.drStart.x, mouseY-@clickedObject.drStart.y]
			@gadgetModifyAnno(@clickedObject.id, fields, values)
	
	unclickDragHandle: (mouseX, mouseY) ->
		if @clickedObject.parent.fromDs
			return
		
		dx = @dragStart.x - mouseX
		dy = @dragStart.y - mouseY
		@clickedObject.dragFunc(@dragStart.x, @dragStart.y, mouseX, mouseY)
		
		fields = @clickedObject.parent.getFields()
		f = []
		v = []
		for field, val of fields.position
			f.push(field)
			v.push(val)
		for field, val of fields.dimensions
			f.push(field)
			v.push(val)
			
		@gadgetModifyAnno(@clickedObject.parent.id, f, v)

@AnnotationManager = AnnotationManager
