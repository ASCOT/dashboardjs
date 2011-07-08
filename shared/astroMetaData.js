/**
 * @fileoverview astroObjectlib.js is a library of common objects for ASCOT gadgets.
 * @version 0.1
 *  Date: 2/10
 * @author Ian Smith (imsmith@uw.edu)
 */
 
// Create the UW.astro namspace
if (!UW) var UW={};

/**
 * Create a new CelestialCoordinate
 * @class Represents a celestial coordinate with such properties as RA, DEC, a placemark image,
 * a visibility, a description, and other fields.
 * @constructor
 * @param {string|number} ra The right ascention of the coordinate in decimal decrees (0 <= RA <= 360)
 * @param {string|number} dec The declination of the coordinate in decimal decrees (-90 <= DEC <= +90)
 */
UW.AstroMetaData = UW.AbstractModel.extend({
 
  initialize: function(){

    // URL string of the icon to represent this point (such as on the viewport)
    this.set( { color: "",
                infoText: "",  // string containing text info 
                name: "",
                description: "", // description text that is displayed in popup when a placemark is clicked 
                visible: true });
    this.bind('change', _(this.publishChange).bind(this));
  }
  
});


