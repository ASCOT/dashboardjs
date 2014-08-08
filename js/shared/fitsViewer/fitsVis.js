(function() {
  var Annotation, AnnotationManager, Annulus, Circle, Ellipse, GlTextBox, Handle, Line, Rectangle, Renderer, TextElement, Vector, annoFragmentShaderSource, annoVertexShaderSource, imgFragmentShaderSource, imgVertexShaderSource, textFragmentShaderSource, textVertexShaderSource,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Annotation = (function() {

    function Annotation(id, xPos, yPos) {
      this.id = id;
      this.xPos = xPos;
      this.yPos = yPos;
      this.getFields = __bind(this.getFields, this);
      this.selected = false;
      this.mouseOver = false;
      this.isDragging = false;
      this.handles = [];
      this.color = "green";
    }

    Annotation.prototype.getColorRGBA = function() {
      if (this.color === "red") {
        return new Float32Array([1.0, 0.0, 0.0, 1.0]);
      } else if (this.color === "green") {
        return new Float32Array([0.0, 1.0, 0.0, 1.0]);
      } else if (this.color === "blue") {
        return new Float32Array([0.0, 0.0, 1.0, 1.0]);
      } else if (this.color === "yellow") {
        return new Float32Array([1.0, 1.0, 0.0, 1.0]);
      } else if (this.color === "grey") {
        return new Float32Array([0.8, 0.8, 0.8, 1.0]);
      }
    };

    Annotation.prototype.getOutlineVertices = function() {};

    Annotation.prototype.getFillVertices = function() {};

    Annotation.prototype.getHandleVertices = function() {
      var i, vertices, _ref;
      vertices = new Float32Array(this.handles.length * 2);
      for (i = 0, _ref = this.handles.length * 2; i < _ref; i += 2) {
        vertices[i] = this.handles[i / 2].xPos;
        vertices[i + 1] = this.handles[i / 2].yPos;
      }
      return vertices;
    };

    Annotation.prototype.setXpos = function(newX) {
      var handle, _i, _len, _ref;
      _ref = this.handles;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        handle = _ref[_i];
        handle.xPos += newX - this.xPos;
      }
      return this.xPos = newX;
    };

    Annotation.prototype.setYpos = function(newY) {
      var handle, _i, _len, _ref;
      _ref = this.handles;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        handle = _ref[_i];
        handle.yPos += newY - this.yPos;
      }
      return this.yPos = newY;
    };

    Annotation.prototype.isMouseOver = function(mouseX, mouseY) {};

    Annotation.prototype.dragFunc = function(xStart, yStart, xEnd, yEnd) {
      this.setXpos(xEnd - this.drStart.x);
      return this.setYpos(yEnd - this.drStart.y);
    };

    Annotation.prototype.newDrag = function(xStart, yStart, xEnd, yEnd) {};

    Annotation.prototype.getFields = function() {
      var fields;
      fields = {
        position: {
          xPos: this.xPos,
          yPos: this.yPos
        }
      };
      return fields;
    };

    return Annotation;

  })();

  /*
  # Represents a draggable handle on an annotation, which can be used to change
  # properties such as radius or width
  */

  Handle = (function() {

    function Handle(xPos, yPos, parent) {
      this.xPos = xPos;
      this.yPos = yPos;
      this.parent = parent;
      this.isDragging = false;
    }

    Handle.prototype.dragFunc = function(xStart, yStart, dx, dy) {};

    Handle.prototype.isMouseOver = function(mouseX, mouseY, scaleFactor) {
      var d, dx, dy;
      dx = mouseX - this.xPos;
      dy = mouseY - this.yPos;
      d = Math.sqrt((dx * dx) + (dy * dy));
      if (d < 5.0 * scaleFactor) return true;
      return false;
    };

    return Handle;

  })();

  AnnotationManager = (function() {

    function AnnotationManager(propWindowCallback, gadgetAddAnno, gadgetModifyAnno, gadgetSelectAnnos) {
      this.propWindowCallback = propWindowCallback;
      this.gadgetAddAnno = gadgetAddAnno;
      this.gadgetModifyAnno = gadgetModifyAnno;
      this.gadgetSelectAnnos = gadgetSelectAnnos;
      this.toolState = "panTool";
      this.clickedObject = null;
      this.clear();
      this.draggingHandle = false;
    }

    AnnotationManager.prototype.clear = function() {
      this.idCounter = 0;
      return this.annotations = [];
    };

    AnnotationManager.prototype.setToolState = function(val) {
      return this.toolState = val;
    };

    AnnotationManager.prototype.addAnno = function(anno) {
      var newAnno;
      if (anno.type === 'circle') {
        newAnno = new Circle(anno.radius, this.idCounter, anno.color, anno.xPos, anno.yPos);
      } else if (anno.type === 'ellipse') {
        newAnno = new Ellipse(anno.a, anno.b, this.idCounter, anno.color, anno.xPos, anno.yPos);
      } else if (anno.type === 'rectangle') {
        newAnno = new Rectangle(anno.width, anno.height, this.idCounter, anno.color, anno.xPos, anno.yPos);
      } else if (anno.type === 'annulus') {
        newAnno = new Annulus(anno.r1, anno.r2, this.idCounter, anno.color, anno.xPos, anno.yPos);
      } else if (anno.type === 'line') {
        newAnno = new Line(anno.xPos, anno.yPos, anno.dx1, anno.dy1, anno.dx2, anno.dy2, this.idCounter, anno.color);
      } else if (anno.type === 'vector') {
        newAnno = new Vector(anno.xPos, anno.yPos, anno.dx1, anno.dy1, anno.dx2, anno.dy2, this.idCounter, anno.color);
      }
      if (anno.fromDs) newAnno.fromDs = anno.fromDs;
      this.annotations.push(newAnno);
      return this.idCounter++;
    };

    AnnotationManager.prototype.removeAnnotation = function(id) {
      var anno, i, _i, _len, _ref, _results;
      _ref = this.annotations;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        anno = _ref[_i];
        if (anno.id === id) {
          i = this.annotations.indexOf(anno);
          _results.push(this.annotations.splice(i, 1));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    AnnotationManager.prototype.selectAnnotation = function(id) {
      var anno, _i, _len, _ref, _results;
      _ref = this.annotations;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        anno = _ref[_i];
        if (anno.id === id) {
          _results.push(anno.selected = true);
        } else {
          _results.push(anno.selected = false);
        }
      }
      return _results;
    };

    AnnotationManager.prototype.getAnnotation = function(id) {
      var anno, _i, _len, _ref;
      _ref = this.annotations;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        anno = _ref[_i];
        if (anno.id === id) return anno;
      }
    };

    AnnotationManager.prototype.getPlaceholder = function() {
      return this.getAnnotation(this.idCounter);
    };

    AnnotationManager.prototype.mouseOver = function(mouseX, mouseY, scaleFactor) {
      var anno, handle, mousedOverAnno, mousedOverHandle, _i, _j, _len, _len2, _ref, _ref2;
      mousedOverAnno = null;
      mousedOverHandle = null;
      _ref = this.annotations;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        anno = _ref[_i];
        _ref2 = anno.handles;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          handle = _ref2[_j];
          if (handle.isMouseOver(mouseX, mouseY, scaleFactor) && anno.selected) {
            mousedOverHandle = handle;
          }
        }
        if (anno.isMouseOver(mouseX, mouseY)) {
          anno.mouseOver = true;
          mousedOverAnno = anno;
        } else {
          anno.mouseOver = false;
        }
      }
      if (mousedOverHandle !== null) {
        return mousedOverHandle;
      } else {
        return mousedOverAnno;
      }
    };

    AnnotationManager.prototype.dblClick = function(mouseX, mouseY) {
      var anno, _i, _len, _ref;
      _ref = this.annotations;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        anno = _ref[_i];
        if (anno.isMouseOver(mouseX, mouseY)) {
          if (!anno.fromDs) {
            this.propWindowCallback(anno.id, anno.getFields);
            return;
          }
        }
      }
    };

    AnnotationManager.prototype.selectAnnoClick = function(mouseX, mouseY) {
      var annoMeta;
      annoMeta = this.createSelectAnnoMeta(mouseX, mouseY, 1, 1);
      this.addAnno(annoMeta);
      return this.idCounter--;
    };

    AnnotationManager.prototype.createAnnoClick = function(mouseX, mouseY) {
      var annoMeta;
      annoMeta = this.createAnnoMeta(mouseX, mouseY, 1, 1);
      this.addAnno(annoMeta);
      return this.idCounter--;
    };

    AnnotationManager.prototype.dragStartClick = function(mouseX, mouseY, scaleFactor) {
      this.dragStart = {
        x: mouseX,
        y: mouseY
      };
      this.clickedObject = this.mouseOver(mouseX, mouseY, scaleFactor);
      if (this.clickedObject instanceof Annotation) {
        if (!this.clickedObject.fromDs) {
          this.selectAnnotation(this.clickedObject.id);
        }
        this.clickedObject.drStart = {
          x: mouseX - this.clickedObject.xPos,
          y: mouseY - this.clickedObject.yPos
        };
      }
      return this.clickedObject;
    };

    AnnotationManager.prototype.createAnnoMeta = function(xPos, yPos, dx, dy) {
      var dr, newAnno;
      dr = Math.sqrt(dx * dx + dy * dy);
      if (this.toolState === "circleTool") {
        newAnno = {
          type: 'circle',
          id: this.idCounter,
          color: 'green',
          radius: dr,
          xPos: xPos,
          yPos: yPos
        };
      } else if (this.toolState === "ellipseTool") {
        newAnno = {
          type: 'ellipse',
          id: this.idCounter,
          color: 'green',
          a: dx,
          b: dy,
          xPos: xPos,
          yPos: yPos
        };
      } else if (this.toolState === "rectTool") {
        newAnno = {
          type: 'rectangle',
          id: this.idCounter,
          color: 'green',
          width: dx,
          height: dy,
          xPos: xPos,
          yPos: yPos
        };
      } else if (this.toolState === "annulusTool") {
        newAnno = {
          type: 'annulus',
          id: this.idCounter,
          color: 'green',
          r1: dr / 2.0,
          r2: dr,
          xPos: xPos,
          yPos: yPos
        };
      } else if (this.toolState === "lineTool") {
        newAnno = {
          type: 'line',
          id: this.idCounter,
          color: 'green',
          xPos: xPos,
          yPos: yPos,
          dx1: 0,
          dy1: 0,
          dx2: dx,
          dy2: dy
        };
      } else if (this.toolState === "vectorTool") {
        newAnno = {
          type: 'vector',
          id: this.idCounter,
          color: 'green',
          xPos: xPos,
          yPos: yPos,
          dx1: 0,
          dy1: 0,
          dx2: dx,
          dy2: dy
        };
      }
      return newAnno;
    };

    AnnotationManager.prototype.createSelectAnnoMeta = function(xPos, yPos, dx, dy) {
      var newAnno;
      newAnno = {
        type: 'rectangle',
        id: this.idCounter,
        color: 'green',
        width: dx,
        height: dy,
        xPos: xPos,
        yPos: yPos
      };
      return newAnno;
    };

    AnnotationManager.prototype.unclickSelectAnno = function(mouseX, mouseY) {
      this.removeAnnotation(this.idCounter);
      return this.gadgetSelectAnnos(this.dragStart.x, this.dragStart.y, mouseX, mouseY);
    };

    AnnotationManager.prototype.unclickCreateAnno = function(mouseX, mouseY) {
      var dx, dy, newAnno;
      dx = mouseX - this.dragStart.x;
      dy = mouseY - this.dragStart.y;
      newAnno = this.createAnnoMeta(this.dragStart.x, this.dragStart.y, dx, dy);
      return this.gadgetAddAnno(newAnno);
    };

    AnnotationManager.prototype.unclickDragAnno = function(mouseX, mouseY) {
      var dr, dx, dy, fields, values;
      if (this.clickedObject.fromDs) return;
      dx = this.dragStart.x - mouseX;
      dy = this.dragStart.y - mouseY;
      dr = Math.sqrt(dx * dx + dy * dy);
      if (dr > 10.0) {
        fields = ['xPos', 'yPos'];
        values = [mouseX - this.clickedObject.drStart.x, mouseY - this.clickedObject.drStart.y];
        return this.gadgetModifyAnno(this.clickedObject.id, fields, values);
      }
    };

    AnnotationManager.prototype.unclickDragHandle = function(mouseX, mouseY) {
      var dx, dy, f, field, fields, v, val, _ref, _ref2;
      if (this.clickedObject.parent.fromDs) return;
      dx = this.dragStart.x - mouseX;
      dy = this.dragStart.y - mouseY;
      this.clickedObject.dragFunc(this.dragStart.x, this.dragStart.y, mouseX, mouseY);
      fields = this.clickedObject.parent.getFields();
      f = [];
      v = [];
      _ref = fields.position;
      for (field in _ref) {
        val = _ref[field];
        f.push(field);
        v.push(val);
      }
      _ref2 = fields.dimensions;
      for (field in _ref2) {
        val = _ref2[field];
        f.push(field);
        v.push(val);
      }
      return this.gadgetModifyAnno(this.clickedObject.parent.id, f, v);
    };

    return AnnotationManager;

  })();

  this.AnnotationManager = AnnotationManager;

  Annulus = (function(_super) {

    __extends(Annulus, _super);

    Annulus.prototype.numPoints = 20;

    function Annulus(r1, r2, id, color, xPos, yPos) {
      this.getFields = __bind(this.getFields, this);
      var _this = this;
      Annulus.__super__.constructor.apply(this, arguments);
      this.r1 = r1;
      this.r2 = r2;
      this.id = id;
      this.color = color;
      this.xPos = xPos;
      this.yPos = yPos;
      this.handles = [new Handle(this.xPos + this.r1, this.yPos, this), new Handle(this.xPos + this.r2, this.yPos, this)];
      this.handles[0].dragFunc = function(xStart, yStart, xEnd, yEnd) {
        var dx;
        dx = xEnd - _this.xPos;
        return _this.setR1(dx);
      };
      this.handles[1].dragFunc = function(xStart, yStart, xEnd, yEnd) {
        var dx;
        dx = xEnd - _this.xPos;
        return _this.setR2(dx);
      };
    }

    Annulus.prototype.getOutlineVertices = function() {
      var index, theta, vInner, vOuter, x, y, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
      vInner = new Float32Array(this.numPoints * 2 + 2);
      index = 0;
      for (theta = _ref = -Math.PI / 2.0, _ref2 = 3.0 * Math.PI / 2.0, _ref3 = 2.0 * Math.PI / this.numPoints; _ref <= _ref2 ? theta <= _ref2 : theta >= _ref2; theta += _ref3) {
        x = this.r1 * Math.cos(theta);
        y = this.r1 * Math.sin(theta);
        vInner[index] = x + this.xPos;
        vInner[index + 1] = y + this.yPos;
        index += 2;
      }
      vInner[index] = vInner[0];
      vInner[index + 1] = vInner[1];
      index += 2;
      vOuter = new Float32Array(this.numPoints * 2 + 2);
      index = 0;
      for (theta = _ref4 = -Math.PI / 2.0, _ref5 = 3.0 * Math.PI / 2.0, _ref6 = 2.0 * Math.PI / this.numPoints; _ref4 <= _ref5 ? theta <= _ref5 : theta >= _ref5; theta += _ref6) {
        x = this.r2 * Math.cos(theta);
        y = this.r2 * Math.sin(theta);
        vOuter[index] = x + this.xPos;
        vOuter[index + 1] = y + this.yPos;
        index += 2;
      }
      vOuter[index] = vOuter[0];
      vOuter[index + 1] = vOuter[1];
      index += 2;
      return [vInner, vOuter];
    };

    Annulus.prototype.getFillVertices = function() {
      var index, theta, vertices, x1, x2, y1, y2, _ref, _ref2, _ref3;
      vertices = new Float32Array(this.numPoints * 4 + 4);
      index = 0;
      for (theta = _ref = -Math.PI / 2.0, _ref2 = 3.0 * Math.PI / 2.0, _ref3 = 2.0 * Math.PI / this.numPoints; _ref <= _ref2 ? theta <= _ref2 : theta >= _ref2; theta += _ref3) {
        x1 = this.r1 * Math.cos(theta);
        y1 = this.r1 * Math.sin(theta);
        x2 = this.r2 * Math.cos(theta);
        y2 = this.r2 * Math.sin(theta);
        vertices[index] = x1 + this.xPos;
        vertices[index + 1] = y1 + this.yPos;
        vertices[index + 2] = x2 + this.xPos;
        vertices[index + 3] = y2 + this.yPos;
        index += 4;
      }
      vertices[vertices.length - 4] = vertices[0];
      vertices[vertices.length - 3] = vertices[1];
      vertices[vertices.length - 2] = vertices[2];
      vertices[vertices.length - 1] = vertices[3];
      return vertices;
    };

    Annulus.prototype.getHandleVertices = function() {
      var vertices;
      vertices = new Float32Array([this.xPos + this.r1, this.yPos, this.xPos + this.r2, this.yPos]);
      return vertices;
    };

    Annulus.prototype.isMouseOver = function(mouseX, mouseY) {
      var dist, dx, dy;
      dx = mouseX - this.xPos;
      dy = mouseY - this.yPos;
      dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.r2 && dist > this.r1) return true;
      return false;
    };

    Annulus.prototype.setR1 = function(r1) {
      if (r1 > this.r2 || r1 < 0) return;
      this.handles[0].xPos = this.xPos + r1;
      return this.r1 = r1;
    };

    Annulus.prototype.setR2 = function(r2) {
      if (r2 < this.r1) return;
      this.handles[1].xPos = this.xPos + r2;
      return this.r2 = r2;
    };

    Annulus.prototype.newDrag = function(xStart, yStart, xEnd, yEnd) {
      var dx, dy, r;
      dx = xEnd - xStart;
      dy = yEnd - yStart;
      r = Math.sqrt((dx * dx) + (dy * dy));
      this.setR1(r / 2.0);
      return this.setR2(r);
    };

    Annulus.prototype.getFields = function() {
      var fields;
      fields = {
        position: {
          xPos: this.xPos,
          yPos: this.yPos
        },
        dimensions: {
          r1: this.r1,
          r2: this.r2
        }
      };
      return fields;
    };

    return Annulus;

  })(Annotation);

  Circle = (function(_super) {

    __extends(Circle, _super);

    Circle.prototype.numPoints = 20;

    function Circle(radius, id, color, xPos, yPos) {
      this.setValues = __bind(this.setValues, this);
      this.getFields = __bind(this.getFields, this);
      var _this = this;
      Circle.__super__.constructor.apply(this, arguments);
      this.radius = radius;
      this.id = id;
      this.color = color;
      this.xPos = xPos;
      this.yPos = yPos;
      this.handles = [new Handle(this.xPos + this.radius, this.yPos, this)];
      this.handles[0].dragFunc = function(xStart, yStart, xEnd, yEnd) {
        var dx, dy, r;
        dx = xEnd - _this.xPos;
        dy = yEnd - _this.yPos;
        r = Math.sqrt((dx * dx) + (dy * dy));
        return _this.setRadius(r);
      };
    }

    Circle.prototype.getOutlineVertices = function() {
      var index, theta, vertices, x, y, _ref, _ref2, _ref3;
      vertices = new Float32Array(this.numPoints * 2 + 2);
      index = 0;
      for (theta = _ref = -Math.PI / 2.0, _ref2 = 3.0 * Math.PI / 2.0, _ref3 = 2.0 * Math.PI / this.numPoints; _ref <= _ref2 ? theta <= _ref2 : theta >= _ref2; theta += _ref3) {
        x = this.radius * Math.cos(theta);
        y = this.radius * Math.sin(theta);
        vertices[index] = x + this.xPos;
        vertices[index + 1] = y + this.yPos;
        index += 2;
      }
      vertices[vertices.length - 2] = vertices[0];
      vertices[vertices.length - 1] = vertices[1];
      return [vertices];
    };

    Circle.prototype.getFillVertices = function() {
      var index, theta, vertices, x, y, _ref, _ref2, _ref3;
      vertices = new Float32Array(this.numPoints * 2 + 2);
      index = 0;
      for (theta = _ref = -Math.PI / 2.0, _ref2 = Math.PI / 2.0, _ref3 = 2.0 * Math.PI / this.numPoints; _ref <= _ref2 ? theta <= _ref2 : theta >= _ref2; theta += _ref3) {
        x = this.radius * Math.cos(theta);
        y = this.radius * Math.sin(theta);
        vertices[index] = x + this.xPos;
        vertices[index + 1] = y + this.yPos;
        vertices[index + 2] = -x + this.xPos;
        vertices[index + 3] = y + this.yPos;
        index += 4;
      }
      vertices[vertices.length - 2] = this.xPos;
      vertices[vertices.length - 1] = this.yPos + this.radius;
      return vertices;
    };

    Circle.prototype.setRadius = function(newR) {
      var handle, _i, _len, _ref;
      _ref = this.handles;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        handle = _ref[_i];
        handle.xPos = this.xPos + newR;
      }
      return this.radius = newR;
    };

    Circle.prototype.isMouseOver = function(mouseX, mouseY) {
      var dist, dx, dy;
      dx = mouseX - this.xPos;
      dy = mouseY - this.yPos;
      dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.radius) return true;
      return false;
    };

    Circle.prototype.newDrag = function(xStart, yStart, xEnd, yEnd) {
      var dx, dy, r;
      dx = xEnd - xStart;
      dy = yEnd - yStart;
      r = Math.sqrt((dx * dx) + (dy * dy));
      return this.setRadius(r);
    };

    Circle.prototype.getFields = function() {
      var fields;
      fields = {
        position: {
          xPos: this.xPos,
          yPos: this.yPos
        },
        dimensions: {
          radius: this.radius
        }
      };
      return fields;
    };

    Circle.prototype.setValues = function(values) {
      this.setXpos(values.xPos);
      this.setYpos(values.yPos);
      return this.setRadius(values.radius);
    };

    return Circle;

  })(Annotation);

  Ellipse = (function(_super) {

    __extends(Ellipse, _super);

    Ellipse.prototype.numPoints = 20;

    function Ellipse(a, b, id, color, xPos, yPos) {
      this.setValues = __bind(this.setValues, this);
      this.getFields = __bind(this.getFields, this);
      var _this = this;
      Ellipse.__super__.constructor.apply(this, arguments);
      this.a = a;
      this.b = b;
      this.id = id;
      this.color = color;
      this.xPos = xPos;
      this.yPos = yPos;
      this.handles = [new Handle(this.xPos + this.a, this.yPos, this), new Handle(this.xPos, this.yPos - this.b, this)];
      this.handles[0].dragFunc = function(xStart, yStart, xEnd, yEnd) {
        var dx;
        dx = xEnd - _this.xPos;
        return _this.setA(dx);
      };
      this.handles[1].dragFunc = function(xStart, yStart, xEnd, yEnd) {
        var dy;
        dy = yEnd - _this.yPos;
        return _this.setB(dy);
      };
    }

    Ellipse.prototype.getOutlineVertices = function() {
      var index, theta, vertices, x, y, _ref, _ref2, _ref3;
      vertices = new Float32Array(this.numPoints * 2 + 2);
      index = 0;
      for (theta = _ref = -Math.PI / 2.0, _ref2 = 3.0 * Math.PI / 2.0, _ref3 = 2.0 * Math.PI / this.numPoints; _ref <= _ref2 ? theta <= _ref2 : theta >= _ref2; theta += _ref3) {
        x = this.a * Math.cos(theta);
        y = this.b * Math.sin(theta);
        vertices[index] = x + this.xPos;
        vertices[index + 1] = y + this.yPos;
        index += 2;
      }
      vertices[vertices.length - 2] = vertices[0];
      vertices[vertices.length - 1] = vertices[1];
      return [vertices];
    };

    Ellipse.prototype.getFillVertices = function() {
      var index, theta, vertices, x, y, _ref, _ref2, _ref3;
      vertices = new Float32Array(this.numPoints * 2 + 2);
      index = 0;
      for (theta = _ref = -Math.PI / 2.0, _ref2 = Math.PI / 2.0, _ref3 = 2.0 * Math.PI / this.numPoints; _ref <= _ref2 ? theta <= _ref2 : theta >= _ref2; theta += _ref3) {
        x = this.a * Math.cos(theta);
        y = this.b * Math.sin(theta);
        vertices[index] = x + this.xPos;
        vertices[index + 1] = y + this.yPos;
        vertices[index + 2] = -x + this.xPos;
        vertices[index + 3] = y + this.yPos;
        index += 4;
      }
      vertices[vertices.length - 2] = this.xPos;
      vertices[vertices.length - 1] = this.yPos + this.b;
      return vertices;
    };

    Ellipse.prototype.setA = function(newA) {
      this.handles[0].xPos = this.xPos + newA;
      return this.a = newA;
    };

    Ellipse.prototype.setB = function(newB) {
      this.handles[1].yPos = this.yPos + newB;
      return this.b = newB;
    };

    Ellipse.prototype.isMouseOver = function(mouseX, mouseY) {
      var val;
      val = (mouseX - this.xPos) * (mouseX - this.xPos) / (this.a * this.a) + (mouseY - this.yPos) * (mouseY - this.yPos) / (this.b * this.b);
      if (val <= 1.0) return true;
      return false;
    };

    Ellipse.prototype.newDrag = function(xStart, yStart, xEnd, yEnd) {
      var dx, dy;
      dx = xEnd - xStart;
      dy = yEnd - yStart;
      this.setA(dx);
      return this.setB(dy);
    };

    Ellipse.prototype.getFields = function() {
      var fields;
      fields = {
        position: {
          xPos: this.xPos,
          yPos: this.yPos
        },
        dimensions: {
          a: this.a,
          b: this.b
        }
      };
      return fields;
    };

    Ellipse.prototype.setValues = function(values) {
      this.setXpos(values.xPos);
      this.setYpos(values.yPos);
      this.setA(values.a);
      return this.setB(values.b);
    };

    return Ellipse;

  })(Annotation);

  annoVertexShaderSource = ["attribute vec2 aVertexPosition;", "attribute vec4 aColor;", "uniform mat4 uMVMatrix;", "varying vec4 vColor;", "void main() {", "gl_PointSize = 5.0;", "gl_Position = uMVMatrix * vec4(aVertexPosition, 0.0, 1.0);", "vColor = aColor;", "}"].join("\n");

  textVertexShaderSource = ["attribute vec2 aVertexPosition;", "attribute vec2 aTextureCoord;", "varying highp vec2 vTextureCoord;", "void main() {", "gl_Position = vec4(aVertexPosition, 0.0, 1.0);", "vTextureCoord = aTextureCoord;", "}"].join("\n");

  imgVertexShaderSource = ["attribute vec2 aVertexPosition;", "attribute vec2 aTextureCoord;", "uniform mat4 uMVMatrix;", "varying highp vec2 vTextureCoord;", "void main() {", "gl_Position = uMVMatrix * vec4(aVertexPosition, 0.0, 1.0);", "vTextureCoord = aTextureCoord;", "}"].join("\n");

  annoFragmentShaderSource = ["precision highp float;", "varying vec4 vColor;", "void main() {", "gl_FragColor = vColor;", "}"].join("\n");

  textFragmentShaderSource = ["varying highp vec2 vTextureCoord;", "uniform sampler2D texture;", "void main() {", "gl_FragColor = texture2D(texture, vTextureCoord);", "}"].join("\n");

  imgFragmentShaderSource = {
    'linear': ["varying highp vec2 vTextureCoord;", "uniform sampler2D texture;", "uniform highp vec2 uExtent;", "void main() {", "highp vec4 color = texture2D(texture, vTextureCoord);", "highp float min = uExtent[0];", "highp float max = uExtent[1];", "highp float val = (color.r - min)/(max - min);", "gl_FragColor = vec4(val, val, val, 1.0);", "}"].join("\n"),
    'log': ["varying highp vec2 vTextureCoord;", "uniform sampler2D texture;", "uniform highp vec2 uExtent;", "void main() {", "highp vec4 color = texture2D(texture, vTextureCoord);", "highp float min = uExtent[0];", "highp float max = uExtent[1];", "highp float linearVal = (color.r - min)/(max - min);", "highp float val = log(1.0+1000.0*linearVal)/log(1000.0);", "gl_FragColor = vec4(val, val, val, 1.0);", "}"].join("\n"),
    'power': ["varying highp vec2 vTextureCoord;", "uniform sampler2D texture;", "uniform highp vec2 uExtent;", "void main() {", "highp vec4 color = texture2D(texture, vTextureCoord);", "highp float min = uExtent[0];", "highp float max = uExtent[1];", "highp float linearVal = (color.r - min)/(max - min);", "highp float val = (pow(1000.0, linearVal) - 1.0)/1000.0;", "gl_FragColor = vec4(val, val, val, 1.0);", "}"].join("\n"),
    'sqrt': ["varying highp vec2 vTextureCoord;", "uniform sampler2D texture;", "uniform highp vec2 uExtent;", "void main() {", "highp vec4 color = texture2D(texture, vTextureCoord);", "highp float min = uExtent[0];", "highp float max = uExtent[1];", "highp float linearVal = (color.r - min)/(max - min);", "highp float val = sqrt(linearVal);", "gl_FragColor = vec4(val, val, val, 1.0);", "}"].join("\n"),
    'squared': ["varying highp vec2 vTextureCoord;", "uniform sampler2D texture;", "uniform highp vec2 uExtent;", "void main() {", "highp vec4 color = texture2D(texture, vTextureCoord);", "highp float min = uExtent[0];", "highp float max = uExtent[1];", "highp float linearVal = (color.r - min)/(max - min);", "highp float val = linearVal*linearVal;", "gl_FragColor = vec4(val, val, val, 1.0);", "}"].join("\n"),
    'asinh': ["varying highp vec2 vTextureCoord;", "uniform sampler2D texture;", "uniform highp vec2 uExtent;", "highp float asinh(highp float val) {", "highp float tmp = val + sqrt(1.0 + val*val);", "return log(tmp);", "}", "void main() {", "highp vec4 color = texture2D(texture, vTextureCoord);", "highp float min = uExtent[0];", "highp float max = uExtent[1];", "highp float linearVal = (color.r - min)/(max - min);", "highp float val = asinh(linearVal);", "gl_FragColor = vec4(val, val, val, 1.0);", "}"].join("\n"),
    'sinh': ["varying highp vec2 vTextureCoord;", "uniform sampler2D texture;", "uniform highp vec2 uExtent;", "highp float sinh(highp float val) {", "highp float tmp = exp(val);", "return (tmp - 1.0 / tmp) / 2.0;", "}", "void main() {", "highp vec4 color = texture2D(texture, vTextureCoord);", "highp float min = uExtent[0];", "highp float max = uExtent[1];", "highp float linearVal = (color.r - min)/(max - min);", "highp float val = sinh(linearVal);", "gl_FragColor = vec4(val, val, val, 1.0);", "}"].join("\n")
  };

  Renderer = (function() {
    /*
    	# Grab a gl context, setup the canvas event handlers and load the image data into a texture
    	# Parameters:
    	#		annotationManager - Annotation manager object from which to gather data to draw annotations
    	#							 canvas - The HTML5 canvas object onto which the image will be drawn
    	#							stretch - A string specifying the stretch program to use when the image is drawn
    	# 				 imageState - Object containing pixel data, dimensions and extent
    	#									wcs - Initialized wcs object to convert between pixel and sky coordinates
    */
    function Renderer(annotationManager, canvas, stretch, imageState, wcs) {
      this.annotationManager = annotationManager;
      this.screenToGlCoords = __bind(this.screenToGlCoords, this);
      this.imageToGlCoords = __bind(this.imageToGlCoords, this);
      this.initEventHandlers = __bind(this.initEventHandlers, this);
      this.imageWidth = imageState.width;
      this.imageHeight = imageState.height;
      this.extent = imageState.extent;
      this.imageData = imageState.data;
      this.wcs = wcs;
      this.gl = canvas.getContext('webgl');
      this.gl.getExtension('OES_texture_float');
      this.initViewport(canvas);
    }

    Renderer.prototype.initViewport = function() {
      this.gl.viewportWidth = canvas.width;
      this.gl.viewportHeight = canvas.height;
      this.mouseDownLast = {
        x: 0.0,
        y: 0.0
      };
      this.mouseLast = {
        x: 0.0,
        y: 0.0
      };
      this.createAnno = false;
      this.dragAnno = false;
      this.dragHandle = false;
      this.xTrans = 0.0;
      this.yTrans = 0.0;
      this.scale = 1.0;
      this.initEventHandlers(canvas);
      return this.initGL(stretch);
    };

    /*
    	# Setup the canvas event handlers
    	# Click and drag to pan the image
    	# Mouse wheel changes the zoom
    	# Mouse movement updates the coordinate readout
    */

    Renderer.prototype.initEventHandlers = function(canvas) {
      var _this = this;
      canvas.addEventListener("contextmenu", function(e) {
        return e.preventDefault();
      });
      canvas.addEventListener("dblclick", function(e) {
        var imgCoords;
        imgCoords = _this.screenToImageCoords(e.offsetX, e.offsetY);
        return _this.annotationManager.dblClick(imgCoords.x, imgCoords.y);
      });
      canvas.addEventListener("mousedown", function(e) {
        var clickTarget, imgCoords;
        if (e.button === 0) {
          _this.leftMouseDown = true;
          imgCoords = _this.screenToImageCoords(e.offsetX, e.offsetY);
          _this.mouseDownLast = {
            x: imgCoords.x,
            y: imgCoords.y
          };
          clickTarget = _this.annotationManager.dragStartClick(imgCoords.x, imgCoords.y, _this.startScale / _this.scale);
          if (_this.selectAnno) {
            _this.annotationManager.selectAnnoClick(imgCoords.x, imgCoords.y);
          } else if (_this.createAnno) {
            _this.annotationManager.createAnnoClick(imgCoords.x, imgCoords.y);
          } else if (clickTarget !== null) {
            if (clickTarget instanceof Annotation) {
              _this.dragAnno = true;
            } else if (clickTarget instanceof Handle) {
              _this.dragHandle = true;
            }
          }
          return _this.drawGL();
        }
      });
      canvas.addEventListener("mouseup", function(e) {
        var imgCoords;
        if (e.button === 0) {
          _this.leftMouseDown = false;
          imgCoords = _this.screenToImageCoords(e.offsetX, e.offsetY);
          if (_this.selectAnno) {
            _this.annotationManager.unclickSelectAnno(imgCoords.x, imgCoords.y);
            _this.selectAnno = false;
          } else if (_this.createAnno) {
            _this.annotationManager.unclickCreateAnno(imgCoords.x, imgCoords.y);
            _this.createAnno = false;
          } else if (_this.dragAnno) {
            _this.annotationManager.unclickDragAnno(imgCoords.x, imgCoords.y);
            _this.dragAnno = false;
          } else if (_this.dragHandle) {
            _this.annotationManager.unclickDragHandle(imgCoords.x, imgCoords.y);
            _this.dragHandle = false;
          }
          return _this.drawGL();
        }
      });
      canvas.addEventListener("mouseout", function() {
        return _this.leftMouseDown = false;
      });
      canvas.addEventListener("mousewheel", function(e) {
        e.preventDefault();
        return _this.zoom(e.wheelDelta / 120);
      });
      return canvas.addEventListener("mousemove", function(e) {
        var imgCoords;
        imgCoords = _this.screenToImageCoords(e.offsetX, e.offsetY);
        if (_this.leftMouseDown) {
          if (_this.createAnno || _this.selectAnno) {
            _this.annotationManager.getPlaceholder().newDrag(_this.mouseDownLast.x, _this.mouseDownLast.y, imgCoords.x, imgCoords.y);
          } else if (_this.dragAnno) {
            if (!_this.annotationManager.clickedObject.fromDs) {
              _this.annotationManager.clickedObject.dragFunc(_this.mouseDownLast.x, _this.mouseDownLast.y, imgCoords.x, imgCoords.y);
            }
          } else if (_this.dragHandle) {
            if (!_this.annotationManager.clickedObject.parent.fromDs) {
              _this.annotationManager.clickedObject.dragFunc(_this.mouseDownLast.x, _this.mouseDownLast.y, imgCoords.x, imgCoords.y);
            }
          } else {
            _this.translate(e.offsetX - _this.mouseLast.x, _this.mouseLast.y - e.offsetY);
          }
        } else {
          imgCoords = _this.screenToImageCoords(e.offsetX, e.offsetY);
          _this.annotationManager.mouseOver(imgCoords.x, imgCoords.y, _this.startScale / _this.scale);
        }
        _this.mouseLast = {
          x: e.offsetX,
          y: e.offsetY
        };
        return _this.drawGL();
      });
    };

    Renderer.prototype.enableCreateAnno = function(mode) {
      this.createAnno = true;
      this.selectAnno = false;
      return this.annotationManager.setToolState(mode);
    };

    Renderer.prototype.enableSelectAnno = function(mode) {
      this.selectAnno = true;
      this.createAnno = false;
      return this.annotationManager.setToolState(mode);
    };

    /*
    	# Convert canvas mouse coordinates to FITS image pixel coordinates
    */

    Renderer.prototype.screenToImageCoords = function(screenX, screenY) {
      var imgX, imgY;
      imgX = (screenX - (this.xTrans / 2.0 * this.gl.viewportWidth * this.scale) - ((this.gl.viewportWidth / 2.0) * (1 - this.scale))) * this.startScale / this.scale;
      imgY = this.imageHeight - ((this.yTrans / 2.0 * this.gl.viewportHeight * this.scale) - ((this.gl.viewportHeight / 2.0) * (1 - this.scale)) + screenY) * this.startScale / this.scale;
      return {
        x: imgX,
        y: imgY
      };
    };

    /*
    	# Convert FITS image pixel coordinates to GL coordinates
    */

    Renderer.prototype.imageToGlCoords = function(imageX, imageY) {
      var glX, glY;
      glX = (imageX / this.imageWidth * 2.0) - 1.0;
      glY = (imageY / this.imageHeight * 2.0) - 1.0;
      return {
        x: glX,
        y: glY
      };
    };

    /*
    	# Convert canvas mouse coordinates to GL coordinates
    */

    Renderer.prototype.screenToGlCoords = function(screenX, screenY) {
      var glX, glY;
      glX = (screenX / this.gl.viewportWidth * 2.0) - 1.0;
      glY = (screenY / this.gl.viewportHeight * 2.0) - 1.0;
      return {
        x: glX,
        y: glY
      };
    };

    /*
    	# Transform a list of vertices from image pixel coordinates to GL coordinates
    */

    Renderer.prototype.transformVertices = function(vertices) {
      var i, transCoord, transformed, _ref;
      transformed = new Float32Array(vertices.length);
      for (i = 0, _ref = vertices.length - 1; i <= _ref; i += 2) {
        transCoord = this.imageToGlCoords(vertices[i], vertices[i + 1]);
        transformed[i] = transCoord.x;
        transformed[i + 1] = transCoord.y;
      }
      return transformed;
    };

    /*
    	# Compile a shader object from source
    */

    Renderer.prototype.loadShader = function(source, type) {
      var compLog, compiled, shader;
      shader = this.gl.createShader(type);
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);
      compiled = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
      if (!compiled) {
        compLog = this.gl.getShaderInfoLog(shader);
        throw "Error compiling shader " + shader + ": " + compLog;
        this.gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    /*
    	# Assemble a vertex and fragment shader into a program
    */

    Renderer.prototype.createProgram = function(vertexShader, fragmentShader) {
      var errorLog, linked, program;
      program = this.gl.createProgram();
      this.gl.attachShader(program, vertexShader);
      this.gl.attachShader(program, fragmentShader);
      this.gl.linkProgram(program);
      linked = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
      if (!linked) {
        errorLog = this.gl.getProgramInfoLog(program);
        throw "Error in program linking: " + errorLog;
        return null;
      }
      return program;
    };

    /*
    	# Generate shader programs for the image data, text boxes, and annotations
    	# Also generate a texture from the image data
    */

    Renderer.prototype.initGL = function(stretch) {
      var extentUniform, fragmentShader, hwRatio, mvMatrix, textureCoords, uMVMatrix, vertexShader, vertices;
      vertexShader = this.loadShader(imgVertexShaderSource, this.gl.VERTEX_SHADER);
      fragmentShader = this.loadShader(imgFragmentShaderSource[stretch], this.gl.FRAGMENT_SHADER);
      this.imgProgram = this.createProgram(vertexShader, fragmentShader);
      this.gl.useProgram(this.imgProgram);
      extentUniform = this.gl.getUniformLocation(this.imgProgram, "uExtent");
      this.gl.uniform2f(extentUniform, this.extent[0], this.extent[1]);
      this.texCoordBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
      textureCoords = new Float32Array([0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0]);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, textureCoords, this.gl.STATIC_DRAW);
      this.vertexBufferImg = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBufferImg);
      hwRatio = this.imageHeight / this.imageWidth;
      if (hwRatio < (this.gl.viewportHeight / this.gl.viewportWidth)) {
        this.startScale = this.imageWidth / this.gl.viewportWidth;
        vertices = new Float32Array([-1.0, -1.0 * hwRatio, 1.0, -1.0 * hwRatio, -1.0, 1.0 * hwRatio, 1.0, 1.0 * hwRatio]);
      } else {
        this.startScale = this.imageHeight / this.gl.viewportHeight;
        vertices = new Float32Array([-1.0 / hwRatio, -1.0, 1.0 / hwRatio, -1.0, -1.0 / hwRatio, 1.0, 1.0 / hwRatio, 1.0]);
      }
      this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
      this.imgTexture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.imgTexture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.LUMINANCE, this.imageWidth, this.imageHeight, 0, this.gl.LUMINANCE, this.gl.FLOAT, new Float32Array(this.imageData));
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
      this.gl.bindTexture(this.gl.TEXTURE_2D, null);
      mvMatrix = mat4.create();
      mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, 0.0]);
      uMVMatrix = this.gl.getUniformLocation(this.imgProgram, "uMVMatrix");
      this.gl.uniformMatrix4fv(uMVMatrix, false, mvMatrix);
      vertexShader = this.loadShader(annoVertexShaderSource, this.gl.VERTEX_SHADER);
      fragmentShader = this.loadShader(annoFragmentShaderSource, this.gl.FRAGMENT_SHADER);
      this.annoProgram = this.createProgram(vertexShader, fragmentShader);
      this.gl.useProgram(this.annoProgram);
      uMVMatrix = this.gl.getUniformLocation(this.annoProgram, "uMVMatrix");
      this.gl.uniformMatrix4fv(uMVMatrix, false, mvMatrix);
      vertexShader = this.loadShader(textVertexShaderSource, this.gl.VERTEX_SHADER);
      fragmentShader = this.loadShader(textFragmentShaderSource, this.gl.FRAGMENT_SHADER);
      this.textProgram = this.createProgram(vertexShader, fragmentShader);
      return this.drawGL();
    };

    /*
    	# Transform the annotations and image based on the current offset and zoom
    */

    Renderer.prototype.transformGL = function() {
      var mvMatrix, uMVMatrix;
      mvMatrix = mat4.create();
      mat4.scale(mvMatrix, mvMatrix, [this.scale, this.scale, 0.0]);
      mat4.translate(mvMatrix, mvMatrix, [this.xTrans, this.yTrans, 0.0]);
      this.gl.useProgram(this.imgProgram);
      uMVMatrix = this.gl.getUniformLocation(this.imgProgram, "uMVMatrix");
      this.gl.uniformMatrix4fv(uMVMatrix, false, mvMatrix);
      this.gl.useProgram(this.annoProgram);
      uMVMatrix = this.gl.getUniformLocation(this.annoProgram, "uMVMatrix");
      this.gl.uniformMatrix4fv(uMVMatrix, false, mvMatrix);
      return this.drawGL();
    };

    /*
    	# Draw the texture containing the FITS image data
    */

    Renderer.prototype.drawFITS = function() {
      var texCoordAttribute, vertexPosAttribute;
      this.gl.useProgram(this.imgProgram);
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.imgTexture);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
      texCoordAttribute = this.gl.getAttribLocation(this.imgProgram, "aTextureCoord");
      this.gl.enableVertexAttribArray(texCoordAttribute);
      this.gl.vertexAttribPointer(texCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);
      this.gl.uniform1i(this.gl.getUniformLocation(this.imgProgram, "texture"), 0);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBufferImg);
      vertexPosAttribute = this.gl.getAttribLocation(this.imgProgram, "aVertexPosition");
      this.gl.enableVertexAttribArray(vertexPosAttribute);
      this.gl.vertexAttribPointer(vertexPosAttribute, 2, this.gl.FLOAT, false, 0, 0);
      return this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    };

    /*
    	# Draw the mouse coordinate readout and other messages
    */

    Renderer.prototype.drawText = function() {
      var boxHeight, boxWidth, coordTextBox, coords, elements, mouseAlphaText, mouseDeltaText, mouseXText, mouseYText, textBox;
      this.gl.useProgram(this.textProgram);
      elements = [];
      coords = this.screenToImageCoords(this.mouseLast.x, this.mouseLast.y);
      mouseXText = "x: " + (Math.round(coords.x * 10) / 10).toString();
      mouseYText = "y: " + (Math.round(coords.y * 10) / 10).toString();
      elements.push(new TextElement(5, 12, mouseXText));
      elements.push(new TextElement(5, 27, mouseYText));
      coords = this.wcs.pix2sky(coords.x, coords.y);
      mouseAlphaText = "\u03B1: " + (Math.round(coords[0] * 1000) / 1000).toString();
      mouseDeltaText = "\u03B4: " + (Math.round(coords[1] * 1000) / 1000).toString();
      elements.push(new TextElement(55, 12, mouseAlphaText));
      elements.push(new TextElement(55, 27, mouseDeltaText));
      boxWidth = 120;
      boxHeight = 40;
      coordTextBox = new GlTextBox(elements, this.gl.viewportWidth - boxWidth, this.gl.viewportHeight - boxHeight, boxWidth, boxHeight);
      coordTextBox.draw(this.gl, this.textProgram, this.screenToGlCoords);
      if (this.createAnno) {
        elements = [];
        elements.push(new TextElement(5, 10, "Drag the mouse to create an annotation"));
        textBox = new GlTextBox(elements, 0, 0, 225, 20);
        return textBox.draw(this.gl, this.textProgram, this.screenToGlCoords);
      } else if (this.selectAnno) {
        elements = [];
        elements.push(new TextElement(5, 10, "Drag the mouse to select annotations"));
        textBox = new GlTextBox(elements, 0, 0, 225, 20);
        return textBox.draw(this.gl, this.textProgram, this.screenToGlCoords);
      }
    };

    /*
    	# Draw all annotations tracked by the annotation manager
    */

    Renderer.prototype.drawAnnotations = function() {
      var anno, color, colorAttribute, colorBuffer, colorV, i, vertexBuffer, vertexPosAttribute, vertices, verticesList, _i, _j, _len, _len2, _ref, _ref2, _ref3, _results;
      this.gl.useProgram(this.annoProgram);
      _ref = this.annotationManager.annotations;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        anno = _ref[_i];
        verticesList = anno.getOutlineVertices();
        for (_j = 0, _len2 = verticesList.length; _j < _len2; _j++) {
          vertices = verticesList[_j];
          vertices = this.transformVertices(vertices);
          if (anno.mouseOver) {
            colorV = new Float32Array([1.0, 0.0, 0.0, 1.0]);
          } else {
            colorV = anno.getColorRGBA();
          }
          color = new Float32Array(vertices.length * 4);
          for (i = 0, _ref2 = color.length - 1; i <= _ref2; i += 4) {
            color[i] = colorV[0];
            color[i + 1] = colorV[1];
            color[i + 2] = colorV[2];
            color[i + 3] = colorV[3];
          }
          colorAttribute = this.gl.getAttribLocation(this.annoProgram, "aColor");
          this.gl.enableVertexAttribArray(colorAttribute);
          colorBuffer = this.gl.createBuffer();
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
          this.gl.bufferData(this.gl.ARRAY_BUFFER, color, this.gl.STATIC_DRAW);
          this.gl.vertexAttribPointer(colorAttribute, 4, this.gl.FLOAT, false, 0, 0);
          vertexBuffer = this.gl.createBuffer();
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
          vertexPosAttribute = this.gl.getAttribLocation(this.annoProgram, "aVertexPosition");
          this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
          this.gl.enableVertexAttribArray(vertexPosAttribute);
          this.gl.vertexAttribPointer(vertexPosAttribute, 2, this.gl.FLOAT, false, 0, 0);
          this.gl.drawArrays(this.gl.LINE_STRIP, 0, vertices.length / 2);
        }
        if (anno.selected) {
          vertexBuffer = this.gl.createBuffer();
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
          vertexPosAttribute = this.gl.getAttribLocation(this.annoProgram, "aVertexPosition");
          vertices = this.transformVertices(anno.getHandleVertices());
          this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
          this.gl.enableVertexAttribArray(vertexPosAttribute);
          this.gl.vertexAttribPointer(vertexPosAttribute, 2, this.gl.FLOAT, false, 0, 0);
          this.gl.drawArrays(this.gl.POINTS, 0, vertices.length / 2);
          for (i = 3, _ref3 = color.length - 1; i <= _ref3; i += 4) {
            color[i] = 0.2;
          }
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
          this.gl.bufferData(this.gl.ARRAY_BUFFER, color, this.gl.STATIC_DRAW);
          this.gl.vertexAttribPointer(colorAttribute, 4, this.gl.FLOAT, false, 0, 0);
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
          vertices = this.transformVertices(anno.getFillVertices());
          this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
          this.gl.enableVertexAttribArray(vertexPosAttribute);
          this.gl.vertexAttribPointer(vertexPosAttribute, 2, this.gl.FLOAT, false, 0, 0);
          _results.push(this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, vertices.length / 2));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    /*
    	# Clear the screen and draw the image, annotations and text
    */

    Renderer.prototype.drawGL = function() {
      this.gl.clearColor(0.95, 0.95, 0.95, 1.0);
      this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      this.drawFITS();
      this.drawAnnotations();
      return this.drawText();
    };

    /*
    	# Adjust the offset based on how far the mouse was dragged and 
    	# transform the coordinate system
    */

    Renderer.prototype.translate = function(dxPix, dyPix) {
      this.xTrans += dxPix / this.gl.viewportWidth / this.scale;
      this.yTrans += dyPix / this.gl.viewportHeight / this.scale;
      return this.transformGL();
    };

    /*
    	# Adjust the zoom based on mouse wheel movement and transform
    	# the coordinate system
    */

    Renderer.prototype.zoom = function(delta) {
      if (delta > 0.0) {
        this.scale *= 1.1;
      } else {
        this.scale *= 0.9;
      }
      return this.transformGL();
    };

    /*
    	# Update the pixel value extent in the FITS image shader program
    	# val1 and val2 must be between 0 and 1
    */

    Renderer.prototype.setExtent = function(val1, val2) {
      var extentUniform, val1t, val2t;
      this.gl.useProgram(this.imgProgram);
      val1t = this.extent[0] + (this.extent[1] - this.extent[0]) * val1;
      val2t = this.extent[0] + (this.extent[1] - this.extent[0]) * val2;
      extentUniform = this.gl.getUniformLocation(this.imgProgram, "uExtent");
      this.gl.uniform2f(extentUniform, val1t, val2t);
      return this.drawGL();
    };

    return Renderer;

  })();

  this.Renderer = Renderer;

  this.imgFragmentShaderSource = imgFragmentShaderSource;

  GlTextBox = (function() {

    function GlTextBox(textElements, xPos, yPos, width, height) {
      this.textElements = textElements;
      this.xPos = xPos;
      this.yPos = yPos;
      this.width = width;
      this.height = height;
    }

    GlTextBox.prototype.generatePixelData = function() {
      var canvas, ctx, el, strokeWidth, _i, _len, _ref;
      canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      ctx = canvas.getContext('2d');
      ctx.fillStyle = '#F1F1F1';
      ctx.strokeStyle = '#aaa';
      strokeWidth = 1;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.lineWidth = strokeWidth;
      ctx.strokeRect(0, 0, this.width, this.height);
      _ref = this.textElements;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        el.render(ctx);
      }
      return canvas;
    };

    GlTextBox.prototype.draw = function(gl, textProgram, pixToGlCoords) {
      var c1, c2, pixelData, texCoordAttribute, texCoordBuffer, textTexture, textureCoords, vertexBufferText, vertexPosAttribute, vertices;
      pixelData = this.generatePixelData();
      textTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, textTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(gl.getUniformLocation(textProgram, "texture"), 0);
      texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      textureCoords = new Float32Array([0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0]);
      gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW);
      vertexBufferText = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferText);
      c1 = pixToGlCoords(this.xPos, this.yPos);
      c2 = pixToGlCoords(this.xPos + this.width, this.yPos + this.height);
      vertices = new Float32Array([c1.x, c1.y, c2.x, c1.y, c1.x, c2.y, c2.x, c2.y]);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      texCoordAttribute = gl.getAttribLocation(textProgram, "aTextureCoord");
      gl.enableVertexAttribArray(texCoordAttribute);
      gl.vertexAttribPointer(texCoordAttribute, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferText);
      vertexPosAttribute = gl.getAttribLocation(textProgram, "aVertexPosition");
      gl.enableVertexAttribArray(vertexPosAttribute);
      gl.vertexAttribPointer(vertexPosAttribute, 2, gl.FLOAT, false, 0, 0);
      return gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    return GlTextBox;

  })();

  TextElement = (function() {

    function TextElement(xPos, yPos, text) {
      this.xPos = xPos;
      this.yPos = yPos;
      this.text = text;
    }

    TextElement.prototype.render = function(ctx) {
      var fontSize;
      fontSize = 12;
      ctx.font = fontSize + 'px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#555';
      return ctx.fillText(this.text, this.xPos, this.yPos);
    };

    return TextElement;

  })();

  Line = (function(_super) {

    __extends(Line, _super);

    function Line(xPos, yPos, dx1, dy1, dx2, dy2, id, color) {
      this.getFields = __bind(this.getFields, this);
      var _this = this;
      Line.__super__.constructor.apply(this, arguments);
      this.xPos = xPos;
      this.yPos = yPos;
      this.dx1 = dx1;
      this.dy1 = dy1;
      this.dx2 = dx2;
      this.dy2 = dy2;
      this.id = id;
      this.color = color;
      this.handles = [new Handle(this.xPos + this.dx1, this.yPos + this.dy1, this), new Handle(this.xPos + this.dx2, this.yPos + this.dy2, this)];
      this.handles[0].dragFunc = function(xStart, yStart, xEnd, yEnd) {
        _this.setdx1(xEnd - _this.xPos);
        return _this.setdy1(yEnd - _this.yPos);
      };
      this.handles[1].dragFunc = function(xStart, yStart, xEnd, yEnd) {
        _this.setdx2(xEnd - _this.xPos);
        return _this.setdy2(yEnd - _this.yPos);
      };
    }

    Line.prototype.getOutlineVertices = function() {
      var vertices;
      vertices = new Float32Array([this.xPos + this.dx1, this.yPos + this.dy1, this.xPos + this.dx2, this.yPos + this.dy2]);
      return [vertices];
    };

    Line.prototype.getFillVertices = function() {
      return [];
    };

    Line.prototype.getHandleVertices = function() {
      var vertices;
      vertices = new Float32Array([this.xPos + this.dx1, this.yPos + this.dy1, this.xPos + this.dx2, this.yPos + this.dy2]);
      return vertices;
    };

    Line.prototype.isMouseOver = function(mouseX, mouseY) {
      var b, c1, c2, d, dist, p, p1, p2, pb, v, w;
      dist = function(pa, pb) {
        return Math.sqrt((pa.x - pb.x) * (pa.x - pb.x) + (pa.y - pb.y) * (pa.y - pb.y));
      };
      p = {
        x: mouseX,
        y: mouseY
      };
      p1 = {
        x: this.xPos + this.dx1,
        y: this.yPos + this.dy1
      };
      p2 = {
        x: this.xPos + this.dx2,
        y: this.yPos + this.dy2
      };
      v = {
        x: p2.x - p1.x,
        y: p2.y - p1.y
      };
      w = {
        x: p.x - p1.x,
        y: p.y - p1.y
      };
      c1 = v.x * w.x + v.y * w.y;
      c2 = v.x * v.x + v.y * v.y;
      if (c1 <= 0) {
        d = dist(p, p1);
      } else if (c2 <= c1) {
        d = dist(p, p2);
      } else {
        b = c1 / c2;
        pb = {
          x: p1.x + b * v.x,
          y: p1.y + b * v.y
        };
        d = dist(p, pb);
      }
      if (d < 10.0) return true;
      return false;
    };

    Line.prototype.setXpos = function(newX) {
      var handle, _i, _len, _ref;
      _ref = this.handles;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        handle = _ref[_i];
        handle.xPos += newX - this.xPos;
      }
      return this.xPos = newX;
    };

    Line.prototype.setYpos = function(newY) {
      var handle, _i, _len, _ref;
      _ref = this.handles;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        handle = _ref[_i];
        handle.yPos += newY - this.yPos;
      }
      return this.yPos = newY;
    };

    Line.prototype.setdx1 = function(dx1) {
      this.handles[0].xPos = this.xPos + dx1;
      return this.dx1 = dx1;
    };

    Line.prototype.setdy1 = function(dy1) {
      this.handles[0].yPos = this.yPos + dy1;
      return this.dy1 = dy1;
    };

    Line.prototype.setdx2 = function(dx2) {
      this.handles[1].xPos = this.xPos + dx2;
      return this.dx2 = dx2;
    };

    Line.prototype.setdy2 = function(dy2) {
      this.handles[1].yPos = this.xPos + dy2;
      return this.dy2 = dy2;
    };

    Line.prototype.newDrag = function(xStart, yStart, xEnd, yEnd) {
      var dx, dy;
      dx = xEnd - xStart;
      dy = yEnd - yStart;
      this.setdx2(dx);
      return this.setdy2(dy);
    };

    Line.prototype.getFields = function() {
      var fields;
      fields = {
        position: {
          xPos: this.xPos,
          yPos: this.yPos
        },
        dimensions: {
          dx1: this.dx1,
          dy1: this.dy1,
          dx2: this.dx2,
          dy2: this.dy2
        }
      };
      return fields;
    };

    return Line;

  })(Annotation);

  Rectangle = (function(_super) {

    __extends(Rectangle, _super);

    function Rectangle(width, height, id, color, xPos, yPos) {
      this.getFields = __bind(this.getFields, this);
      var _this = this;
      Rectangle.__super__.constructor.apply(this, arguments);
      this.width = width;
      this.height = height;
      this.id = id;
      this.color = color;
      this.xPos = xPos;
      this.yPos = yPos;
      this.handles = [new Handle(this.xPos, this.yPos, this), new Handle(this.xPos + this.width, this.yPos, this), new Handle(this.xPos + this.width, this.yPos + this.height, this), new Handle(this.xPos, this.yPos + this.height, this)];
      this.handles[0].dragFunc = function(xStart, yStart, xEnd, yEnd) {
        _this.setWidth(_this.xPos + _this.width - xEnd);
        _this.setXpos(xEnd);
        _this.setHeight(_this.yPos + _this.height - yEnd);
        return _this.setYpos(yEnd);
      };
      this.handles[1].dragFunc = function(xStart, yStart, xEnd, yEnd) {
        _this.setWidth(xEnd - _this.xPos);
        _this.setHeight(_this.yPos + _this.height - yEnd);
        return _this.setYpos(yEnd);
      };
      this.handles[2].dragFunc = function(xStart, yStart, xEnd, yEnd) {
        _this.setWidth(xEnd - _this.xPos);
        return _this.setHeight(yEnd - _this.yPos);
      };
      this.handles[3].dragFunc = function(xStart, yStart, xEnd, yEnd) {
        _this.setWidth(_this.xPos + _this.width - xEnd);
        _this.setXpos(xEnd);
        return _this.setHeight(yEnd - _this.yPos);
      };
    }

    Rectangle.prototype.getOutlineVertices = function() {
      var vertices;
      vertices = new Float32Array([this.xPos, this.yPos, this.xPos + this.width, this.yPos, this.xPos + this.width, this.yPos + this.height, this.xPos, this.yPos + this.height, this.xPos, this.yPos]);
      return [vertices];
    };

    Rectangle.prototype.getFillVertices = function() {
      var vertices;
      vertices = new Float32Array([this.xPos, this.yPos, this.xPos + this.width, this.yPos, this.xPos, this.yPos + this.height, this.xPos + this.width, this.yPos + this.height]);
      return vertices;
    };

    Rectangle.prototype.getHandleVertices = function() {
      var vertices;
      vertices = new Float32Array([this.xPos, this.yPos, this.xPos + this.width, this.yPos, this.xPos, this.yPos + this.height, this.xPos + this.width, this.yPos + this.height]);
      return vertices;
    };

    Rectangle.prototype.isMouseOver = function(mouseX, mouseY) {
      if (this.width > 0) {
        if (mouseX < this.xPos || mouseX > this.xPos + this.width) return false;
      } else {
        if (mouseX > this.xPos || mouseX < this.xPos + this.width) return false;
      }
      if (this.height > 0) {
        if (mouseY < this.yPos || mouseY > this.yPos + this.height) return false;
      } else {
        if (mouseY > this.yPos || mouseY < this.yPos + this.height) return false;
      }
      return true;
    };

    Rectangle.prototype.setWidth = function(width) {
      this.handles[1].xPos = this.xPos + width;
      this.handles[2].xPos = this.xPos + width;
      return this.width = width;
    };

    Rectangle.prototype.setHeight = function(height) {
      this.handles[2].yPos = this.yPos + height;
      this.handles[3].yPos = this.yPos + height;
      return this.height = height;
    };

    Rectangle.prototype.setXpos = function(xPos) {
      this.handles[0].xPos = xPos;
      this.handles[1].xPos = xPos + this.width;
      this.handles[2].xPos = xPos + this.width;
      this.handles[3].xPos = xPos;
      return this.xPos = xPos;
    };

    Rectangle.prototype.setYpos = function(yPos) {
      this.handles[0].yPos = yPos;
      this.handles[1].yPos = yPos;
      this.handles[2].yPos = yPos + this.height;
      this.handles[3].yPos = yPos + this.height;
      return this.yPos = yPos;
    };

    Rectangle.prototype.newDrag = function(xStart, yStart, xEnd, yEnd) {
      var dx, dy;
      dx = xEnd - xStart;
      dy = yEnd - yStart;
      this.setXpos(xStart);
      this.setYpos(yStart);
      this.setWidth(dx);
      return this.setHeight(dy);
    };

    Rectangle.prototype.getFields = function() {
      var fields;
      fields = {
        position: {
          xPos: this.xPos,
          yPos: this.yPos
        },
        dimensions: {
          width: this.width,
          height: this.height
        }
      };
      return fields;
    };

    return Rectangle;

  })(Annotation);

  Vector = (function(_super) {

    __extends(Vector, _super);

    function Vector() {
      Vector.__super__.constructor.apply(this, arguments);
    }

    Vector.prototype.getOutlineVertices = function() {
      var p1x, p1y, p2x, p2y, r, theta, vertices;
      r = 15.0;
      theta = Math.atan2((this.yPos + this.dy2) - (this.yPos + this.dy1), (this.xPos + this.dx2) - (this.xPos + this.dx1));
      p1x = r * Math.cos(theta - (3.0 * Math.PI / 4.0)) + this.xPos + this.dx2;
      p1y = r * Math.sin(theta - (3.0 * Math.PI / 4.0)) + this.yPos + this.dy2;
      p2x = r * Math.cos(theta + (3.0 * Math.PI / 4.0)) + this.xPos + this.dx2;
      p2y = r * Math.sin(theta + (3.0 * Math.PI / 4.0)) + this.yPos + this.dy2;
      vertices = new Float32Array([this.xPos + this.dx1, this.yPos + this.dy1, this.xPos + this.dx2, this.yPos + this.dy2, p1x, p1y, this.xPos + this.dx2, this.yPos + this.dy2, p2x, p2y]);
      return [vertices];
    };

    return Vector;

  })(Line);

}).call(this);
