/**
 * @fileoverview DataInterface.js provides an interface for gadget-to-DataGadget communication
 * @version 0.1
 *  Date: 2/10
 * @author Ian SmithIan Smith  (imsmith@uw.edu)
 */

// Create the UW.astro namspace
if (!UW) var UW={};
if (!UW.astro) /** @namespace */ UW.astro={};

/**
 * DEBUG is a boolean that sets whether the debugLog() function writes messages to the 
 * console. Gadgets can use the debugLog to write debug messages, but they are only written
 * if this DEBUG is true.
 * @constant
 */
UW.astro.DEBUG = false;

/**
 * DEFAULT_NAMESPACE is the (string) name of the namespace that is created by default. Gadgets 
 * should use this namespace unless they want to register to a different namespace instead.
 * @constant
 */
UW.astro.DEFAULT_NAMESPACE = "NS1";

/**
* Writes message to console if debug (global) is true
* @type void
* @param {string} msg message to write to console
*/
UW.astro.debugLog = function(msg){
    if (this.DEBUG && window.console && console.log) { 
         console.log(msg);
    }
}          


UW.astro.Gadget = function(id){


	// Constants
  var DATAGADGET_TITLE = "DataGadgetv0.1",  // This is the name that will be searched 
                                            // for as the iframe of the DataGadget, so it must
                                            // match the iframe name of the datagadget or it will
                                            // never be found.
				DATAGADGET_OBJECT_NAME = "dg",
        FIND_GADGET_DELAY = 1000, // number of seconds to delay before 
                                  // retrying to find the datagadget
        FIND_GADGET_MAX_RETRIES = 20, // max retries to find DG before accepting failure
        MM_TIMER_DURATION = 4; // duration to display notifications in seconds

	var _gadgetManager;
	findDataGadget(function() { _gadgetManager.addGadget(id); }, function() {});
	
	 /** @private */
    // Attempts to find the iframe of DataGadget using browser-specific methods,
    // and then return its actual datagadget object (so datagadget methods can be called)
    // Returns reference to DataGadget object, or null if not found
    function lookForDataGadget(){
        debugLog('DI: Looking for dg...');
        var parentFrames = parent.document.getElementsByTagName("iframe");
        for (i=0; i<parentFrames.length; i++){
            // get the frame title to check if it's the DataGadget
            var f = parentFrames[i],
                title = "";
            if (f.contentDocument) {            // DOM (not IE)
                title = f.contentDocument.title;
            }
            else if (f.contentWindow) {
                title = f.contentWindow.title;  // IE only
            }
            if (title === DATAGADGET_TITLE){
                var fName = parentFrames[i].name;
                // DATAGADGET_OBJECT_NAME is the actual DataGadget object name in the DataGadget iframe
                // (the object is a property of the iframe object because it is defined at the root
                // level of the html file)
                var dg = parent.window.frames[fName][DATAGADGET_OBJECT_NAME];
                if ((dg !== null) && (dg !== undefined)) {
                    debugLog('DI: DataGadget found.');
                    return dg;             
                }
            }
        }
        debugLog('DI: DataGadget not found yet...');
        return null;
    }

    /** @private */    
    // Begins asyncronous search for datagadget. Keeps retrying FIND_GADGET_MAX_RETRIES number of times,
    // separated by a delay of FIND_GADGET_DELAY seconds.
    // Returns true if found, false if not
    function findDataGadget(successCallback, failCallback){
        debugLog('DI: findDataGadget begins.');
        _gadgetManager = lookForDataGadget();
       
        if (_gadgetManager !== null) {
            // Success! We have set the global dataGadget variable to the dg object.
            debugLog('DI: findDataGadget: Success! firing successCallback...');
            successCallback();
            return true;
        }
        else {
            // call this same function again until we find the datagadget
            
            debugLog('DI: findDataGadget: dg is null. Starting timer to find it...');
            if (findGadgetRetries < FIND_GADGET_MAX_RETRIES) {
                findGadgetRetries++;    // increment to keep track of our attempts
                debugLog('DI: findDataGadget: beginning retry ' + findGadgetRetries);
                window.setTimeout(function(){ debugLog('DI: findDataGadget timeout fired!'); findDataGadget(successCallback, failCallback);}, FIND_GADGET_DELAY);
            }
            else { // We have exceed our retry limit. Just give up and call the failCallback
                debugLog('DI: findDataGadget: I accept failure. Calling failCallback...');
                failCallback();
            }
            
//          alert("Cannot find " + DATAGADGET_TITLE + "\nPlease add the gadget or there will be problems with gadget-to-gadget communication");
            return false;
        }
    }
	
}

/**
* Create a DataInterface object to allow a gadget to communicate with the DataGadget
* This object provides an interface to allow a gadget to communicate with the DataGadget.
* When instantiated, the interface searches on the parent for the iframe of the DataGadget 
* and saves the actual DataGadget object so that methods can be called on it.
* Because we can't assume the DataGadget is the first iframe loaded, the search occurs asyncronously
* with a DELAY and MAX_RETRIES set as constants below.
*
* This interface provides a registerMe() function which finds the DataGadget, registers the gadget
* to a given namespace, registers all variables in the variable list, and registers all triggers in
* the trigger list.
*
* Example code to register a gadget 
* @class DataInterface
* @constructor
* @param {string} gadget Name of gadget creating this DataInterface
* @returns {object} Returns a DataInterface object
*/ 
UW.astro.DataInterface = function(gadget){
    var my = new Object();
    
    // Constants
    var DATAGADGET_TITLE = "DataGadgetv0.1",  // This is the name that will be searched 
                                              // for as the iframe of the DataGadget, so it must
                                              // match the iframe name of the datagadget or it will
                                              // never be found.
        DATAGADGET_OBJECT_NAME = "dg",
        FIND_GADGET_DELAY = 1000, // number of seconds to delay before 
                                  // retrying to find the datagadget
        FIND_GADGET_MAX_RETRIES = 20, // max retries to find DG before accepting failure
        MM_TIMER_DURATION = 4; // duration to display notifications in seconds

    // Private
    var _gadgetName = gadget,
        _namespaceList = [],    // namespaces to associate with
        _dataGadget = null,
        findGadgetRetries = 0;  // incremented each time we retry the search for the DataGadget
   
    var miniMsg = null; 
    // make the message for a MiniMessage writable by the whole class
    var msg = null;
    
    // EXPOSED REGISTRATION
    /**
     * @name registerMe
     * @memberOf UW.astro.DataInterface#
     * @type void
     * @function
     * @description Register a gadget to a namespace. Optionally register variables and triggers at the same time.
     * This function runs asyncronously, and finishes by executing callback functions (one for
     * success or one for failure).                                       <br/>
     * NOTE: Variables are passed as object properties.                   <br/>
     *        ex: registerMe( { var1 : value1, var2 : value2 } );
     * 
     * @param {function} successCallback *Optional* Function (in gadget context) executed 
     *        on successful registration.
     * @param {function} failureCallback *Optional* Function (in gadget context) executed 
     *        on failed registration.
     * @param {string[]} namespaceList *Required* Array of namespace names in which to register 
     *        this gadget and variables and triggers.
     * @param {string[]} variableList *Optional* Array of variable names to register the gadget to
     * @param {array.<array.<string, function>>} triggerList *Optional* Array of trigger arrays, where 
     *        each trigger array is an array containing the variable name getting trigger, and the 
     *        trigger function for that variable.                           <br/>
     *        Each trigger is a 2-element array as follows:                 <br/>
     *                [ "VariableName", triggerFunction ]                   <br/> 
     *        example with one trigger: (notice the array inside the array) <br/>
     *                var triggerArray = [ ["Viewport_Center_Coordinate", function(){ zoomMe() } ] ] 
     * @param {MiniMessage} miniMsg *Optional* Allows a gadget to pass an existing MiniMessage
     *        object if one has already been created. Otherwise one is created to display registration
     *        progress.
     */
    my.registerMe = function(oArg) {
        // transfer variables from argument object
        var successfulCallback = 'successCallback' in oArg ? oArg.successCallback : function(){};
        var failureCallback = 'failureCallback' in oArg ? oArg.failureCallback : function(){};
        var namespaceList = 'namespaceList' in oArg ? oArg.namespaceList : [];
        var variableList = 'variableList' in oArg ? oArg.variableList : [];
        var triggerList = 'triggerList' in oArg ? oArg.triggerList : [];
        // miniMsg already globally defined
        miniMsg = 'miniMsg' in oArg? oArg.miniMsg : new gadgets.MiniMessage();
       
        // create a MiniMessage static message to notify about registration
        msg = miniMsg.createStaticMessage("Attempting to register gadget...");
        
        // TODO: more variable validation
        if (!(namespaceList.length >= 1)) {
            debugLog('DI: No namespace provided');
            failureCallback();
            return;
        }
        if (!_gadgetName.length || _gadgetName.length < 1){
            debugLog('DI: No gadget name provided');
            failureCallback();
            return;
        }
        // TODO: check for a valid miniMsg
   
        // set the (global) _namespaceList
        _namespaceList = namespaceList;
        
        // register the gadget with each namespace in the list
        // for each namespace in list, it starts a new asynchronous registerer
        for (var i=0, len=namespaceList.length; i<len; i++){
            var nsName = namespaceList[i];
            registerGadget(nsName,
                            // successful callback
                            function(){
                                // continue the registration for this particular namespace
                                continueRegistration(nsName, variableList, triggerList, successfulCallback)
                            },
                            // failure callback
                            function(){
                                registrationFailed(failureCallback) // call the local failure callback, and pass it the gadgets failure callback
                            }
                            );
        }
    }
   
    /** @private */
    // Registers the variables and the triggers for a namespace
    // then calls the successful callback.
    // This function doesnt get a failure callback, so never calls one
    function continueRegistration(nsName, variableList, triggerList, successCallback){
        debugLog('DI: Continuing registration in namespace: ' + nsName);
        // register variables
        for (var i=0, len=variableList.length; i<len; i++){
            if (registerVarInNamespace(nsName, variableList[i], null)){
                debugLog('DI: Successfully registered variable "' + variableList[i] + '"');
            }
            else {
                debugLog('DI: FAILED to register variable "' + variableList[i] + '"');
            }
        }
        
        // register triggers
        for (var i=0, len=triggerList.length; i<len; i++){
            // triggerList[i][0] is trigger name
            // triggerList[i][1] is the function
            if (my.registerTrigger(nsName, triggerList[i][0], triggerList[i][1]) ){
                debugLog('Successfully registered trigger for "' + triggerList[i][0] + '."');
            }
            else {
                debugLog('FAILED to register trigger for "' + triggerList[i][0] + '."');
            }
        }
        successCallback();
    }

    /** @private */
    // print a failure message, and then call the gadgets failure callback
    function registrationFailed(failureCallback) {
        debugLog('DI: Registration Failed.');
        miniMsg.dismissMessage(msg);
        miniMsg.createDismissibleMessage("Unable to register gadget.\nWe cannot communicate with other gadgets.");
        gadgets.window.adjustHeight();
        // call additional failure callback supplied by gadget
        failureCallback();
    }

    /** @private */
    // Attempts to find the iframe of DataGadget using browser-specific methods,
    // and then return its actual datagadget object (so datagadget methods can be called)
    // Returns reference to DataGadget object, or null if not found
    function lookForDataGadget(){
        debugLog('DI: Looking for dg...');
        var parentFrames = parent.document.getElementsByTagName("iframe");
        for (i=0; i<parentFrames.length; i++){
            // get the frame title to check if it's the DataGadget
            var f = parentFrames[i],
                title = "";
            if (f.contentDocument) {            // DOM (not IE)
                title = f.contentDocument.title;
            }
            else if (f.contentWindow) {
                title = f.contentWindow.title;  // IE only
            }
            if (title === DATAGADGET_TITLE){
                var fName = parentFrames[i].name;
                // DATAGADGET_OBJECT_NAME is the actual DataGadget object name in the DataGadget iframe
                // (the object is a property of the iframe object because it is defined at the root
                // level of the html file)
                var dg = parent.window.frames[fName][DATAGADGET_OBJECT_NAME];
                if ((dg !== null) && (dg !== undefined)) {
                    debugLog('DI: DataGadget found.');
                    return dg;             
                }
            }
        }
        debugLog('DI: DataGadget not found yet...');
        return null;
    }

    /** @private */    
    // Begins asyncronous search for datagadget. Keeps retrying FIND_GADGET_MAX_RETRIES number of times,
    // separated by a delay of FIND_GADGET_DELAY seconds.
    // Returns true if found, false if not
    function findDataGadget(successCallback, failCallback){
        debugLog('DI: findDataGadget begins.');
        _dataGadget = lookForDataGadget();
       
        if (_dataGadget !== null) {
            // Success! We have set the global dataGadget variable to the dg object.
            debugLog('DI: findDataGadget: Success! firing successCallback...');
            successCallback();
            return true;
        }
        else {
            // call this same function again until we find the datagadget
            
            debugLog('DI: findDataGadget: dg is null. Starting timer to find it...');
            if (findGadgetRetries < FIND_GADGET_MAX_RETRIES) {
                findGadgetRetries++;    // increment to keep track of our attempts
                debugLog('DI: findDataGadget: beginning retry ' + findGadgetRetries);
                window.setTimeout(function(){ debugLog('DI: findDataGadget timeout fired!'); findDataGadget(successCallback, failCallback);}, FIND_GADGET_DELAY);
            }
            else { // We have exceed our retry limit. Just give up and call the failCallback
                debugLog('DI: findDataGadget: I accept failure. Calling failCallback...');
                failCallback();
            }
            
//          alert("Cannot find " + DATAGADGET_TITLE + "\nPlease add the gadget or there will be problems with gadget-to-gadget communication");
            return false;
        }
    }

    /** @private */
    // Returns true if the global _dataGadget variable is not null, otherwise, it attempts to find
    // it and returns false if it cant.
    function dgExists(successCallback, failCallback){
        if (_dataGadget !== null){
            debugLog('DI: dgExists: dg EXISTS.');
            return true;
        }
        else {
            debugLog('DI: dgExists: dg = null. Running findDataGadget()...');
            // we set the retries (global) to 0
            // not a big deal if this gets reset while we are already retrying
            findGadgetRetries = 0;
            return findDataGadget(successCallback, failCallback); // returns true if found, false if not
        }
    }        
    
    /** @private */
    // Begins the gadget registration. At this point, the DataGadget may or may not have been found, 
    // so calling dgExists will find it, or not and call the failCallback
    function registerGadget(namespaceName, successCallback, failCallback){
        debugLog('DI: registerGadget: begins.');
        // dgExists takes 2 callbacks as args, a success, and a fail
        // for the success, we send doRegisterGadget (which registers and calls successCallback)
        // for the fail, we send failedRegisterGadget (which just calls failCallback)
        return dgExists(
                function(){doRegisterGadget(namespaceName, successCallback);},
                function(){failedRegisterGadget(namespaceName, failCallback);}
                ); 
    }
    
    /** @private */
    // Last function called to register gadget. This is the function that calls the 
    // DataGadget's registerGadget() function, then notifies by MiniMessage and calls the
    // successCallback.
    function doRegisterGadget(namespaceName, successCallback){
        debugLog('DI: doRegGadget: dg does exist, so actually registering "' + _gadgetName + '" in "' + namespaceName + '" now...');
        _dataGadget.registerGadget(_gadgetName, namespaceName);
        
        // notify by MiniMessage
        if (msg !== null) {
            miniMsg.dismissMessage(msg);
            // free up msg
            msg = null;
            miniMsg.createTimerMessage("Registration Succesful.", MM_TIMER_DURATION);
            gadgets.window.adjustHeight();
        }
        
        successCallback();
    } 


    /** @private */
    // Writes to the log that registration failed, and calls the failCallback.
    function failedRegisterGadget(namespaceName, failCallback){
        debugLog('DI: failedRegGadget: failed to register gadget "' + _gadgetName + '" in "' + namespaceName + '". Calling FailureCallback.');
        failCallback();
    }

    /** @private */
    // Internal function to register a single variable in a single namespace
    function registerVarInNamespace(nsName, varName, varValue) {
        if (!_dataGadget.registerVariable(_gadgetName, nsName, varName, varValue)) {
            debugLog('DI: my.registerVariable: There was a problem registering gadget "' + _gadgetName + '" to variable "' + varName + '" in "' + _namespaceList[i]);
            return false;
        } else {
            return true;
        }
    }
    
    // PUBLIC METHODS
    /**
     * @name registerVariable
     * @memberOf UW.astro.DataInterface#
     * @function
     * @description Tries to register this gadget to a variable in each namespace that
     * the gadget is currently registered to. 
     * NOTE: A gadget is not able to read or write to a datagadget variable if it is not registered 
     * to the variable (and registered to the namespace of the variable).
     * @param {string} varName Name of variable to register.
     * @param {object} varValue Initial value of variable to set. If the variable already exists,
     *      then the value is NOT set. The gadget is simply registered to the variable.
     * @return {boolean} Returns true if variable was successfully registered in all applicable
     *      namespaces, false if anything went wrong. If something went wrong, check the log.
     */
    my.registerVariable = function(varName, varValue){
        // TODO: function to check if dg !== null
        var success = true;
        if (_dataGadget !== null) {
            for (var i=0, len=_namespaceList.length; i<len; i++) {
                if (!registerVarInNamespace(_namespaceList[i], varName, varValue)) {
                    success = false;
                }
            }
        } else {
            return false;
        }
        return success;
    }
    
   /** @name writeVariable
     * @memberOf UW.astro.DataInterface#
     * @function
     * @description Writes a new value to a datagadget variable.
     * NOTE: Writing to a variable fires all triggers registered to that variable EXCEPT for
     * triggers registered by the gadget that writes the variable.
     * @param {string} namespaceName The namespace of the variable to write.
     * @param {string} varName Name of the variable to write.
     * @param {object} varValue Value to set the variable to.
     * @return {boolean} Returns true if successful, false if not successful.
    */
   my.writeVariable = function(namespaceName, varName, varValue){
        if (_dataGadget !== null) {
                if (_dataGadget.writeVariable(_gadgetName, namespaceName, varName, varValue)) {
                    return true;
                }
                else {
                    debugLog('DI: writeVariable: Problem writing variable "' + varName + '"!');
                    return false;
                }
        }

    }
  
    /** @name readVariable
     * @memberOf UW.astro.DataInterface#
     * @function
     * @description Reads a datagadget variable from a specific namespace by variable name.
     * @param {string} namespaceName The namespace of the variable to read.
     * @param {string} varName The name of the variable to read.
     * @return {object} Returns the value of the datagadget variable being read.
     */
    my.readVariable = function(namespaceName, varName){
        if (_dataGadget !== null) {
            return _dataGadget.readVariable(_gadgetName, namespaceName, varName);
        }
        else {
            debugLog('DI: readVariable: Problem reading variable "' + varName + '"!');
            return null;
        }
    }
 
 
    /** @name registerTrigger
     * @memberOf UW.astro.DataInterface#
     * @function
     * @description Registers a trigger to a specific datagadget variable.
     * @param {string} namespaceName The namespace of the variable to read.
     * @param {string} varName The name of the variable on which to register a trigger.
     * @param {function} triggerCallback The function to be executed when the trigger is fired. NOTE: The 
     * function is a callback, so is executed in the context of the original function definition (ie the
     * scope of the gadget).
     * @return {boolean} Returns true if successful, false if not successful.
     */   
    my.registerTrigger = function(namespaceName, varName, triggerCallback){
        if (_dataGadget !== null) {
            if (_dataGadget.registerTrigger(_gadgetName, namespaceName, varName, triggerCallback)) {
                return true;
            }
            else {
                debugLog('DI: registerTrigger: Problem registering trigger for "' + varName + '"!');
                return false;
            }
        }
    }


    return my;
}

