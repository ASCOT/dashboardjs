
var ASCOT = ASCOT || {};
ASCOT.button = {};

ASCOT.button.serverPrefix = "http://ascot.astro.washington.edu";
//http://localhost 

(function () {
  
  function loadRequireJS(callback){
    var head = document.getElementsByTagName('head')[0];         
    var requireJS = document.createElement('script');
    var buttonCSS = document.createElement('link');
      
    buttonCSS.rel = 'stylesheet';
    buttonCSS.type = 'text/css';
    buttonCSS.href = 'http://dmarcos.github.com/ascotButton/css/ascotButton.css';
    
    requireJS.type = 'text/javascript';
    requireJS.src = ASCOT.button.serverPrefix + '/require.js';
    requireJS.onload=callback;
    head.appendChild(requireJS);
    head.appendChild(buttonCSS);
  }  
  
  function init(){
    require([ASCOT.button.serverPrefix + '/cors/crossdomain-ajax.js'], function() {});
  }
  
  loadRequireJS(init);

  ASCOT.button.createDashboard = function(button){
    var dashboard = JSON.parse(button.getAttribute('dashboard').replace(/'/g, "\""));
    var dataSets = JSON.parse(button.getAttribute('dataSets').replace(/'/g, "\""));
    var requestData = {};
    requestData.gadgets = dashboard.gadgets;
    requestData.dataSets = dataSets;
    crossdomain.ajax({
      type: "POST",
      url:  ASCOT.button.serverPrefix + '/newDashboard/',
      data: JSON.stringify(requestData),
      success: function (newDashboardId) {
        window.location = ASCOT.button.serverPrefix + '/dashboards/' + newDashboardId;
      }
    });
  }
  
}());

