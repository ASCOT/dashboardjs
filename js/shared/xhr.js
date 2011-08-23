/**
 * AJAX Query library that works both in client and node.js server
 * On the client if we detect a cross domain request we fallback into iframe proxy method
 * @author Diego Marcos (diego.marcos@gmail.com)
 *
 */

if (!UW) var UW = {};

(function(){
  
  /* Private Variables */
  var server;
  var module;
	var self = this;
	var XMLHttpRequest;
  var xhr;
  var nativeCrossDomainAvailable = false; // Native CORS method available
  
  var options;
  
  if (typeof exports !== 'undefined') {
     server = true;
     module = exports;
     XMLHttpRequest = require("./xhrNode").XMLHttpRequest;
     xhr = new XMLHttpRequest();
     nativeCORSAvailable = true;
  }
  else{
    server = false;
    module = UW;
    if (window.ActiveXObject){ // IE
      xhr = new window.XMLHttpRequest() || new window.ActiveXObject( "Microsoft.XMLHTTP" );
    }
    else{ // All other browsers standar XMLHttpRequest object
      xhr = new window.XMLHttpRequest();
    }
    nativeCrossDomainAvailable = ("withCredentials" in xhr);
  }
  
  var launchRequest = function(xhr, url, type, headers, data, success, error, user, password){
    xhr.onreadystatechange = function (){
      if (this.readyState == 3) {
    	}
      if (this.readyState == 4){
        if(success && this.status == 200){
          success(this.responseText);
        }
      }
    };
    xhr.open(type, url, true, user, password);
    // Default content-type
    if (type == "GET" || type == "HEAD") {
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    } else if (data) {
  	    xhr.setRequestHeader("Content-Type", "text/plain; charset=UTF-8");
    }
    // Check for headers option
    for (i in headers) {
  		  xhr.setRequestHeader(i, headers[ i ]);
    }
    xhr.send(data || null); 
  }
  
  module.ajax = function(options){
    
    var statusCodeCallbacks = options.statusCode || {};
    var type = options.type? options.type.toUpperCase() : "GET";
    var response = "";
    var urlRegularExpression = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/;
    var documentUrl;
    var documentDomainParts;
    var requestDomainParts;
    var crossDomainRequest;
    var newProxyIframe;
      
    if(server){
      launchRequest(xhr, options.url, type, options.headers, options.data, options.success, options.error)
    } 
    else{ 
      // #8138, IE may throw an exception when accessing
      // a field from window.location if document.domain has been set
      try {
        documentUrl = location.href;
      } catch( e ) {
        // Use the href attribute of an A element
        // since IE will modify it given document.location
        documentUrl = document.createElement( "a" );
        documentUrl.href = "";
        documentUrl = documentUrl.href;
      }

      documentDomainParts = urlRegularExpression.exec(documentUrl.toLowerCase()); 
      requestDomainParts = urlRegularExpression.exec(options.url.toLowerCase()); 
      crossDomainRequest = !!(requestDomainParts &&
    				  (requestDomainParts[1] != documentDomainParts[1] || requestDomainParts[2] != documentDomainParts[2] ||
    					(requestDomainParts[3] || (requestDomainParts[1] === "http:" ? 80 : 443)) !=
    					(documentDomainParts[3] || (documentDomainParts[1] === "http:" ? 80 : 443))));
    
      if(!crossDomainRequest){
        launchRequest(xhr, options.url, type, options.headers, options.data, options.success, options.error)
      }
      else{ // Cross-domain fallbacks
        newProxyIframe = document.createElement("iframe");
        newProxyIframe.id = 'proxyFrame';
        newProxyIframe.name = newProxyIframe.id;
        newProxyIframe.src = requestDomainParts[2];
        newProxyIframe.style.display = 'none';
        newProxyIframe.style.position = 'absolute';
        newProxyIframe.style.left = '-2000px';
        newProxyIframe.style.top = '-2000px';
        newProxyIframe.onload = function() {
          launchRequest(xhr, options.url, type, options.headers, options.data, options.success, options.error)
        } 
        document.body.appendChild(newProxyIframe);
      }
   } 
 }
  
})();