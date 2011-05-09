/**
 * @fileoverview dataset.js defines a Dataset, which abstracts a table of values with rows and columns.
 * The implementation uses a JavaScript database called TaffyDB.
 * @version 0.1
 *  Date: 7/10
 * @author Ian Smith (imsmith@uw.edu)
 */

// include TaffyDB
document.write('<script src="/js/taffy.js" type="text/javascript"></script>');

// Create the UW.astro namspace
if (!UW) var UW={};
if (!UW.astro) UW.astro={};

UW.astro.Dataset = Backbone.Model.extend({

  defaults: {
    id: "",	
    visible: true,
    db: {}
  },

  initialize: function(){},
    
  /**
  * Create a new Dataset.
  * @class Represents a table of values, with rows and columns. 
  * Each row has unique id, a color, and a visibility, 
  * @constr uctor
  * @param {object[]} json A JSON array from which the dataset is created.
  *      The JSON should be of the form of an array of objects where each property
  *      is a column name, and each value is the value of that row and column.
  *      First object in array is first row in dataset.
  */
  init: function(json){
    	
    // TODO: verify json is an array of objects (in json form)
    this.set({ db: new TAFFY(json)});
   
    // add a color column to the db
    if (!this.hasColor()) {
   	this.get("db").update({db_color:""}); // no where clause, so updates all records
    }
  
    // add db index to each record (overwrite if it already exists
   	this.get("db").update({db_id:""});
   	this.get("db").forEach( function(rec,index){ rec.db_id = index; return rec; } );
   
    // add db visibility to each record
    if (!this.hasColumn("db_visible")) {
   	// set all records visble=true
   	  this.get("db").update({db_visible:true});
    }
  
    // add CelestialCoord if possible
    if (this.hasColumn('ra') && this.hasColumn('dec')) {
   	  this.get("db").forEach(function(rec,index){
        cc = new UW.astro.CelestialCoordinate;
        // set the cc id to be "<datasetName>_<index>"
        var cc =  UW.astro.CelestialCoordinate.prototype.parseObject(rec);
        cc.setId("id_" + index);
        rec.db_CelestialCoord = cc; 
        return rec;
      });
    }
  
  },
  
  setVisible: function(vis) {
    this.set({'visible': vis});
  },
  
  getVisible: function() {
    return this.get('visible');
  },
  
  isVisible: function() {
    return this.getVisible();
  },
  
  toString: function() {
    return this.get("db").stringify();
  },
  
  getId: function() {
    return this.get("id");
  },
  
  setId: function(id) {
    this.set({'id': id});
  },
  
  getSize: function() {
    return this.get("db").find().length;
  },
  
  getColumns: function() {
    return TAFFY.getObjectKeys(this.get("db").first());
  },
  
  getNonDBColumns: function() {
    var columns = this.getColumns();
    for (var i=columns.length -1; i>=0; i--) {
      if (columns[i].indexOf('db_') === 0) {
        columns.splice(i,1);
      }
    }
    return columns;
  },
  
  toJSON: function() {
    return this.get("db").get();
  },
  
  getColoredIndexArray: function() {
    // make a list of ever index
    var list = [];
    var entireDb = this.get("db").get();
    for (var i=0, len=entireDb.length; i<len; i++) {
      list[i] = [ entireDb[i]["db_id"], entireDb[i]["db_color"] ];
    }
    return list;
  },
  
  // returns an array of the unique color values in the dataset
  getUniqueColors: function() {
    var colorList = [];
    var entireDb = this.get("db").get();
    for (var i=0, len=entireDb.length; i<len; i++) {
      if (!arrayContains(colorList, entireDb[i]["db_color"])) {
        colorList.push(entireDb[i]["db_color"]);
      }
    }
    return colorList.sort();
  },
  
  getRecordByIndex: function(index) {
    return this.get("db").first({db_id: index});
  },
  
  // Accepts a string that defines the color
  // returns an array of indexes that have that color
  getColorIndexes: function(color) {
    return this.get("db").find({db_color:color});
  },
  
  getCelestialCoordByIndex: function(index) {
    var rec = this.getRecordByIndex(index);
    return this.getCelestialCoord(rec);
  },
  
  getSelectedIndexes: function() {
    return this.get("db").find({db_color: {"!is":""}});
  },
  
  getUnselectedIndexes: function() {
    return this.get("db").find({db_color: {"is":""}});
  },
  
  getCelestialCoord: function(rec) {
    return rec["db_CelestialCoord"];
  },
  
  getColor: function(rec) {
    return rec["db_color"];
  },
  
  getVisibleByIndex: function(index) {
    return this.get("db").first({db_id: index})["db_visible"];
  },
  
  setVisibleByIndex: function(index, vis) {
    this.get("db").update({db_id: index}, {visible:vis})
    var rec = this.get("db").find({db_id: index});
    var cc = this.getCelestialCoordinate(rec);
    cc.setVisible(vis);
  },
  
  getColorByIndex: function(index) {
    return this.get("db").first({db_id: index})["db_color"];
  },
  
  // Accepts an array of indexes and string that defines color
  // Sets the color of all indexes to specified color
  setIndexesColor: function(indexes, color) {
    // TODO: how to change db_color to this.get("db")_COLOR (const)?
    this.get("db").update({db_color:color}, indexes);
    // set the color change for all these indexes in the celestial coord
    this.get("db").forEach(
      function(rec,index){ 
        if (rec.hasOwnProperty('db_CelestialCoord')) {
          var cc = rec.db_CelestialCoord;
          if (cc !== null) {
            cc.setColor(color);
            rec.db_CelestialCoord = cc;
            return rec;
          }
   			}
      }, {db_id: indexes});
      this.change();
  },
  
  // Accepts an array of indexes and boolean visibility
  // Sets the visibility of all indexes to vis
  setIndexesVisible: function(indexes, vis) {
    this.get("db").update({db_visible:vis}, indexes);
    // set the color change for all these indexes in the celestial coord
    this.get("db").forEach(
      function(rec,index){ 
        if (rec.hasOwnProperty('db_CelestialCoord')) {
          var cc = rec.db_CelestialCoord;
          if (cc !== null) {
            cc.setVisible(vis);
            rec.db_CelestialCoord = cc;
            return rec;
          }
   			}
   	}, {db_id: indexes});
  },
  
  // Private
  // returns true if the db has a color column
  hasColor: function() {
    return this.hasColumn("db_color");
  },
  
  // returns true if the db has a column with this name
  hasColumn: function(name) {
    return (this.getColumnIndex(name) !== -1);
  },
  
  // returns column number of db.color column.
  // -1 if it doesnt exist
  getColumnIndex: function(col) {
    return this.getColumns().indexOf(col);
  } 

});


// SelectedSet
//HELPER
function arrayContains(arr, el) {
	for (var i=0, len=arr.length; i<len; i++) {
    	if (arr[i] === el) {
        	return true;
    	}
    }
    return false;
}

