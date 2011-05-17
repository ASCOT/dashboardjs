/**
 *  Date: 4/11
 * @author Diego Marcos (diego.marcos@gmail.com)
 */

var UW = UW || {};

UW.Renderer = function(pTarget){

	var target = pTarget;
	var layoutManager = UW.layoutManager();	
	layoutManager.setRootElement(target);
	layoutManager.setNumColumns(2);
	
	function autoResize(id){

		var height = parent.document.getElementById(id).contentDocument['body'].offsetHeight;
		parent.document.getElementById(id).style.height = height + "px";
	
	}
	
	this.renderGadget = function(gadgetId, gadgetUrl, gadgetModel, dashboard){

		var gadgetIframe = document.createElement('iframe');
		gadgetIframe.src = gadgetUrl; 
		gadgetIframe.frameBorder = 'no';
		gadgetIframe.scrolling = 'no';
		gadgetIframe.id = gadgetId;
		gadgetIframe.width = "100%";
		gadgetIframe.style.display = "block";
		gadgetIframe.onload = function(id) { return function() { autoResize(id); }; }(gadgetId);
		
		var iframeContainer = document.createElement('div');
		iframeContainer.className = 'gadgetFrame'; 
		iframeContainer.id = gadgetIframe.id + "container";
		
		iframeContainer.appendChild(gadgetIframe);
		layoutManager.addElement(iframeContainer);
		
		// Adding reference to the gadget in the global scope of the iframe. The user can have access to the object.
		var gadget = new UW.Gadget({ model: gadgetModel });
    gadget.dashboard = dashboard;
		gadget.resize = function() { autoResize(this.getId()); };
		gadgetIframe['contentWindow'].gadget = gadget;
	
	};
  				
};