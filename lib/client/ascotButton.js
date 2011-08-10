
var ASCOT = ASCOT || {};
ASCOT.button = {};

(function () {
  
  function loadRequireJS(callback){
    var head = document.getElementsByTagName('head')[0];         
    var requireJS = document.createElement('script');
    var buttonCSS = document.createElement('link');
      
    buttonCSS.rel = 'stylesheet';
    buttonCSS.type = 'text/css';
    buttonCSS.href = 'http://dmarcos.github.com/ascotButton/css/ascotButton.css';
    
    requireJS.type = 'text/javascript';
    requireJS.src = 'http://ascot.astro.washington.edu/require.js';
    requireJS.onload=callback;
    head.appendChild(requireJS);
    head.appendChild(buttonCSS);
  }  
  
  function init(){
    require(["http://ascot.astro.washington.edu/cors/crossdomain-ajax.js"], function() {
      console.log("OH YEAAAAH"); 
    });
  }
  
  loadRequireJS(init);

  ASCOT.button.createDashboard = function(button){
    var dashboard = JSON.parse(button.getAttribute('dashboard').replace(/'/g, "\""));
    var dataSets = JSON.parse(button.getAttribute('dataSets').replace(/'/g, "\""));
    var requestData = {};
    requestData.gadgets = dashboard.gadgets;
    requestData.dataSets = dataSets;
    //JSON.stringify(requestData)
    crossdomain.ajax({
      type: "POST",
      url: "http://localhost/newDashboard/",
      data: "cacacaacacaacacaac",
      success: function (newDashboardId) {
          console.log("REDIRECTION");
      }
    });
  }
  
}());

