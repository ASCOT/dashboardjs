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
  var nativeCrossDomainAvailable = false; // Native CORS method available
  var proxyIframe; // Iframe use for the postMessage method fallback in the browser
  var sourceWindow;
  var options;
  var idCounter = 0;
  var urlRegularExpression = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/;
    
  function getUniqueId(prefix){
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };
    
  var iframeProxyRequestHandler = function(event){
    var request = JSON.parse(event.data);
    var serviceDomain = urlRegularExpression.exec(request.url.toLowerCase())[2];
    sourceWindow = event.source;
    launchRequest(request.url, request.type, request.headers, request.data, true);
  }
  
  var launchRequest = function(url, type, headers, data, iframeProxy, success, error, user, password){ 
    
    var iframeProxySuccesHandler = function(){};
    var iframeProxyErrorHAandler = function(){};
    
    var successHandler = iframeProxy? iframeProxySuccesHandler : success;
    var errorHandler = iframeProxy? iframeProxyErrorHAandler : error;
    var xhr;

    if (server) {
      XMLHttpRequest = require("./xhrNode").XMLHttpRequest;
      xhr = new XMLHttpRequest();
    } else {
      if (window.ActiveXObject) { // IE
        xhr = new window.XMLHttpRequest() || new window.ActiveXObject( "Microsoft.XMLHTTP" );
      } else { // All other browsers standar XMLHttpRequest object
        xhr = new window.XMLHttpRequest();
      }
    
      nativeCrossDomainAvailable = ("withCredentials" in xhr);

      if (window.addEventListener) { // normal browsers
        window.addEventListener("message", iframeProxyRequestHandler, false);
      } else if (window.attachEvent) { // IE 
        window.attachEvent("onmessage", iframeProxyRequestHandler); 
      }
    }

    xhr.onreadystatechange = function (){
      if (this.readyState == 3) {
    	}
      if (this.readyState == 4){
        if(successHandler && this.status == 200){
          successHandler(this.responseText);
        }
      }
    };
    
    xhr.open(type, url, true, user, password);
    
    // Default content-type
    if (type == "GET" || type == "HEAD") {
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    } else if (data) {
  	 //xhr.setRequestHeader("Content-Type", "text/plain; charset=UTF-8");
      xhr.setRequestHeader("Content-Type", "application/json");
    }
    // Check for headers option
    for (i in headers) {
  		  xhr.setRequestHeader(i, headers[ i ]);
    }
    xhr.send(data || null); 
  }

  if (typeof exports !== 'undefined') {
    server = true;
    module = exports;
    nativeCORSAvailable = true;
  } else {
    server = false;
    module = UW;
  }
    
  module.ajax = function(options){
    
    var statusCodeCallbacks = options.statusCode || {};
    var type = options.type? options.type.toUpperCase() : "GET";
    var response = "";
    var documentUrl;
    var documentDomainParts;
    var requestDomainParts;
    var crossDomainRequest;
    var onloadHandler = function() {
      proxyIframe.contentWindow.postMessage(JSON.stringify({
        	url : options.url,
        	method  : type,
        	headers : options.headers,
        	data  : options.data,
        	id :  getUniqueId()
      }), '*');
    };
    
    var iframeProxyResponseHandler = function(event){
      var response = JSON.parse(event.data);
      if (response.iframeProxy){
        if(response.succes){
          options.success(response.data);
        }
        if(response.error){
          options.error(response.data);
        }
        return;
      }
    };
      
    if(server){
      launchRequest(options.url, type, options.headers, options.data, false, options.success, options.error)
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
        launchRequest(options.url, type, options.headers, options.data, false, options.success, options.error)
      }
      else{ // Cross-domain fallbacks
        // For the moment we only use the proxy fallback
        launchRequest('/xhrProxy/' + encodeURIComponent(options.url), type, options.headers, options.data, false, options.success, options.error)
        // Attempt of implementing cross domain iframe proxy. Not a good solution since we have no control over the data sources.
        /* proxyIframe = document.createElement("iframe");
        proxyIframe.id = 'proxyRequestFrame';
        proxyIframe.name = proxyIframe.id;
        proxyIframe.src = '/xhr/'; //requestDomainParts[2];
        proxyIframe.style.display = 'none';
        proxyIframe.style.position = 'absolute';
        proxyIframe.style.left = '-2000px';
        proxyIframe.style.top = '-2000px';
        if (proxyIframe.addEventListener){
        	proxyIframe.addEventListener("load", onloadHandler, false);
        }
        else if (instance.iFrame.attachEvent){
        	proxyIframe.attachEvent("onload", onloadHandler);
      	}
      	
      	if (window.addEventListener) {
      	  window.addEventListener("message", iframeProxyResponseHandler, false);
    	  }
        else if (window.attachEvent) {
          window.attachEvent("onmessage", iframeProxyResponseHandler);
        }
        document.body.appendChild(proxyIframe);*/
      }
   } 
 }
  
})();