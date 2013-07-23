/**
 *  Date: 4/11
 * @author Diego Marcos (diego.marcos@gmail.com)
 */

var UW = UW || {};

UW.Renderer = function(pTarget, numberOfColumns, numberOfPanes){

  var target = pTarget;
  var layoutManager = UW.tabbedLayoutManager(numberOfPanes);	
  layoutManager.setRootElement(target);
  if(numberOfColumns){
    layoutManager.setNumColumns(numberOfColumns);
  }
  else{
    layoutManager.setNumColumns(2);
  }
  
  function autoResize(id){
    var height = document.getElementById(id).contentDocument['body'].offsetHeight;
    document.getElementById(id).style.height = height + "px";
  }

  this.removeGadget = function(gadgetId, callback){
    layoutManager.removeGadget(gadgetId);
  };

  this.renderGadget = function(gadget, layoutObj, callback){

    var iframeContainer = document.createElement('div');
    var gadgetFrame = document.createElement('div');
    var gadgetIframe = document.createElement('iframe');
    var succesCallBack = function(id) { 
      return function() { 
              var frame = gadgetFrame;
              autoResize(id); 
              gadget.inflateState();
              frame.style.opacity = "1";  
              callback(); 
            } 
    }(gadget.id);
    
    var initGadget = function(){ gadget.init(succesCallBack); };

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

    gadget.resize = function() { 
      autoResize(this.id); 
    };

    layoutManager.addGadget(gadgetFrame, gadget, layoutObj);
    
    gadgetIframe.contentWindow.gadget = gadget;
  };
};
