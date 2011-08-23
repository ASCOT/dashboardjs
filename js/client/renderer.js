/**
 *  Date: 4/11
 * @author Diego Marcos (diego.marcos@gmail.com)
 */

var UW = UW || {};

UW.Renderer = function(pTarget, numberOfColumns){

  var target = pTarget;
  var layoutManager = UW.layoutManager();	
  layoutManager.setRootElement(target);
  if(numberOfColumns){
    layoutManager.setNumColumns(numberOfColumns);
  }
  else{
    layoutManager.setNumColumns(2);
  }
  
  function autoResize(id){
    var height = parent.document.getElementById(id).contentDocument['body'].offsetHeight;
    parent.document.getElementById(id).style.height = height + "px";
  }
  
  this.renderGadget = function(gadget, callback){

    var succesCallBack = function(id) { return function() { autoResize(id); callback(); } }(gadget.id);
    var initGadget = function(){ gadget.init(succesCallBack); };
    var iframeContainer = document.createElement('div');
    var gadgetFrame = document.createElement('div');
    var gadgetIframe = document.createElement('iframe');
    
    gadgetIframe.src = gadget.url; 
    gadgetIframe.frameBorder = 'no';
    gadgetIframe.scrolling = 'no';
    gadgetIframe.id = gadget.id;
    gadgetIframe.width = "100%";
    gadgetIframe.height = "0px";
    gadgetIframe.style.display = "block";
    gadgetIframe.onload = function() { $(initGadget) };		
    
    iframeContainer.className = 'gadgetCanvas'; 
    iframeContainer.appendChild(gadgetIframe);
    
    gadgetFrame.className = 'gadgetFrame';
    gadgetFrame.appendChild(iframeContainer);
    
    layoutManager.addElement(gadgetFrame);
    
    gadget.resize = function() { autoResize(this.id); };
    gadgetIframe.contentWindow.gadget = gadget;
    
  };

};