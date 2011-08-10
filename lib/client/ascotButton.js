
var ASCOT = ASCOT || {};
var ASCOT.button = {};


(function () {
  
  function loadRequireJS(callback){
    var head = document.getElementsByTagName("head")[0];         
    var requireJS = document.createElement('script');
    var buttonCSS =document.createElement("link")
      
    buttonCSS.rel = "stylesheet";
    buttonCSS.type = "text/css";
    buttonCSS.href = "http://dmarcos.github.com/ascotButton/css/ascotButton.css";
    
    newScript.type = 'text/javascript';
    newScript.src = 'http://ascot.astro.washington.edu/require.js';
    //newScript.onload=callback;
    head.appendChild(requireJS);
    head.appendChild(buttonCSS);
  }  
  
  loadRequireJS();

  ASCOT.button.createDashboard = function(){
    console.log("YEAHHHHHH");
  }
  
}());

