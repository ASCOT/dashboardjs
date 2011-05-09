/**
 * @namespace The global ASCOT namespace
 * @type {Object} 
 */
var UW = UW || {};

// Debug flag. Enables/Disables debug messages
UW.DEBUG = true;

// Function to write debug messages (Enabled / Disabled by the flag debug)
UW.debugMessage = function(message){
	if (UW.DEBUG) { 
		console.log(message);
	}
};

UW.warningMessage = function(message, type){
	 console.log("WARNING: " + message);
};

UW.errorMessage = function(message, type){
	 console.log("ERROR: " + message);
};
