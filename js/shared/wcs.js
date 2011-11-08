/*
 *
 * Cite:
 * Calabretta and Greisen, 2002, Representations of celestial coordinates in FITS.
 */

(function () {
    "use strict";

    // Save a reference to the global object.
    var root = this;

    // The top-level namespace. Exported for both CommonJS and the browser.
    var WCS;
    if (typeof exports !== 'undefined') {
        WCS = exports;
    } else {
        WCS = root.WCS = root.WCS || {};
    }
  
    WCS.version = '0.0.1';

    var validTransforms = ['RA---TAN', 'DEC--TAN'];
    
    // Trig
    function deg2rad(deg) {
        return ((2 * Math.PI * deg) / 360);
    }
    function rad2deg(rad) {
        return (360 * rad / (2 * Math.PI));
    }
    function sind(deg) {
        return Math.sin(deg2rad(deg));
    }
    function cosd(deg) {
        return Math.cos(deg2rad(deg));
    }
    function tand(deg) {
        return Math.tan(deg2rad(deg));
    }
    function asind(x) {
        return rad2deg(Math.asin(x));
    }
    function acosd(x) {
        return rad2deg(Math.acos(x));
    }
    function atand(x) {
        return rad2deg(Math.atan(x));
    }
    function atan2d(y, x) {
        return rad2deg(Math.atan2(y, x));
    }
    // Note this reverses the order of atan2d, because arg() is defined as arg(x, y), and Javascript defines
    // atan2() as atan2(y, x).
    function argd(x, y) {
        return atan2d(y, x);
    }

    function inArray(arr, obj) {
        return (arr.indexOf(obj) != -1);
    }
    
    function supportedTransform(header) {
       return (inArray(validTransforms, header['CTYPE1']) && inArray(validTransforms, header['CTYPE2']));
    }
    
    function copyFitsValuesToObj(header, wcsobj) {
        var numAxes = header['NAXIS'];
        var axisKeywords = ['NAXIS', 'CTYPE', 'CDELT', 'CRPIX', 'CRVAL', 'CUNIT'];
        var singleKeywords = ['NAXIS', 'LONPOLE', 'EQUINOX', 'RADESYS'];

        for (var axis=1; axis<=numAxes; axis++) {
            for (var i=0; i<axisKeywords.length; i++) {
                var k = axisKeywords[i] + axis;
                if (k in header) {
                    wcsobj[k] = header[k];
                }
            }
        }
        for (var i=0; i<singleKeywords.length; i++) {
            var k = singleKeywords[i];
            if (k in header) {
                wcsobj[k] = header[k];
            }
        }
    }

    // Returns list of the intermediate world coordinates of the wcsobj at the pixel coordinates
    //  given in args. The returned list will be the sae length as the argument list.
    // Asserts: args.length <= wcsobj.NAXIS
    // Accepts: wcsobj
    //          args: list of axes for which to do transformation.
    //  TODO: Add support for PCxxx (pixel rotate and shear)
    function getIntermediateWorldCoords(wcsobj, args) {
        if (args.length > wcsobj.NAXIS) {
            throw new Error('Intermediate world coordinates transformation requires NAXIS to be >= length of list of pixel coordinate dimensions.');
        }
        var coord = [];
        // Default PCxxx transformation matrix element assumes identity matrix.
        // For each non-zero element in identity, do: (CDELTj * (px - CRPIXi))
        // NOTE: CDELT an CRPIX have 1 as first index.
        for (var i=0; i<args.length; i++) {
            coord[i] = wcsobj['CDELT' + (i+1)] * (args[i] - wcsobj['CRPIX'+(i+1)]);
        }
        return coord;
    }

    /*
     * Returns native latitude and longitude for a TAN (tangent plane) projection.
     * Accepts: coords: an array of projection plane coordinates as [x, y]
     * Returns: list of lat, long as phi, theta.
     */
    function intermediateToLatLongTAN(coords) {
        var x = coords[0];
        var y = coords[1];
        
        var phi = argd(-1 * y, x);
        var r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        var theta = atand((180 / Math.PI) * (1 / r));

        return [phi, theta];
    }
   
    function latLonToWcs(wcsobj, latLon) {
        var phi = latLon[0];
        var theta = latLon[1];

        var phi_p = 180;
        var ra_p = wcsobj['CRVAL1'];
        var dec_p = wcsobj['CRVAL2'];
        
        // eq (2) in Calabretta et al 2002
        var ra = ra_p + argd(((sind(theta)*cosd(dec_p)) - (cosd(theta)*sind(dec_p)*cosd(phi-phi_p))), -1*cosd(theta)*sind(phi-phi_p));
        var dec = asind((sind(theta)*sind(dec_p)) + (cosd(theta)*cosd(dec_p)*cosd(phi-phi_p)));

        return [ra, dec];    
    }

    WCS.Mapper = function(header) {
        // Object to contain FITS header values that are relevant to WCS, and functions for transformation.
        var wcsobj = {};
       
        // TODO: confirm CTYPEs are in order: ra, dec
        if (!supportedTransform(header)) {
            throw('Unsupported transformation.');
        }
        
        // Add FITS header values to wcsobj
        copyFitsValuesToObj(header, wcsobj);
        
        /*
         * Returns object containing ra and dec corresponding to pixel coordinates.
         * Accepts pixel coordinates as integers in order of FITS NAXIS axes (NAXIS1, NAXIS2, ...).
         * 
         * eg: var wcsMapper = new WCS.Mapper(fitsHeader);
         *     var ra = wcsMapper.pixelToCoordinate(x, y).ra;
         */
        this.pixelToCoordinate = function() {
            // TODO: validate arguments
            
            var coord = getIntermediateWorldCoords(wcsobj, arguments);
            var latLon = intermediateToLatLongTAN(coord);
            var c = latLonToWcs(wcsobj, latLon);
            
            
            return {ra: c[0], dec: c[1]};
        };

        this.coordinateToPixel = function(ra, dec) {
            throw new Error("WCS.Mapper.coordinateToPixel() not implemented."); 
            return {x: null, y: null};
        };
    }
} ).call(this);