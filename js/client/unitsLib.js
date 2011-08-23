//	This file is part of the FITS viewer, developed for the CyberSKA project
//	by Pavol Federl (federl@gmail.com).
//
//  Copyright (C) 2010  CyberSKA (www.cyberska.org)
//  All rights reserved.
//  Contact: CyberSKA (info@cyberska.org)
//
//  The JavaScript code in this page is free software: you can
//  redistribute it and/or modify it under the terms of the GNU
//  General Public License (GNU GPL) as published by the Free Software
//  Foundation, either version 3 of the License, or (at your option)
//  any later version.  The code is distributed WITHOUT ANY WARRANTY;
//  without even the implied warranty of MERCHANTABILITY or FITNESS
//  FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
//
//  As additional permission under GNU GPL version 3 section 7, you
//  may distribute non-source (e.g., minimized or compacted) forms of
//  that code without the copy of the GNU GPL normally required by
//  section 4, provided you include this license notice and a URL
//  through which recipients can access the Corresponding Source.
//    
//  If you find this code useful and use/modify it for your project,
//  please give the CyberSKA project credit somewhere in your application
//  (for example in the 'Help/About' dialog or splash screen).

UnitsLib = new function() {
	
	// determine a precision of a number (number of digits after '.', while ignoring trailing 0s
	this.precision = function(x) {
		// get the part after '.'
		var a = ('' + x).split('.');
		if(a.length < 2) return 0;
		// remove trailing '0'
		var s = a[1];
		while( s.length > 0 && s[s.length-1] == '0') s = s.substr( 0, s.length - 1);
		return s.length;
	};
	
	// simple fixed floating point number formatting function
	// simulates printf( "%[width].[precision]f", pnum) for width > 0 (eg. no right justification)
	this.printf = function( pnum, pwidth, precision) {
		width = Math.abs( pwidth);
		if( ! precision) precision = 0;
		num = pnum;
		var sign = '';
		if( pnum < 0) {
			sign = '-';
			num = -num;
		}
		var p1 = sign + Math.floor(num);
		var fr = num - Math.floor(num);
		var p2 = '' + Math.floor( fr * Math.pow( 10, precision));
		while( p2.length < precision) p2 = '0' + p2;
		p2 = '.' + p2;
		if( precision == 0) { p2 = ''; }
		var whole = p1 + p2;
		while( whole.length < width) {
			if( pwidth < 0)
				whole = whole + ' ';
			else
				whole = ' ' + whole;
		}
		
		// console.log( pnum, width, precision, ' = |' + whole + '|');
		
		return whole;
	};
	
	// left-pad a given input with the specified padding character to the desired length
	this.padLeft = function( str, len, char) {
		var res = '' + str;
		var c = '' + char;
		while( res.length < len) res = c + res;
		return res;
	};

	// right-pad a given input with the specified padding character to the desired length
	this.padRight = function( str, len, char) {
		var res = '' + str;
		var c = '' + char;
		while( res.length < len) res = res + c;
		return res;
	};

	// formats a number <n> in hexagecimal format: <x>:<minuntes>:<seconds>.<seconds fraction>
	// input has to be a number of minutes...
	this.formatSexagecimal = function( n) {
		var tmp = n;
		var sign = '';
		if( tmp < 0) {
			sign = '-';
			tmp = - tmp;
		}
		var v1 = Math.floor( tmp / 3600);
		tmp = tmp - v1 * 3600;
		var v2 = Math.floor( tmp / 60);
		tmp = tmp - v2 * 60;
		var v3 = Math.floor( tmp);
		tmp = tmp - v3;
		var v4 = Math.floor( tmp * 1000);
		v1 = this.padLeft( sign + v1, 3, ' ');
		v2 = this.padLeft( v2, 2, 0);
		v3 = this.padLeft( v3, 2, 0);
		v4 = this.padLeft( v4, 3, 0);
		return v1 + ":" + v2 + ":" + v3 + "." + v4;
	};

	
	this.prefixes =
	[
	 { mult: 1e+24, prefix: 'Y', verbose: 'yotta' },
	 { mult: 1e+21, prefix: 'Z', verbose: 'zetta' },
	 { mult: 1e+18, prefix: 'E', verbose: 'exa'   },
	 { mult: 1e+15, prefix: 'P', verbose: 'peta'  },
	 { mult: 1e+12, prefix: 'T', verbose: 'tera'  },
	 { mult: 1e+9 , prefix: 'G', verbose: 'giga'  },
	 { mult: 1e+6 , prefix: 'M', verbose: 'mega'  },
	 { mult: 1e+3 , prefix: 'k', verbose: 'kilo'  },
	 { mult: 1 	  , prefix: '',  verbose: ''      },
	 { mult: 1e-3 , prefix: 'm', verbose: 'milli' },
	 { mult: 1e-6 , prefix: '&micro;', verbose: 'micro' },
	 { mult: 1e-9 , prefix: 'n', verbose: 'nano'  },
	 { mult: 1e-12, prefix: 'p', verbose: 'pico'  },
	 { mult: 1e-15, prefix: 'f', verbose: 'femto' },
	 { mult: 1e-18, prefix: 'a', verbose: 'atto'  },
	 { mult: 1e-21, prefix: 'z', verbose: 'zepto' },
	 { mult: 1e-24, prefix: 'y', verbose: 'yocto' }
	];
	
	// figures out what prefix to use for units, given a data value
	this.lookupPrefix = function( val) {
		var res = undefined;
		for( p in this.prefixes) {
			if( Math.abs(val) > this.prefixes[p].mult ) {
				res = this.prefixes[p];
				break;
			}
		}
		if( res == undefined) {
			res = this.prefixes[0];
		}
		return res;
	};
	
	/**
	 * If str ends in '/beam' then this is removed and result returned
	 */
	this.removeBeam = function( str) {
		return str.replace(/\/beam$/i,"");
	},
	
	// formats a value <val> according to the value of BUNIT (given in p_bunit), and
	// a predetermined prefix <prefix>
	this.formatBUNIT = function ( val, p_bunit, prefix) {
		if( prefix === undefined)
			prefix = UnitsLib.lookupPrefix(val);
		var bunit = p_bunit.toLowerCase();
		var res;
		if( bunit == "jy/beam") {
			// res = "" + (val / prefix.mult).toFixed(3) + " " + prefix.prefix + "Jy/Beam";
			res = pflib.sprintf("%10.3f %sJy/Beam", val / prefix.mult, prefix.prefix);
		} else if( bunit == "jy") {
			// res = "" + (val / prefix.mult).toFixed(3) + " " + prefix.prefix + "Jy";
			res = pflib.sprintf("%10.3f %sJy", val / prefix.mult, prefix.prefix);
		} else if( bunit == "kelvin" || bunit == "k") {
			// res = "" + (val / prefix.mult).toFixed(3) + " " + prefix.prefix + "K";
			res = pflib.sprintf("%10.3f %sK", val / prefix.mult, prefix.prefix);
		} else { // unrecognized unit, just print out the raw value
			// res = "" + val.toPrecision(6) + " " + p_bunit;
			res = pflib.sprintf("%10.6f %s", val / prefix.mult, p_bunit);
		}
		return res;
	};
	
	// formats a value depending on the cursor value <cur>, according to coordinate information
	// contained in <coord>
	this.formatCUNIT = function( cur, coord) {
		// assume linear interpolation for now (TBD: support other interpolations)
		var val = (cur - coord.crpix) * coord.cdelt + coord.crval;
		// figure out default prefix (probably applicable to most units)
		var pf = this.lookupPrefix( val);
		if( coord.ctype == "FREQ" || coord.ctype == "FREQUENCY") {
			// figure out precision
			var precision = Math.max( this.precision( coord.cdelt / pf.mult), this.precision( coord.crval / pf.mult));
			return "Frequency: " + (val / pf.mult).toFixed(precision) + " " + pf.prefix + "Hz";
		}
		if( coord.ctype == "STOKES") {
			if( val ==  1) return "Stokes: I";
			if( val ==  2) return "Stokes: Q";
			if( val ==  3) return "Stokes: U";
			if( val ==  4) return "Stokes: V";
			if( val == -1) return "Stokes: RR";
			if( val == -2) return "Stokes: LL";
			if( val == -3) return "Stokes: RL";
			if( val == -4) return "Stokes: LR";
			if( val == -5) return "Stokes: XX";
			if( val == -6) return "Stokes: YY";
			if( val == -7) return "Stokes: XY";
			if( val == -8) return "Stokes: YX";
			return "Stokes: " + val;
		}
		return "" + coord.ctype + ": " + val + " " + coord.cunit;
	};
	
	this.worldposMyOwn = function( xpix, ypix, xref, yref, xrefpix, yrefpix, xinc, yinc, rot, type) {
		// default: result is invalid
		var res = { ra: 0, dec: 0, success: false };
		
		// setup some constants
		var cond2r = 1.745329252e-2, twopi = 6.28318530717959, deps = 1.0e-5;

		var rotr = rot * cond2r;
		
		var x = (xpix - xrefpix) * xinc * cond2r;
		var y = (ypix - yrefpix) * yinc * cond2r;
				
		var L = x * Math.cos(rotr) - y * Math.sin(rotr);
		var M = x * Math.sin(rotr) + y * Math.cos(rotr);
				
		var cosr0 = Math.cos( yref * cond2r);
		var sinr0 = Math.sin( yref * cond2r);
		var sqrt = Math.sqrt( 1 - L*L - M*M);
		var a0 = xref * cond2r;
		
		var decr = Math.asin( M * cosr0 + sinr0*sqrt);
		var rar = a0 + Math.atan2( L, cosr0 * sqrt - M * sinr0);
		
		res.ra = rar / cond2r;
		res.dec = decr / cond2r;
		
		return res;
	};

	//-----------------------------------------------------------------------
	// routine to determine accurate position for pixel coordinates          
	// Does: -SIN, -TAN, -ARC, -NCP, -GLS, -MER, -AIT projections            
	// anything else is linear (== -CAR)                                     
	// Input:                                                                
	//   f   xpix    x pixel number  (RA or long without rotation)           
	//   f   ypiy    y pixel number  (dec or lat without rotation)           
	//   d   xref    x reference coordinate value (deg)                      
	//   d   yref    y reference coordinate value (deg)                      
	//   f   xrefpix x reference pixel                                       
	//   f   yrefpix y reference pixel                                       
	//   f   xinc    x coordinate increment (deg)                            
	//   f   yinc    y coordinate increment (deg) 
	//       cd1     rotation matrix coefficent
	//       cd2     rotation matrix coefficent                           
	//   f   rot     rotation (deg)  (from N through E)                      
	//   c  *type    projection type code e.g. "-SIN";                       
	// Output:                                                               
	//   { ra, dec, success }                                                
	//-----------------------------------------------------------------------
	// converted from from cfitsio C source code to javascript by Pavol Federl
	this.worldpos = function( xpix, ypix, xref, yref, xrefpix, yrefpix, xinc, yinc, cd1, cd2, rot, type) {
		// default: result is invalid
		var res = { ra: 0, dec: 0, success: false };
		
		// setup some constants
		var cond2r = 1.745329252e-2, twopi = 6.28318530717959, deps = 1.0e-5;

		var cosr = 1;
		var sinr = 0;
		var dy;
		var dx;

		if (cd1 == null) {
			//   Offset from ref pixel
			dx = (xpix-xrefpix) * xinc;
			dy = (ypix-yrefpix) * yinc;
			//   Take out rotation
			cosr = Math.cos(rot*cond2r);
			sinr = Math.sin(rot*cond2r);
			if (rot != 0.0) {
				var temp = dx * cosr - dy * sinr;
				 dy = dy * cosr + dx * sinr;
				 dx = temp;
			}
		}
		else {
			dx = cd1.a*(xpix-xrefpix) + cd1.b*(ypix-yrefpix);
			dy = cd2.a*(xpix-xrefpix) + cd2.b*(ypix-yrefpix);
		}
		
		var xpos = xref + dx;
		var ypos = yref + dy;
		// convert to radians
		var ra0 = xref * cond2r;
		var dec0 = yref * cond2r;
		var l = dx * cond2r;
		var m = dy * cond2r;
		var sins = l*l + m*m;
		var cos0 = Math.cos(dec0);
		var sin0 = Math.sin(dec0);

		// process by case  
		var rat, dect;
		if( type == "CAR") {
		    rat =  ra0 + l;
		    dect = dec0 + m;
		} else if( type == "SIN") {
			if( sins > 1.0) return res;
			var coss = Math.sqrt (1.0 - sins);
			var dt = sin0 * coss + cos0 * m;
			if ((dt>1.0) || (dt<-1.0)) return res;
			dect = Math.asin (dt);
			rat = cos0 * coss - sin0 * m;
			if ((rat==0.0) && (l==0.0)) return res;
			rat = Math.atan2 (l, rat) + ra0;
		} else if( type == "TAN") {
	        var x = cos0*Math.cos(ra0) - l*Math.sin(ra0) - m*Math.cos(ra0)*sin0;
	        var y = cos0*Math.sin(ra0) + l*Math.cos(ra0) - m*Math.sin(ra0)*sin0;
	        var z = sin0 + m*cos0;
	        rat  = Math.atan2( y, x );
	        dect = Math.atan ( z / Math.sqrt(x*x+y*y) );
		} else { // unknown type, assume linear (-CAR)
		      rat =  ra0 + l;
		      dect = dec0 + m;
		}
		
		//  return ra in range
		var raout = rat;
		var decout = dect;
		if (raout-ra0>twopi/2.0) raout = raout - twopi;
		if (raout-ra0<-twopi/2.0) raout = raout + twopi;
		if (raout < 0.0) raout += twopi;

		//  correct units back to degrees
		xpos  = raout  / cond2r;
		ypos  = decout  / cond2r;

		res.ra = xpos;
		res.dec = ypos;

		return res;
		
		/* code below has not yet been coverted
			      case 3:   // -ARC Arc
			        if (sins>=twopi*twopi/4.0) return(*status = 501);
			        sins = sqrt(sins);
			        coss = cos (sins);
			        if (sins!=0.0) sins = sin (sins) / sins;
			        else
			          sins = 1.0;
			        dt = m * cos0 * sins + sin0 * coss;
			        if ((dt>1.0) || (dt<-1.0)) return(*status = 501);
			        dect = asin (dt);
			        da = coss - dt * sin0;
			        dt = l * sins * cos0;
			        if ((da==0.0) && (dt==0.0)) return(*status = 501);
			        rat = ra0 + atan2 (dt, da);
			        break;
			      case 4:   // -NCP North celestial pole
			        dect = cos0 - m * sin0;
			        if (dect==0.0) return(*status = 501);
			        rat = ra0 + atan2 (l, dect);
			        dt = cos (rat-ra0);
			        if (dt==0.0) return(*status = 501);
			        dect = dect / dt;
			        if ((dect>1.0) || (dect<-1.0)) return(*status = 501);
			        dect = acos (dect);
			        if (dec0<0.0) dect = -dect;
			        break;
			      case 5:   // -GLS global sinusoid
			        dect = dec0 + m;
			        if (fabs(dect)>twopi/4.0) return(*status = 501);
			        coss = cos (dect);
			        if (fabs(l)>twopi*coss/2.0) return(*status = 501);
			        rat = ra0;
			        if (coss>deps) rat = rat + l / coss;
			        break;
			      case 6:   // -MER mercator
			        dt = yinc * cosr + xinc * sinr;
			        if (dt==0.0) dt = 1.0;
			        dy = (yref/2.0 + 45.0) * cond2r;
			        dx = dy + dt / 2.0 * cond2r;
			        dy = log (tan (dy));
			        dx = log (tan (dx));
			        geo2 = dt * cond2r / (dx - dy);
			        geo3 = geo2 * dy;
			        geo1 = cos (yref*cond2r);
			        if (geo1<=0.0) geo1 = 1.0;
			        rat = l / geo1 + ra0;
			        if (fabs(rat - ra0) > twopi) return(*status = 501); 
			        dt = 0.0;
			        if (geo2!=0.0) dt = (m + geo3) / geo2;
			        dt = exp (dt);
			        dect = 2.0 * atan (dt) - twopi / 4.0;
			        break;
			      case 7:   // -AIT Aitoff
			        dt = yinc*cosr + xinc*sinr;
			        if (dt==0.0) dt = 1.0;
			        dt = dt * cond2r;
			        dy = yref * cond2r;
			        dx = sin(dy+dt)/sqrt((1.0+cos(dy+dt))/2.0) -
			            sin(dy)/sqrt((1.0+cos(dy))/2.0);
			        if (dx==0.0) dx = 1.0;
			        geo2 = dt / dx;
			        dt = xinc*cosr - yinc* sinr;
			        if (dt==0.0) dt = 1.0;
			        dt = dt * cond2r;
			        dx = 2.0 * cos(dy) * sin(dt/2.0);
			        if (dx==0.0) dx = 1.0;
			        geo1 = dt * sqrt((1.0+cos(dy)*cos(dt/2.0))/2.0) / dx;
			        geo3 = geo2 * sin(dy) / sqrt((1.0+cos(dy))/2.0);
			        rat = ra0;
			        dect = dec0;
			        if ((l==0.0) && (m==0.0)) break;
			        dz = 4.0 - l*l/(4.0*geo1*geo1) - ((m+geo3)/geo2)*((m+geo3)/geo2) ;
			        if ((dz>4.0) || (dz<2.0)) return(*status = 501);
			        dz = 0.5 * sqrt (dz);
			        dd = (m+geo3) * dz / geo2;
			        if (fabs(dd)>1.0) return(*status = 501);
			        dd = asin (dd);
			        if (fabs(cos(dd))<deps) return(*status = 501);
			        da = l * dz / (2.0 * geo1 * cos(dd));
			        if (fabs(da)>1.0) return(*status = 501);
			        da = asin (da);
			        rat = ra0 + 2.0 * da;
			        dect = dd;
			        break;
			      case 8:   // -STG Sterographic
			        dz = (4.0 - sins) / (4.0 + sins);
			        if (fabs(dz)>1.0) return(*status = 501);
			        dect = dz * sin0 + m * cos0 * (1.0+dz) / 2.0;
			        if (fabs(dect)>1.0) return(*status = 501);
			        dect = asin (dect);
			        rat = cos(dect);
			        if (fabs(rat)<deps) return(*status = 501);
			        rat = l * (1.0+dz) / (2.0 * rat);
			        if (fabs(rat)>1.0) return(*status = 501);
			        rat = asin (rat);
			        mg = 1.0 + sin(dect) * sin0 + cos(dect) * cos0 * cos(rat);
			        if (fabs(mg)<deps) return(*status = 501);
			        mg = 2.0 * (sin(dect) * cos0 - cos(dect) * sin0 * cos(rat)) / mg;
			        if (fabs(mg-m)>deps) rat = twopi/2.0 - rat;
			        rat = ra0 + rat;
			        break;
			      default:
			          // fall through to here on error
			          return(*status = 504);
			      }
			      */
	};
	
	// parses ctype into type/alg according to fits standard 3.0
	// e.g. 'RA---SIN' would be parsed to 'RA' and 'SIN'
	//      'RA' would be parsed to 'RA' and ''
	//      'FREQUENCY' would be parsed to 'FREQUENCY' and ''
	this.parseCTYPE = function( ctype) {
		// if we don't have at least 6 characters, then CTYPE is not of the form 'XXXX-YYY'
		if( ctype.length < 6) return { type: ctype, alg: '' }
		// if the 5th character is not '-', then CTYPE is not of the form 'XXXX-YYY'
		if( ctype[4] != '-') return { type: ctype, alg: '' }
		// split CTYPE into 4 characters and the rest
		var res = { type: ctype.substr(0, 4), alg: ctype.substr(5) }
		// remove trailing '-' from type
		while( res.type.length > 0 && res.type[res.type.length-1] == '-')
			res.type = res.type.substr( 0, res.type.length - 1);
		// remove trailing ' ' from alg
		while( res.alg.length > 0 && res.alg[res.alg.length-1] == ' ')
			res.alg = res.alg.substr( 0, res.alg.length - 1);

		return res;
	};
	
	// return information about a coordinate system based on CTYPE and EQUINOX
	this.getCoordInfo = function( ctype, equinox) {
		var res = {};
		res.pctype = this.parseCTYPE( ctype);
		res.coordSystem = this.unknown;
		if( res.pctype.type == 'GLON' || res.pctype.type == 'GLAT') res.coordSystem = this.GAL;
		if( res.pctype.type == 'ELON' || res.pctype.type == 'ELAT') res.coordSystem = this.ECL;
		if( res.pctype.type == 'RA' || res.pctype.type == 'DEC') {
			if( equinox == 2000)
				res.coordSystem = this.FK5;
			else
				res.coordSystem = this.FK4;
		}
		res.isCelestialLongitude = function() {
			if( this.pctype.type == 'GLON') return true;
			if( this.pctype.type == 'RA'  ) return true;
			if( this.pctype.type == 'ELON') return true;
			return false;
		}
		res.isCelestialLatitude = function() {
			if( this.pctype.type == 'GLAT') return true;
			if( this.pctype.type == 'DEC' ) return true;
			if( this.pctype.type == 'ELAT') return true;
			return false;
		}
		return res;
	};
	
	// coordinate system parameters
	this.FK4 = { label: 'B1950', l1: '&alpha;', l2: '&delta;' };
	this.FK5 = { label: 'J2000', l1: '&alpha;', l2: '&delta;' };
	this.GAL = { label: 'Gala.', l1: 'l', l2: 'b' };
	this.ECL = { label: 'Ecli.', l1: '&lambda;', l2: '&beta;' };
	this.unknown = { label: 'Unknown' };
	
	// given CTYPE and EQUINOX, returns a known celestial coordinate system type 
	this.ctypeToCoordSystem = function( ctype, equinox) {
		var ct = ctype.substr(0, 4);
		console.log( 'ctype2coordsystem ct = ', ct, 'equinox = ', equinox);
		if( ct == "RA--" || ct == "RA  " || ct == "RA" || ct == "DEC-" || ct == "DEC " || ct == "DEC") {
			if( equinox == 2000)
				return this.FK5;
			else if( equinox == 1950)
				return this.FK4;
			else
				return this.unknown;
		} else {
			return this.unknown
		}
	};
	// returns information about the coordinate system being used
	// params is a structure
	//   cinfo1 = coordinate information about 1st axis
	//   cinfo2 = coordinate information about 2nd axis
	//   epoch  = epoch if specified
	//   equinox = equinox if specified
	// returns a structure
	//   system = coordinate system description
	//   error  = error if any (undefined if no error)
	this.getCoordSystem = function( params) {
		if( params.cinfo1.pctype.type == 'GLON' ) return this.GAL;
		if( params.cinfo1.pctype.type == 'RA' ) {
			if( params.equinox == 2000)
				return this.FK5;
			if( params.equinox == 1950)
				return this.FK4;
			return undefined;
		}
		if( params.cinfo1.pctype.type == 'ELON') return this.ECL;
		return undefined;
//		var coordSystem = this.ctypeToCoordSystem( params.ctype1, params.equinox);
//		if( coordSystem === undefined)
//			return { error: 'Unsupported coordinate system \'' + ctype1 + '\'' }
//		// make sure the coordinate systems match
//		if( params.ctype2 != undefined && coordSystem != this.ctypeToCoordSystem( params.ctype2, params.equinox))
//			return { error: 'Mismatched coordinate systems \'' + params.ctype1 + '\' and \'' + params.ctype2 + '\'' }
//		return coordSystem;
	};
	
	// formats the coordinates based on the coordinate system & whether to use sexagecimal or not
	this.formatCoordinates = function( coords, coordSystem, sexagecimal) {
		var res = "";
		res = res + coordSystem.l1 + ": ";
		if( sexagecimal) {
			if( coordSystem == this.FK4 || coordSystem == this.FK5 )
				res = res + this.formatSexagecimal( coords.ra * 240);
			else
				res = res + this.formatSexagecimal( coords.ra * 3600);
		} else
			res = res + this.printf( coords.ra, 9, 5);
		res = res + "   ";
		res = res + coordSystem.l2 + ": ";
		if( sexagecimal)
			res = res + this.formatSexagecimal( coords.dec * 3600);
		else
			res = res + this.printf( coords.dec, 9, 5);
		return res;
	};
	
	// format RA according to coordinate system & sexagecimal preference
	this.formatRA = function( ra, cs, sex) {
		if( sex) {
			if( cs == this.FK4 || cs == this.FK5) {
				return this.formatSexagecimal( ra * 240);
			} else {
				return this.formatSexagecimal( ra * 3600);
			}
		} else {
			return ra.toFixed(3);
		}
	};
	
	// format DEC according to coordinate system & sexagecimal preference
	this.formatDEC = function( dec, cs, sex) {
		if( sex) {
			return this.formatSexagecimal( dec * 3600);
		} else {
			return dec.toFixed(3);
		}
	};

	
	// converts celestial coordinates <c> from system <srcSystem> to <dstSystem>
	this.convertCoordinates = function( c, srcSystem, dstSystem) {
		// handle identity transformation right off the bat
		if( srcSystem == dstSystem) return c;
		// FK5 --> ???
		if( srcSystem == this.FK5) {
			if( dstSystem == this.FK4)
				return this.convertFK5toFK4( c);
			if( dstSystem == this.GAL)
				return this.convertFK4toGAL( this.convertFK5toFK4(c));
			if( dstSystem == this.ECL)
				return this.convertFK5toECL( c);
		}
		// FK4 --> ???
		if( srcSystem == this.FK4) {
			if( dstSystem == this.FK5)
				return this.convertFK4toFK5( c);
			if( dstSystem == this.GAL)
				return this.convertFK4toGAL( c);
			if( dstSystem == this.ECL)
				return this.convertFK5toECL( this.convertFK4toFK5(c));
		}
		// GAL --> ???
		if( srcSystem == this.GAL) {
			if( dstSystem == this.FK4)
				return this.convertGALtoFK4( c);
			if( dstSystem == this.FK5)
				return this.convertFK4toFK5( this.convertGALtoFK4(c));
			if( dstSystem == this.ECL)
				return this.convertFK5toECL( this.convertFK4toFK5( this.convertGALtoFK4(c)));
		}
		// ECL --> ???
		if( srcSystem == this.ECL) {
			if( dstSystem == this.FK4)
				return this.convertFK5toFK4( this.convertECLtoFK5( c));
			if( dstSystem == this.FK5)
				return this.convertECLtoFK5( c);
			if( dstSystem == this.GAL)
				return this.convertFK4toGAL( this.convertFK5toFK4( this.convertECLtoFK5( c)));
		}
		return { ra: 0, dec: 0 };
	};
	
	// converts RA,DEC from J2000 to B1950
	// input c = { ra: <ra in J2000>, dec: <dec in J2000> }
	// output  = { ra: <ra in B1950>, dec: <dec in B1950> }
	// from Jeroen Still's perl code
	// WARNING: This is an adaptation of the precession formulas given in
	// the astronomical Almanac 1996, page B43. It is assumed that radial 
	// velocity, parallax and proper motion are all zero.

	this.convertFK5toFK4 = function( c)
	{
		var ra2000 = c.ra;
		var dec2000 = c.dec;
		var rad = Math.PI/180.0;

		var x2000 = Math.cos( ra2000 * rad) * Math.cos( dec2000 * rad);
		var y2000 = Math.sin( ra2000 * rad) * Math.cos( dec2000 * rad);
		var z2000 = Math.sin( dec2000 * rad);

		var cosracosdec = 0.9999256795*x2000+0.0111814828*y2000+0.0048590039*z2000;
		var sinracosdec = -0.0111814828*x2000+0.9999374849*y2000-0.0000271771*z2000;
		var sindec = -0.0048590040*x2000-0.0000271557*y2000+0.9999881946*z2000;

		var cosdec = Math.sqrt(1.0-sindec*sindec);

		if( cosdec>0)
		{
			 var cosra=cosracosdec/cosdec;
			 var sinra=sinracosdec/cosdec;
		}
		else 
		{
		    if (cosdec<0)  { throw "ERROR: Cosine(Declination) = $cosdec\n"; }
		    var sinra=0;
		    var cosra=1;
		}

		var ra1950  = Math.atan2( sinra,  cosra ) / rad;
		var dec1950 = Math.atan2( sindec, cosdec) / rad;
		// wrap around ra if necessary
		if( ra1950 < 0) ra1950 += 360;
		else if( ra1950 >= 360) ra1950 -= 360;
		if( ra1950 > 360) console.log( '************* ra > 360 in fk5->fk4!!!!');

		return { ra: ra1950, dec: dec1950 };

	};
	
	// converts degrees to radians
	this.degrad = function( deg) {
		return deg * Math.PI / 180.0;
	};
	
	// convert radians to degrees
	this.raddeg= function( deg) {
		return deg * 180.0 / Math.PI;
	};
	
	// convert seconds to radians
	this.secrad = function( sec) {
		return sec * Math.PI / (180*3600);
	};
	
	// matrix for FK4 to FK5
	this.em = [
	    [    0.9999256782,
	        -0.0111820611,
	        -0.0048579477,
	         0.00000242395018,
	        -0.00000002710663,
	        -0.00000001177656 ],
	 
	    [    0.0111820610,
	         0.9999374784,
	        -0.0000271765,
	         0.00000002710663,
	         0.00000242397878,
	        -0.00000000006587 ],
	 
	    [    0.0048579479,
	        -0.0000271474,
	         0.9999881997,
	         0.00000001177656,
	        -0.00000000006582,
	         0.00000242410173 ],
	 
	    [   -0.000551,
	        -0.238565,
	         0.435739,
	         0.99994704,
	        -0.01118251,
	        -0.00485767 ],
	 
	    [    0.238514,
	        -0.002667,
	        -0.008541,
	         0.01118251,
	         0.99995883,
	        -0.00002718 ],
	 
	    [   -0.435623,
	         0.012254,
	         0.002117,
	         0.00485767,
	        -0.00002714,
	         1.00000956 ]
	    ];

	
	// converts RA,DEC from B1950 to J2000, adapted from wcscon.c
	// input c = { ra: <ra in B1950>, dec: <dec in B1950> }
	// output  = { ra: <ra in J2000>, dec: <dec in J2000> }
	this.convertFK4toFK5 = function( c) {
		var ra1950 = c.ra,
			dec1950 = c.dec;
		var rapm = 0; // proper motion in right ascension
		var decpm = 0; // proper motion in declination
		var parallax = 0; // parallax (arcsec)
		var rv = 0; // radial velocity (km/s, +ve = moving away)
		
		// constants
		var vf = 21.095; // km/s to AU per tropical century
		// convert to radians
		var r1950 = this.degrad( ra1950);
		var d1950 = this.degrad( dec1950);
	    // Convert B1950 RA and Dec proper motion from degrees/year to arcsec/tc
	    var ur = rapm  * 360000.0;
	    var ud = decpm * 360000.0;
	    // Convert direction to Cartesian
	    var sr = Math.sin (r1950);
	    var cr = Math.cos (r1950);
	    var sd = Math.sin (d1950);
	    var cd = Math.cos (d1950);
	    var r0 = [ cr * cd, sr * cd, sd];
	    var rd0 = [0,0,0];
	    // Convert motion to Cartesian
	    var w = vf * rv * parallax;
	    if (ur != 0 || ud != 0 || (rv != 0 && parallax != 0)) {
	        rd0[0] = (-sr * cd * ur) - (cr * sd * ud) + (w * r0[0]);
	        rd0[1] =  (cr * cd * ur) - (sr * sd * ud) + (w * r0[1]);
	        rd0[2] =                        (cd * ud) + (w * r0[2]);
	    }
	    // Remove e-terms from position and express as position+velocity 6-vector
	    var a = [ -1.62557e-6, -0.31919e-6, -0.13843e-6 ];
	    w = (r0[0] * a[0]) + (r0[1] * a[1]) + (r0[2] * a[2]);
	    var v1 = [0,0,0,0,0,0];
	    for( var i = 0; i < 3; i++)
	        v1[i] = r0[i] - a[i] + (w * r0[i]);

	    // Remove e-terms from proper motion and express as 6-vector
	    var ad = [ 1.245e-3,  -1.580e-3,  -0.659e-3 ];
	    var wd = (r0[0] * ad[0]) + (r0[1] * ad[1]) + (r0[2] * ad[2]);
	    for ( var i = 0; i < 3; i++)
	        v1[i+3] = rd0[i] - ad[i] + (wd * r0[i]);

	    // Convert position + velocity vector to FK5 system
	    var v2 = [0,0,0,0,0,0];
	    for ( var i = 0; i < 6; i++) {
	        w = 0;
	        for (var j = 0; j < 6; j++) {
	            w += this.em[i][j] * v1[j];
	        }
	        v2[i] = w;
	    }

	    // Vector components
	    var x = v2[0];
	    var y = v2[1];
	    var z = v2[2];
	    var xd = v2[3];
	    var yd = v2[4];
	    var zd = v2[5];

	    // Magnitude of position vector
	    var rxysq = x*x + y*y;
	    var rxy = Math.sqrt (rxysq);
	    var rxyzsq = rxysq + z*z;
	    var rxyz = Math.sqrt (rxyzsq);

	    var spxy = (x * xd) + (y * yd);
	    var spxyz = spxy + (z * zd);

	    // Convert back to spherical coordinates
	    var r2000 = 0;
	    if (x == 0 && y == 0)
	        r2000 = 0;
	    else {
	        r2000 = Math.atan2 (y,x);
	        if (r2000 < 0)
	            r2000 = r2000 + 2 * Math.PI;
	    }
	    var d2000 = Math.atan2 (z,rxy);

	    if (rxy > tiny) {
	        ur = ((x * yd) - (y * xd)) / rxysq;
	        ud = ((zd * rxysq) - (z * spxy)) / (rxyzsq * rxy);
	        }

	    var tiny = 1e-30;
	    if (parallax > tiny) {
	        rv = spxyz / (parallax * rxyz * vf);
	        parallax = parallax / rxyz;
	    }

	    // Return results
	    return {
	    	ra: this.raddeg( r2000),
	    	dec: this.raddeg( d2000),
	    	rapm: ur / 360000.0,
	    	decpm: ud / 360000.0
	    };
	};
	
	// converts RA,DEC from B1950 to Glactic
	// input c = { ra: <ra in B1950>, dec: <dec in B1950> }
	// output  = { ra: <ra in J2000>, dec: <dec in J2000> }
	//
	// from Jeroen Still's perl code
	// WARNING: This is an adaptation of the precession formulas given in
	// the astronomical Almanac 1996, page B43. It is assumed that radial 
	// velocity, parallax and proper motion are all zero.

	this.convertFK4toGAL = function( c) {
		var ra = c.ra,
			dec = c.dec;
		
		var rad = Math.PI / 180.0;

		var cosbcosl = Math.cos(dec*rad) * Math.cos((ra-282.25)*rad);
		var cosbsinl = Math.cos(dec*rad) * Math.sin((ra-282.25)*rad) * Math.cos(62.6*rad)
					 + Math.sin(dec*rad) * Math.sin(62.6*rad);
		var sinb = Math.sin(dec*rad) * Math.cos(62.6*rad)
				   - Math.cos(dec*rad) * Math.sin((ra-282.25)*rad) * Math.sin(62.6*rad);

		var cosb = Math.sqrt(1.0-sinb*sinb);

		var cols = 1, sinl = 0;
		if (cosb>0) {
		    cosl = cosbcosl / cosb;
		    sinl = cosbsinl / cosb;
		}

		var bb = Math.atan2( sinb, cosb) / rad;
		var ll = Math.atan2( sinl, cosl) / rad;

		var ll = ll + 33.0;

		return { ra: ll, dec: bb };
	};
	
	//
	// Convert right ascension, declination, and distance to
	// geocentric equatorial rectangular coordinates 
	// Inputs:
	//	  rra    - Right ascension in radians
	//	  rdec   - Declination in radians
	//	  r      - Distance to object in same units as pos
	// Result:
	//    pos[3] - x,y,z geocentric equatorial position of object (returned)
	//
	this.s2v3 = function( rra,rdec,r ) {
		var pos = [
		           r * Math.cos (rra) * Math.cos (rdec),
		           r * Math.sin (rra) * Math.cos (rdec),
		           r * Math.sin (rdec)
		          ];
		return pos;
	};
	
	//
	// Convert geocentric equatorial rectangular coordinates to
	// right ascension, declination, and distance
	// Inputs:
	// 		pos[3] - x,y,z geocentric equatorial position of object
	// Result:
	//   { rra   - Right ascension in radians
	//     rdec  - Declination in radians (returned)
	//     r     - Distance to object in same units as pos
	//   }
	//
	this.v2s3 = function( pos) {
	    var x = pos[0];
	    var y = pos[1];
	    var z = pos[2];

	    var rra = Math.atan2 (y, x);

	    // Keep RA within 0 to 2pi range 
	    if (rra < 0.0)
	        rra = rra + (2.0 * Math.PI);
	    if (rra > 2.0 * Math.PI)
	        rra = rra - (2.0 * Math.PI);

	    var rxy2 = x*x + y*y;
	    var rxy = Math.sqrt (rxy2);
	    var rdec = Math.atan2 (z, rxy);

	    var z2 = z * z;
	    var r = Math.sqrt (rxy2 + z2);

	    return { rra: rra, rdec: rdec, r:r }
	};


	
	// matrix used in GALtoFK4
	this.bgal =
    [[-0.066988739415,-0.872755765852,-0.483538914632],
     [0.492728466075,-0.450346958020, 0.744584633283],
     [-0.867600811151,-0.188374601723, 0.460199784784]];

	
	// converts RA,DEC from B1950 to Glactic
	// input c = { ra: <ra in B1950>, dec: <dec in B1950> }
	// output  = { ra: <ra in J2000>, dec: <dec in J2000> }
	//
	// adapted from wsccon.c (
	this.convertGALtoFK4= function( c) {
		var dtheta = c.ra,
			dphi = c.dec;
		
	    //  spherical to cartesian 
	    var dl = c.ra;
	    var db = c.dec;
	    var rl = this.degrad (dl);
	    var rb = this.degrad (db);
	    var r = 1.0;
	    pos = this.s2v3 (rl,rb,r);

	    //  rotate to equatorial coordinates 
	    var pos1 = [];
	    for (var i = 0; i < 3; i++) {
	        pos1[i] = pos[0]*this.bgal[0][i] + pos[1]*this.bgal[1][i] + pos[2]*this.bgal[2][i];
	    }

	    //  cartesian to spherical 
	    var sp = this.v2s3 (pos1);

		return { ra: this.raddeg (sp.rra), dec: this.raddeg (sp.rdec) }
	};
	
	//
	// convert J2000 to eclipctic
	// input:
	//   c.ra  = J2000 right ascension in degrees
	//   c.dec = J2000 declination in degrees
	// result:
	//   { ra: galactic logitude in degrees
	//     dec: galacit latitude in degrees
	//   }
	//     
	this.convertFK5toECL = function( c) {

		var dtheta = c.ra,
			dphi   = c.dec;

		var rtheta = this.degrad (dtheta);
	    var rphi = this.degrad (dphi);

	    // Convert RA,Dec to x,y,z 
	    r = 1.0;
	    var v1 = this.s2v3 (rtheta, rphi, r);

	    var t = 0;
	 
	    // Mean obliquity 
	    eps0 = this.secrad ((84381.448 + (-46.8150 + (-0.00059 + 0.001813*t) * t) * t));
	 
	    // Form the equatorial to ecliptic rotation matrix (IAU 1980 theory).
	    //  References: Murray, C.A., Vectorial Astrometry, section 4.3.
	    //    The matrix is in the sense   v[ecl]  =  rmat * v[equ];  the
	    //    equator, equinox and ecliptic are mean of date. 
	    var sin = Math.sin( eps0), cos = Math.cos( eps0);
	    var rmat = [ [1, 0, 0], [0, cos, sin], [0, -sin, cos]];

	    // Multiply position vector by equatoria to eccliptic rotation matrix 
	    var v2 = [0,0,0];
	    for (i = 0; i < 3; i++) {
	        for (j = 0; j < 3; j++)
	            v2[i] = v2[i] + (rmat[i][j] * v1[j]);
	    }

	    // Convert x,y,z to latitude, longitude 
	    var sp = this.v2s3 (v2);

	    // Convert from radians to degrees 
	    return { ra:  this.raddeg ( sp.rra), dec: this.raddeg (sp.rdec) }
	};

	//
	// convert Ecliptic to J2000
	// input:
	//   c.ra  = ecliptic longitude
	//   c.dec = ecliptic latitude
	// result:
	//   { ra:  J2000 right ascension
	//     dec: J2000 declination
	//   }
	//     
	this.convertECLtoFK5 = function( c) {

		var dtheta = c.ra,
			dphi   = c.dec;

		var rtheta = this.degrad (dtheta);
	    var rphi = this.degrad (dphi);
	    
	    // Convert RA,Dec to x,y,z 
	    var r = 1.0;
	    var v1 = this.s2v3 (rtheta, rphi, r);

	    // Interval between basic epoch J2000.0 and current epoch (JC) in centuries
	    var t = 0;
	 
	    // Mean obliquity 
	    var eps0 = this.secrad ((84381.448 + (-46.8150 + (-0.00059 + 0.001813*t) * t) * t));
	 
	    // Form the equatorial to ecliptic rotation matrix (IAU 1980 theory).
	    //  References: Murray, C.A., Vectorial Astrometry, section 4.3.
	    //    The matrix is in the sense   v[ecl]  =  rmat * v[equ];  the
	    //    equator, equinox and ecliptic are mean of date. 
	    var sin = Math.sin( eps0), cos = Math.cos( eps0);
	    var rmat = [ [1, 0, 0], [0, cos, sin], [0, -sin, cos]];
	 
	    // Multiply position vector by ecliptic to equatorial rotation matrix 
	    var v2 = [0,0,0];
	    for (i = 0; i < 3; i++) {
	        for (j = 0; j < 3; j++)
	            v2[i] = v2[i] + (rmat[j][i] * v1[j]);
	    }

	    // Cartesian to spherical 
	    var sp = this.v2s3(v2);

	    // Convert from radians to degrees 
	    return { ra: this.raddeg (sp.rra), dec: this.raddeg (sp.rdec) }
	};

	//-----------------------------------------------------------------------
	// routine to determine accurate pixel coordinates for an RA and Dec
	// converted to javascript by Pavol from worldpos from ds9 software
	// Input:
	//   xpos, ypos = longitude, latitude
	//   wcs  ={
	//     xref: crval of longitude
	//	   yref: crval of latitude
	//     xrefpix: crpix of longitude
	//     yrefpix: crpix of latitude
	//     xinc: crdelt of longitude
	//     yinc: crdelt of latitude
	//     rot: rotation factor
	//     cd1
	//     cd2
	//     prjcode: 'SIN', 'CAR', 'TAN', etc.
	//     nxpix: number of pixels in longitude direction
	//   }
	// Output:
	//   { x: x coordinate of the fits pixel
	//     y: y coordinate of the fits pixel
	//     error: undefined if successful, otherwise a text message
	//   }
	// So far does projections:
	//   SIN, TAN, CAR
	// Everything else is linear for now
	
	this.worldpix = function (xpos, ypos, wcs)
	{
//		// Input:
//		double	xpos;		// x (RA) coordinate (deg)
//		double	ypos;		// y (dec) coordinate (deg)
//		struct WorldCoor *wcs;	// WCS parameter structure
//	
//		// Output:
//		double	*xpix;		// x pixel number  (RA or long without rotation)
//		double	*ypix;		// y pixel number  (dec or lat without rotation)

//		double dx, dy, ra0, dec0, ra, dec, coss, sins, dt, da, dd, sint;
//		double l, m, geo1, geo2, geo3, sinr, cosr, tx, x, a2, a3, a4;
//		double rthea,gamby2,a,b,c,phi,an,rap,v,tthea,co1,co2,co3,co4,ansq; // COE
//		double cond2r=1.745329252e-2, deps=1.0e-5, twopi=6.28318530717959;
		var cond2r=1.745329252e-2, deps=1.0e-5, twopi=6.28318530717959;

//		// Structure elements
//		double xref;		// x reference coordinate value (deg)
//		double yref;		// y reference coordinate value (deg)
//		double xrefpix;	// x reference pixel
//		double yrefpix;	// y reference pixel
//		double xinc;		// x coordinate increment (deg)
//		double yinc;		// y coordinate increment (deg)
//		double rot;		// Optical axis rotation (deg)  (from N through E)
//		int itype;
//
//		// Set local projection parameters
//		xref = wcs->xref;
//		yref = wcs->yref;
//		xrefpix = wcs->xrefpix;
//		yrefpix = wcs->yrefpix;
//		xinc = wcs->xinc;
//		yinc = wcs->yinc;
//		rot = degrad (wcs->rot);
//		cosr = cos (rot);
//		sinr = sin (rot);
		var xref    = wcs.xref,
			yref    = wcs.yref,
			xrefpix = wcs.xrefpix,
			yrefpix = wcs.yrefpix,
			xinc    = wcs.xinc,
			yinc    = wcs.yinc,
			rot     = this.degrad( wcs.rot);
			cd1 = wcs.cd1;
			cd2 = wcs.cd2;
		var cosr    = Math.cos( rot),
			sinr    = Math.sin( rot);

//		// Projection type
//		itype = wcs->prjcode;
		var itype = wcs.prjcode;
//
//		// Nonlinear position
//		if (itype > 0) {
//			if (wcs->coorflip) {
//				dec0 = degrad (xref);
//				ra0 = degrad (yref);
//				dt = xpos - yref;
//			}
//			else {
//				ra0 = degrad (xref);
//				dec0 = degrad (yref);
//				dt = xpos - xref;
//			}
//
//			// 0h wrap-around tests added by D.Wells 10/12/1994:
//			// Modified to exclude weird reference pixels by D.Mink 2/3/2004
//			if (xrefpix*xinc > 180.0 || xrefpix*xinc < -180.0) {
//				if (dt > 360.0) xpos -= 360.0;
//				if (dt < 0.0) xpos += 360.0;
//			}
//			else {
//				if (dt > 180.0) xpos -= 360.0;
//				if (dt < -180.0) xpos += 360.0;
//			}
//			// NOTE: changing input argument xpos is OK (call-by-value in C!)
//
//			ra = degrad (xpos);
//			dec = degrad (ypos);
//
//			// Compute direction cosine
//			coss = cos (dec);
//			sins = sin (dec);
//			l = sin(ra-ra0) * coss;
//			sint = sins * sin(dec0) + coss * cos(dec0) * cos(ra-ra0);
//		}
//		else {
//			l = 0.0;
//			sint = 0.0;
//			sins = 0.0;
//			coss = 0.0;
//			ra = 0.0;
//			dec = 0.0;
//			ra0 = 0.0;
//			dec0 = 0.0;
//			m = 0.0;
//		}
		var l = 0, sint = 0, sins = 0, coss = 0, ra = 0, dec = 0, ra0 = 0, dec0 = 0, m = 0, dt = 0;
		if( itype != undefined) {
			ra0 = this.degrad (xref);
			dec0 = this.degrad (yref);
			dt = xpos - xref;
			ra = this.degrad (xpos);
			dec = this.degrad (ypos);

			// Compute direction cosine
			coss = Math.cos (dec);
			sins = Math.sin (dec);
			l = Math.sin(ra-ra0) * coss;
			sint = (sins * Math.sin(dec0)) + (coss * Math.cos(dec0) * Math.cos(ra-ra0));
		}
//
//		// Process by case 
//		switch (itype) {
//
//		case WCS_CAR:   // -CAR Cartesian
//			l = ra - ra0;
//			m = dec - dec0;
//			break;
		if( itype == 'CAR') {
			l = ra - ra0;
			m = dec - dec0;
		}
//		case WCS_SIN:   // -SIN sin
//			if (sint<0.0) return 1;
//			m = sins * cos(dec0) - coss * sin(dec0) * cos(ra-ra0);
//			break;
		else if( itype == 'SIN') {
			if( sint < 0.0) {
				return { error: 'Angle too large for projection' };
			}
			m = sins * Math.cos(dec0) - coss * Math.sin(dec0) * Math.cos(ra-ra0);
		}
//		case WCS_TAN:   // -TAN tan 
//		if (sint<=0.0) return 1;
//		m = sins * sin(dec0) + coss * cos(dec0) * cos(ra-ra0);
//		l = l / m;
//		m = (sins * cos(dec0) - coss * sin(dec0) * cos(ra-ra0)) / m;
//		break;
		else if( itype == 'TAN') {
			if( sint <= 0.0) {
				return { error: 'Angle too large for projection' };
			}
			m = sins * Math.sin(dec0) + coss * Math.cos(dec0) * Math.cos(ra-ra0);
			l = l / m;
			m = (sins * Math.cos(dec0) - coss * Math.sin(dec0) * Math.cos(ra-ra0)) / m;
		}
//		case WCS_ARC:   // -ARC Arc
//			m = sins * sin(dec0) + coss * cos(dec0) * cos(ra-ra0);
//			if (m<-1.0) m = -1.0;
//			if (m>1.0) m = 1.0;
//			m = acos (m);
//			if (m!=0) 
//				m = m / sin(m);
//			else
//				m = 1.0;
//			l = l * m;
//			m = (sins * cos(dec0) - coss * sin(dec0) * cos(ra-ra0)) * m;
//			break;
//
//		case WCS_NCP:   // -NCP North celestial pole
//			if (dec0==0.0) 
//				return 1;  // can't stand the equator 
//			else
//				m = (cos(dec0) - coss * cos(ra-ra0)) / sin(dec0);
//			break;
//
//		case WCS_GLS:   // -GLS global sinusoid 
//		case WCS_SFL:   // -SFL Samson-Flamsteed 
//			dt = ra - ra0;
//			if (fabs(dec)>twopi/4.0) return 1;
//			if (fabs(dec0)>twopi/4.0) return 1;
//			m = dec - dec0;
//			l = dt * coss;
//			break;
//
//		case WCS_MER:   // -MER mercator
//			dt = yinc * cosr + xinc * sinr;
//			if (dt==0.0) dt = 1.0;
//			dy = degrad (yref/2.0 + 45.0);
//			dx = dy + dt / 2.0 * cond2r;
//			dy = log (tan (dy));
//			dx = log (tan (dx));
//			geo2 = degrad (dt) / (dx - dy);
//			geo3 = geo2 * dy;
//			geo1 = cos (degrad (yref));
//			if (geo1<=0.0) geo1 = 1.0;
//			dt = ra - ra0;
//			l = geo1 * dt;
//			dt = dec / 2.0 + twopi / 8.0;
//			dt = tan (dt);
//			if (dt<deps) return 2;
//			m = geo2 * log (dt) - geo3;
//			break;
//
//		case WCS_AIT:   // -AIT Aitoff
//			l = 0.0;
//			m = 0.0;
//			da = (ra - ra0) / 2.0;
//			if (fabs(da)>twopi/4.0) return 1;
//			dt = yinc*cosr + xinc*sinr;
//			if (dt==0.0) dt = 1.0;
//			dt = degrad (dt);
//			dy = degrad (yref);
//			dx = sin(dy+dt)/sqrt((1.0+cos(dy+dt))/2.0) -
//			sin(dy)/sqrt((1.0+cos(dy))/2.0);
//			if (dx==0.0) dx = 1.0;
//			geo2 = dt / dx;
//			dt = xinc*cosr - yinc* sinr;
//			if (dt==0.0) dt = 1.0;
//			dt = degrad (dt);
//			dx = 2.0 * cos(dy) * sin(dt/2.0);
//			if (dx==0.0) dx = 1.0;
//			geo1 = dt * sqrt((1.0+cos(dy)*cos(dt/2.0))/2.0) / dx;
//			geo3 = geo2 * sin(dy) / sqrt((1.0+cos(dy))/2.0);
//			dt = sqrt ((1.0 + cos(dec) * cos(da))/2.0);
//			if (fabs(dt)<deps) return 3;
//			l = 2.0 * geo1 * cos(dec) * sin(da) / dt;
//			m = geo2 * sin(dec) / dt - geo3;
//			break;
//
//		case WCS_STG:   // -STG Sterographic
//			da = ra - ra0;
//			if (fabs(dec)>twopi/4.0) return 1;
//			dd = 1.0 + sins * sin(dec0) + coss * cos(dec0) * cos(da);
//			if (fabs(dd)<deps) return 1;
//			dd = 2.0 / dd;
//			l = l * dd;
//			m = dd * (sins * cos(dec0) - coss * sin(dec0) * cos(da));
//			break;
//
//		case WCS_COE:    // allan: -COE projection added, AW, ESO
//			gamby2 = sin (dec0);
//			tthea = tan (dec0);
//			rthea = 1. / tthea;
//			a = -2. * tthea;
//			b = tthea * tthea;
//			c = tthea / 3.;
//			a2 = a * a;
//			a3 = a2 * a;
//			a4 = a2 * a2;
//			co1 = a/2.;
//			co2 = -0.125 * a2 + b/2.;
//			co3 = -0.25 * a*b + 0.0625 * a3 + c/2.0;
//			co4 = -0.125 * b*b - 0.25 * a*c + 0.1875 * b*a2 - (5.0/128.0)*a4;
//			phi = ra0 - ra;
//			an = phi * gamby2;
//			v = dec - dec0;
//			rap = rthea * (1.0 + v * (co1+v * (co2+v * (co3+v * co4))));
//			ansq = an * an;
//			if (wcs->rotmat)
//				l = rap * an * (1.0 - ansq/6.0) * (wcs->cd[0] / fabs(wcs->cd[0]));
//			else
//				l = rap * an * (1.0 - ansq/6.0) * (xinc / fabs(xinc));
//			m = rthea - (rap * (1.0 - ansq/2.0));
//			break;
//
//		}  // end of itype switch 
//
//		// Convert back to degrees  
//		if (itype > 0) {
//			dx = raddeg (l);
//			dy = raddeg (m);
//		}
//		// For linear or pixel projection 
//		else {
//			dx = xpos - xref;
//			dy = ypos - yref;
//		}

		// Convert back to degrees
		var dx, dy;
		if( itype != undefined) {
			dx = this.raddeg (l);
			dy = this.raddeg (m);
		} else { // For linear or pixel projection 
			dx = xpos - xref;
			dy = ypos - yref;
		}
//		if (wcs->coorflip) {
//			tx = dx;
//			dx = dy;
//			dy = tx;
//		}
//		// Scale and rotate using CD matrix 
//		if (wcs->rotmat) {
//			tx = dx * wcs->dc[0] + dy * wcs->dc[1];
//			dy = dx * wcs->dc[2] + dy * wcs->dc[3];
//			dx = tx;
//		}
//
//		// Scale and rotate using CDELTn and CROTA2 
//		else {
//
//			// Correct for rotation 
//			if (rot!=0.0) {
//				tx = dx*cosr + dy*sinr;
//				dy = dy*cosr - dx*sinr;
//				dx = tx;
//			}
//
//			// Scale using CDELT 
//			if (xinc != 0.)
//				dx = dx / xinc;
//			if (yinc != 0.)
//				dy = dy / yinc;
//		}

		if (cd1 == null) {
			// Scale and rotate using CDELTn and CROTA2 
			// Correct for rotation 
			if( rot != 0.0) {
				var tx = dx*cosr + dy*sinr;
				dy = dy*cosr - dx*sinr;
				dx = tx;
			}
			// Scale using CDELT 
			if (xinc != 0.0)
				dx = dx / xinc;
			if( yinc != 0.0)
				dy = dy / yinc;
		}
		else {
			// Need to take the inverse of the rotation coefficent matrix
			var det = (cd1.a*cd2.b) - (cd1.b*cd2.a);
			var dc1 = { a: cd2.b/det, b: -cd1.b/det };
			var dc2 = { a: -cd2.a/det, b: cd1.a/det };
			
			tx = dx * dc1.a + dy * dc1.b;
			dy = dx * dc2.a + dy * dc2.b;
			dx = tx;
		}
		
//
//		// Convert to pixels  
//		*xpix = dx + xrefpix;
//		if (itype == WCS_CAR) {
//			if (*xpix > wcs->nxpix) {
//				x = *xpix - (360.0 / xinc);
//				if (x > 0.0) *xpix = x;
//			}
//			else if (*xpix < 0) {
//				x = *xpix + (360.0 / xinc);
//				if (x <= wcs->nxpix) *xpix = x;
//			}
//		}
//		*ypix = dy + yrefpix;
//
//		return 0;
//	}  // end worldpix 

		// Convert to pixels  
		var xpix = dx + xrefpix;
/*
		if (itype == 'CAR') {
			if( xpix > wcs.nxpix) {
				var x = xpix - (360.0 / xinc);
				if (x > 0.0) xpix = x;
			}
			else if( xpix < 0) {
				var x = xpix + (360.0 / xinc);
				if( x <= wcs.nxpix) xpix = x;
			}
		}
		*/
		var ypix = dy + yrefpix;

		return { x: xpix, y: ypix }
	}
};
