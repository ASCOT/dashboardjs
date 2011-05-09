/**
 * @fileoverview astroObjectlib.js is a library of common objects for ASCOT gadgets.
 * @version 0.1
 *  Date: 2/10
 * @author Ian Smith (imsmith@uw.edu)
 */
 
// Create the UW.astro namspace
if (!UW) var UW={};
if (!UW.astro) /** @namespace */ UW.astro={};

/**
 * Create a new CelestialCoordinate
 * @class Represents a celestial coordinate with such properties as RA, DEC, a placemark image,
 * a visibility, a description, and other fields.
 * @constructor
 * @param {string|number} ra The right ascention of the coordinate in decimal decrees (0 <= RA <= 360)
 * @param {string|number} dec The declination of the coordinate in decimal decrees (-90 <= DEC <= +90)
 */
UW.astro.CelestialCoordinate = function(ra, dec){
    
    // CONSTANTS
    
    // DEFAULT_COLOR is the color this CelestialCoordinate will be represented if not explicitly set
    this.DEFAULT_COLOR = "";
    
    // DEFAULT_ICON_URL is the image to represent the CelestialCoordinate
    this.DEFAULT_ICON_URL = "http://sky.astro.washington.edu/gadgets/images/target_grey.png", // set URL to icon
    
    // DEFAULT_INFO_TEXT is the default text that is assicated with this point's info
    this.DEFAULT_INFO_TEXT = "", // text associated with this point

    this.DEFAULT_KEY = "",                                
    this.DEFAULT_NAME = "",
	this.DEFAULT_ID = "",
    this.DEFAULT_DESCRIPTION = "";

    // PRIVATE

    // RA of this object in decimal degrees as number
    this._ra = parseFloat(ra),

    // DEC of this object in decimal degrees as number
    this._dec = parseFloat(dec),

    // URL string of the icon to represent this point (such as on the viewport)
    this._iconUrl = this.DEFAULT_ICON_URL,

    // color to represent this point (in Javascript hex as string, eg "#FF0000")
    this._color = this.DEFAULT_COLOR,
    
    // string containing text info 
    this._infoText = this.DEFAULT_INFO_TEXT,

    // text key used by a gadget for any purpose 
    // eg. the name of gadget that created the point
    this._key = this.DEFAULT_KEY,
    
    // name that is displayed as name of placemark 
    this._name = this.DEFAULT_NAME,

    // description text that is displayed in popup when a placemark is clicked 
    this._description = this.DEFAULT_DESCRIPTION,

	this._id = this.DEFAULT_ID,

    // boolean that sets visibility of this point
    this._visible = true;
}
    
/**
 * Get the right ascension of the point.
 * @return {number} RA of point in decimal degrees.
 */
UW.astro.CelestialCoordinate.prototype.getRa = function(){
        return this._ra;
}

/**
 * Get the declination of the point.
 * @return {number} DEC of point in decimal degrees.
 */
UW.astro.CelestialCoordinate.prototype.getDec = function(){
        return this._dec;
}

/**
 * Set the right ascention of the point.
 * @param {string|number} newRa The RA of the point in decimal degrees.
 * @return {number} The RA of the point in decimal degrees (as number).
 */
UW.astro.CelestialCoordinate.prototype.setRa = function(newRa){
        this._ra = parseFloat(newRa);
        return this._ra;
}

/**
 * Set the declination of the point.
 * @param {string|number} newDec The DEC of the point in decimal degrees.
 * @return {number} The DEC of the point in decimal degrees (as number).
 */
UW.astro.CelestialCoordinate.prototype.setDec = function(newDec){
        this._dec = parseFloat(newDec);
        return this._dec;
}

/**
 * Get the color of the point as a string (eg "red" or "green").
 * @return {string} The color of the point.
 */
UW.astro.CelestialCoordinate.prototype.getColor = function() {
	return this._color;
}

/**
 * Set the color of the point. This will also change the iconUrl to the specified color.
 * The color is a string that is the color name. Supported colors are:
 * <ul>
 * <li> red  
 * <li> green
 * <li> yellow
 * <li> blue
 * </ul>
 * All other colors will set the variable, but will set the iconUrl to the default icon. <br/>
 * TODO: Consider using hex colors rather than color names.
 */
UW.astro.CelestialCoordinate.prototype.setColor = function(color){
	// change the color and the iconUrl
	this._color = color;
	switch(color){
		case "red":
			this._iconUrl = "http://sky.astro.washington.edu/gadgets/images/target_red.gif";
			break;
		case "green":
			this._iconUrl = "http://sky.astro.washington.edu/gadgets/images/target_green.gif";
			break;
		case "yellow":
			this._iconUrl = "http://sky.astro.washington.edu/gadgets/images/target_yellow.gif";
			break;
		case "blue":
			this._iconUrl = "http://sky.astro.washington.edu/gadgets/images/target_blue.png";
			break;
		default:
			this._iconUrl = this.DEFAULT_ICON_URL;
			break;
	}
}

/**
 * Returns a string equivalent of the point. Currently a blank string.
 * @return {string} Returns a string equivalent of the point.
 */
UW.astro.CelestialCoordinate.prototype.toString = function() {
    return ""; //"color: " + this._color;
}


/**
 * Parses a string that represents a coordinate to return a CelestialCoordinate
 * with the specified RA and DEC. The parser is supposed to be fairly tolerant, as it
 * will be translating from a web text input. The input can be in the form of HMS or decimal degrees.
 * @param {String} text Expects a coordinate repesented by RA and DEC in H M S or decimal degrees as <br/>
 *    00 00 00.0 +00 00 00.0  <br/>
 * or 00 00 00.0 -00 00 00.0  <br/>
 * or 00:00:00.0 +00:00:00.0  <br/>
 * or two decimal numbers     <br/>
 * where 0 is any digit.      <br/>
 * Decimals not required, but a + or - is required for the DEC.
 * @return {CelestialCoordinate} A CelestialCoordinate if text string represents an RA and DEC
 * otherwise returns null.
*/
// Note this is not a prototype function because we should be able to call it without making a new
// CelestialCoordinate
UW.astro.CelestialCoordinate.parseCoord = function(text) {
    // try to split the string into ra and dec at +/-
    var isDecPositive = (text.indexOf('+') != -1);
    var splitRegex = /\+|\-/;
    var raDec = text.split(splitRegex);
    if (!(raDec.length === 2)) {
    	return null;
    }
    
    // split ra and dec at spaces
    var ra = tupleStrToDecimal(raDec[0]);
    var dec = tupleStrToDecimal(raDec[1]);
    if (ra === null || dec === null) {
	    return null;
    }
    if (!isDecPositive) {
	    dec = dec * -1;
    }
    if (!((ra >= 0) && (ra <= 360))) {
	    return null;
    }
    if (!(dec >= -90) && (dec <= 90)) {
    	return null;
    }
    // seems like an ok coordinate, so set this CelestialCoord as these coords are return it
    return new UW.astro.CelestialCoordinate(ra, dec);
}

/**
 * @private 
 * @returns A decimal representation of the coordinate string
 * @param {String} A string representing 2 ints and a float, or just a single float
 */
function tupleStrToDecimal(str) {
    str = trim(str);
    var singleFoat = false;
    // split ra and dec at spaces
    var tupleStr = str.split(/ /); 
    if (!(tupleStr.length === 3)) {
	    tupleStr = str.split(/:/); // split ra and dec at colons
	    if (!(tupleStr.length === 3)) {
	        var tryFloat = parseFloat(tupleStr[0]); // maybe it's only a single decimal?
	        if (tupleStr.length === 1 && !isNaN(tryFloat)) {
    		    return tryFloat;
	        } else {
	    	    return null;
	        }
	    }
    }
    // test for whether the first 2 are ints, and the 3rd is a float
    var tupleNums = [];
    // specify radix of 10, beacuse 05  looks like octal 5
    tupleNums[0] = parseInt(tupleStr[0], 10);
    tupleNums[1] = parseInt(tupleStr[1], 10);
    tupleNums[2] = parseFloat(tupleStr[2], 10);
    // test for NaN in all 3 fields of both ra and dec
    for (var i=0; i<3; i++) {
    	if (isNaN(tupleNums[i])) {
	        return null;
	    }
    }
    // convert the 3 sections to decimal
    return tupleNums[0] + (tupleNums[1] / 60.0) + (tupleNums[2] / 3600.0);
}

/**
 * Get "longitude" of this point. Longitude is simply RA-180 degrees.
 * This is the value that googlesky expects (-180 <= longitude <= +180)
 * @return {number} Return longitude of this point (RA-180)
 */
UW.astro.CelestialCoordinate.prototype.getLongitude = function(){
        return this._ra - 180;
}

/**
 * Get "latitude" of this point. Latitude is equivalent to DEC.
 * @return {number} Return the latitude of this point. 
 */
UW.astro.CelestialCoordinate.prototype.getLatitude = function(){
        return this._dec;
}

/**
 *
 */
 
UW.astro.CelestialCoordinate.prototype.setLongitude = function(newLon){
        this._ra = parseFloat(newLon) + 180;
        return newLon;
}
UW.astro.CelestialCoordinate.prototype.setLatitude = function(newLat){
        this._dec = newLat;
        return newLat;
}

UW.astro.CelestialCoordinate.prototype.getId = function(){
        return this._id;
}
UW.astro.CelestialCoordinate.prototype.setId = function(id){
	this._id = id.toString();
	return this._id;
}
UW.astro.CelestialCoordinate.prototype.getName = function(){
        return this._name;
}
UW.astro.CelestialCoordinate.prototype.setName = function(name){
	this._name = name.toString();
	return this._name;
}
UW.astro.CelestialCoordinate.prototype.getDescription = function(){
        return this._description;
}
UW.astro.CelestialCoordinate.prototype.setDescription = function(desc){
        this._description = desc.toString();
        return this._description;
}
UW.astro.CelestialCoordinate.prototype.appendDescription = function(desc){
        this._description += desc.toString();
        return this._description;
}
UW.astro.CelestialCoordinate.prototype.setIconUrl = function(url){
	this._iconUrl = url;
}
UW.astro.CelestialCoordinate.prototype.setVisible = function(visible) {
	this._visible = visible;
}
UW.astro.CelestialCoordinate.prototype.getVisible = function() {
	return this._visible;
}

// Accepts an object, and attempts to parse it to 
// return either null or a CelestialCoordinate
// TODO: add more parsing
UW.astro.CelestialCoordinate.prototype.parseObject = function(obj) {
	if (obj.hasOwnProperty('ra') && obj.hasOwnProperty('dec')) {
		cc = new UW.astro.CelestialCoordinate(obj.ra, obj.dec);
		var desc = [];
		for (var property in obj) {
		    if (obj[property] !== null && obj[property] !== undefined) {
			desc.push(property + ": " + obj[property].toString());
		    }
		}
		cc.setDescription(desc.join('\n'));
		if (obj.hasOwnProperty('db_visible')) {
		    cc.setVisible(obj.db_visible);
		}
		if (obj.hasOwnProperty('db_color')) {
		    cc.setColor(obj.db_color);
		}
		return cc;
	} else {
	    return null;
	}
}
 
   // Return the KML text for this point.
UW.astro.CelestialCoordinate.prototype.getKML = function() {
        var lon = this.getLongitude(),
            lat = this.getLatitude(),
            iconUrl = this._iconUrl,
	    // translate multiline desc into html
            desc = "<p>" + this._description.replace(new RegExp('\n', "g"), '<br \>') + '<\p>';
            
        var placemarkText = '<?xml version="1.0" encoding="utf-8"?>' +
        '<kml xmlns="http://www.opengis.net/kml/2.2" hint="target=sky">' +
        '<Placemark ID="' + this.getName() + '">' +
            '<name>' + this.getName() + '</name>' +
            '<description>' +
                '<![CDATA[' +
                    desc +
                ']]>' +
            '</description>' +
            '<LookAt>' +
                '<longitude>' + lon + '</longitude>' +
                '<latitude>' + lat + '</latitude>' +
                '<altitude>0</altitude>' +
                '<heading>-3</heading>' +
                '<tilt>0</tilt>' +
                '<range>3768</range>' +
            '</LookAt>' +
            '<Style>' +
                '<IconStyle>' +
                    '<Icon>' +
                        '<href>' + iconUrl + '</href>' +
                    '</Icon>' +
                '</IconStyle>' +
            '</Style>' +
            '<Point>' +
                '<coordinates>' + lon + ',' + lat + ',0</coordinates>' +
            '</Point>' +
        '</Placemark>' +
        '</kml>';
        return placemarkText;
}


UW.astro.CelestialObject = function() {
	// TODO: inheret from CelestialCoord?

	// PRIVATE
	// TODO: make celstial coord constructor that doesnt require arguments
	this._celestialCoord = null,
	this._gMag = -9999,
	this._rMag = -9999,
	this._id,
	this._spectraId = "";
}

//METHODS
	
UW.astro.CelestialObject.prototype.setCelestialCoord = function(cc) {
	this._celestialCoord = cc;
}
UW.astro.CelestialObject.prototype.getCelestialCoord = function() {
	return this._celestialCoord;
}
UW.astro.CelestialObject.prototype.setGMag = function(mag) {
	this._gMag = parseFloat(mag);
}
UW.astro.CelestialObject.prototype.getGMag = function() {
	return this._gMag;
}
UW.astro.CelestialObject.prototype.setRMag = function(mag) {
	this._rMag = parseFloat(mag);
}
UW.astro.CelestialObject.prototype.getRMag = function() {
	return this._rMag;
}
UW.astro.CelestialObject.prototype.setId = function(id) {
	this._id = id;
}
UW.astro.CelestialObject.prototype.getId = function() {
	return this._id;
}
UW.astro.CelestialObject.prototype.setSpectraId = function(id) {
	this._spectraId = id;
}
UW.astro.CelestialObject.prototype.getSpectraId = function() {
	return this._spectraId;
}



UW.astro.UniqIdList = function(){
    // A list of items such that each item in the list has a uniq id, and increments
    // with each added item. Any instance of this list will create a new, unique id
    // for each item.
    // Implemented as 
    var my = {};

    // PRIVATE
    function Item(){
        this.itemId = -1,	// ID of this item
        this.value = null,	
		this.modified = false;	// flag for whether this item has been modified
    }

    var _currentItemId = 0, // current id of last item in the list
        _itemList = [];     // list of items
	

    // METHODS
    my.append = function(obj){
        var item = new Item();
        item.itemId = _currentItemId++; // increment the unique Id
        item.value = obj;
        _itemList.push(item);
        return item.itemId;     // return the itemId so we can use it to remove from list
    }
    my.removeByIndex = function(index){
        // TODO: Do this!!!
    }
    my.removeById = function(id){
        // TODO: Do this!!!
    }
    my.getLength = function(){
        return _itemList.length;
    }
    my.getItemByIndex = function(index){
        if (index <= _itemList.length) {
            return _itemList[index].value;
        }
        else {
            return null;
        }
    }
    my.getItemById = function(id){
        for (var i=0, len=_itemList.length; i<len; i++){
            if (_itemList[i].itemId === id){
                return _itemList[i].value;
            }
        }
        return null;
    }
    my.getIdByIndex = function(index){
        if (index <= _itemList.length) {
            return _itemList[index].itemId;
        }
        else {
            return null;
        }
    }
    my.setModifiedById = function(id, mod){
		for (var i=0, len=_itemList.length; i<len; i++){
            if (_itemList[i].itemId === id){
                _itemList[i].modified = mod;
				return;
            }
        }
	}
	my.isIndexModified = function(index){
		return _itemList[index].modified;
	}
	my.isIdModified = function(id){
		for (i=0, len=_itemList.length; i<len; i++){
			if (_itemList[i].itemId === id) {
				return _itemList[i].modified;
			}
		}
		return null;
	}
	my.getModifiedIds = function() {
		var modIds = [];
		for (var i=0, len=_itemList.length; i<len; i++) {
			if (_itemList[i].modified === true) {
				modIds.push(_itemList[i].itemId);
			}
		}
		return modIds;
	}

    return my;
}

// Helper
function trim(str) {
    return str.replace(/^\s+|\s+$/g,"");
}
