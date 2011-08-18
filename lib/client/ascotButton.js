
var ASCOT = ASCOT || {};
ASCOT.button = {};

ASCOT.button.serverPrefix;
ASCOT.button.xslt;

(function () {
  
  function loadDependencies(callback){
    var head = document.getElementsByTagName('head')[0];         
    var crossdomainAjax = document.createElement('script');
    var buttonCSS = document.createElement('link');
      
    buttonCSS.rel = 'stylesheet';
    buttonCSS.type = 'text/css';
    buttonCSS.href = 'http://dmarcos.github.com/ascotButton/css/ascotButton.css';
    
    crossdomainAjax.type = 'text/javascript';
    crossdomainAjax.src = ASCOT.button.serverPrefix + 'cors/crossdomain-ajax.js';
    crossdomainAjax.onload=callback;
    head.appendChild(crossdomainAjax);
    head.appendChild(buttonCSS);
  }  
  
  function init(){
    
    var currentButton;
    var buttonAttributes;
    var buttonElement;
    var currentAttribute;
    var buttonContent = 
        '<div class="clickedButtonState" style="display: none">' +
            '<div class="spinner">' +
              '<div class="bar1"></div>' + 
              '<div class="bar2"></div>' +
              '<div class="bar3"></div>' + 
              '<div class="bar4"></div>' +
              '<div class="bar5"></div>' +
              '<div class="bar6"></div>' +
              '<div class="bar7"></div>' +
              '<div class="bar8"></div>' + 
            '</div>' +
        '</div>';

    var ascotButtons = document.getElementsByTagName('ascot');
    while(ascotButtons.length){
      buttonElement = document.createElement('button');
      buttonElement.setAttribute('class','ascot');
      buttonElement.setAttribute('onclick','ASCOT.button.createDashboard(this)');
      currentButton = ascotButtons[0];
      buttonAttributes = currentButton.attributes;
      for(var j=0; j< buttonAttributes.length;++j){
        currentAttribute = buttonAttributes[j];
        buttonElement.setAttribute(currentAttribute.name, currentAttribute.value);
      }
      buttonElement.innerHTML = buttonContent;
      currentButton.parentNode.replaceChild(buttonElement, currentButton);
    }
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
	
	function isNumber (o) {
    return ! isNaN (o-0);
  }
  
  loadDependencies(init);

  ASCOT.button.createDashboard = function(button){
    var dashboardJSON = button.getAttribute('dashboard');
    var dataSetsJSON = button.getAttribute('dataSets');
    var dashboard = dashboardJSON? JSON.parse(dashboardJSON) : {};
    var dataSets = dataSetsJSON? JSON.parse(dataSetsJSON) : {};
    var requestData = {};
    // Show loading spinner if webkit browser
    if ((/(.)*WebKit(.)*/).test(navigator.userAgent)){
      button.childNodes[0].style.display = "block";
    }
    requestData.gadgets = dashboard.gadgets;
    requestData.dataSets = dataSets;
    if(typeof dashboard == 'number'){
      window.location = ASCOT.button.serverPrefix + 'dashboards/' + dashboard;
    }
    else{
      crossdomain.ajax({
        type: "POST",
        url:  ASCOT.button.serverPrefix + 'newDashboard/',
        data: JSON.stringify(requestData),
        success: function (newDashboardId) {
          window.location = ASCOT.button.serverPrefix + 'dashboards/' + newDashboardId;
        }
      });
    }
  }
  
}());

