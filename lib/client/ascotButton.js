
var ASCOT = ASCOT || {};
ASCOT.button = {};

ASCOT.button.serverPrefix;
ASCOT.button.xslt;

(function () {
  
  function loadRequireJS(callback){
    var head = document.getElementsByTagName('head')[0];         
    var requireJS = document.createElement('script');
    var buttonCSS = document.createElement('link');
      
    buttonCSS.rel = 'stylesheet';
    buttonCSS.type = 'text/css';
    buttonCSS.href = 'http://dmarcos.github.com/ascotButton/css/ascotButton.css';
    
    requireJS.type = 'text/javascript';
    requireJS.src = ASCOT.button.serverPrefix + 'require.js';
    requireJS.onload=callback;
    head.appendChild(requireJS);
    head.appendChild(buttonCSS);
  }  
  
  function applyXSLT(xsl, xml){
    var xmlParser = new DOMParser();
    var xslDoc = xmlParser.parseFromString(xsl,'text/xml');
    //xml = '<ascot></ascot>';
    var xmlSerializer = new XMLSerializer();
    var xmlDoc = xmlParser.parseFromString(xml,'text/xml');
    //var xml = document.body.innerHTML;
    // code for IE
    if (window.ActiveXObject){
      document.body.innerHTML = xml.transformNode(xsl);
    }  // code for Mozilla, Firefox, Opera, etc
    else{ 
      if(document.implementation && document.implementation.createDocument){
        xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(xslDoc);
        resultDocument = xsltProcessor.transformToFragment(xmlDoc, document);
        console.log(xmlSerializer.serializeToString(resultDocument));
      }
    }
  }
  
  function init(){
    require([ASCOT.button.serverPrefix + 'cors/crossdomain-ajax.js'], function() { 
       crossdomain.ajax({
          type: "GET",
          url:  ASCOT.button.serverPrefix + 'test.xsl',
          success: function(xsl) {
             crossdomain.ajax({
                type: "GET",
                url:  ASCOT.button.serverPrefix + 'test.xml',
                success: function(xml) {
                  applyXSLT(xsl, xml);
                }
              });
          }
        });
    });
  }
  
  var scripts; 
  var currentScript;
  if (!ASCOT.button.serverPrefix) {
	  scripts = document.getElementsByTagName("script")
	  for (var i=0; i<scripts.length; i++) {
	    currentScript = scripts[i].getAttribute('src');
	    if (currentScript && currentScript.match(/ascotButton.js/)) {
		    ASCOT.button.serverPrefix = currentScript.replace("ascotButton.js", '');
		    break;
	    }
	  }
	}
  
  loadRequireJS(init);

  ASCOT.button.createDashboard = function(button){
    var dashboardJSON = button.getAttribute('dashboard');
    var dataSetsJSON = button.getAttribute('dataSets');
    var dashboard = dashboardJSON? JSON.parse(dashboardJSON): {};
    var dataSets = dataSetsJSON? JSON.parse(dataSetsJSON): {};
    var requestData = {};
    // Show loading spinner if webkit browser
    if ((/(.)*WebKit(.)*/).test(navigator.userAgent)){
      button.childNodes[1].style.display = "block";
    }
    requestData.gadgets = dashboard.gadgets;
    requestData.dataSets = dataSets;
    crossdomain.ajax({
      type: "POST",
      url:  ASCOT.button.serverPrefix + 'newDashboard/',
      data: JSON.stringify(requestData),
      success: function (newDashboardId) {
        window.location = ASCOT.button.serverPrefix + 'dashboards/' + newDashboardId;
      }
    });
  }
  
}());

