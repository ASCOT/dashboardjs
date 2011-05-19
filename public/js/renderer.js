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
	
	this.renderGadget = function(gadgetUrl, gadget){

		var gadgetIframe = document.createElement('iframe');
		gadgetIframe.src = gadgetUrl; 
		gadgetIframe.frameBorder = 'no';
		gadgetIframe.scrolling = 'no';
		gadgetIframe.id = gadget.getId();
		gadgetIframe.width = "100%";
		gadgetIframe.style.display = "block";
		gadgetIframe.onload = function(id) { return function() { autoResize(id); }; }(gadget.getId());
		
		var iframeContainer = document.createElement('div');
		iframeContainer.className = 'gadgetFrame'; 
		iframeContainer.id = gadgetIframe.id + "container";
		
		iframeContainer.appendChild(gadgetIframe);
		layoutManager.addElement(iframeContainer);
		
		gadget.resize = function() { autoResize(this.getId()); };
		gadgetIframe['contentWindow'].gadget = gadget;
	
	};
  				
};