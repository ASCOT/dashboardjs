/**
 * @namespace The global ASCOT namespace
 * @type {Object} 
 */
var UW = UW || {};


var logConsole = window.console ? window.console :
                 window.opera   ? window.opera.postError : undefined;

/**
 * @static
 * @namespace Support for basic logging capability.
 * @name UW.log
 */
UW.log = function (){

	function logMessage(level, message) {
  
 		 if (level === "WARNING" && logConsole.warn) {
 		   logConsole.warn(message);
 		 } else if (level === "ERROR" && logConsole.error) {
 		   logConsole.error(message);
 		 } else if (logConsole.log) {
 		   logConsole.log(message);
 		 }
  
	};

	return{
	
		warning: function(message){
			logMessage("WARNING",message);
		},
		error: function(message){
			logMessage("ERROR",message);
		},
		log: function(message){
			logMessage("LOG",message);
		}
	
	};

}();	


UW.layoutManager = function (){

		var rootElement;
		var elements = {};
		var columns = [];
		var nextColumn = 0;
		var numColumns = 0;
		
		return {
		
			addElement: function(element){
				elements[element.id] = element;
  	 		columns[nextColumn % numColumns].appendChild(element);
  	 		nextColumn++;
			},
			
			refreshLayout: function(){
			
		 		for(element in elements){
		 			var current = element;
		 			this.addElement(elements[element]);
  	 		}
			
			},
			
			setRootElement: function(element){
				rootElement = element;
			},
					
			setNumColumns: function (newNumColumns){
			
				if(typeof rootElement == "undefined")
					UW.log.error("PRECONDITION VIOLATION","Undefined root element");
								
				for(var i=0; i < numColumns; i++){
					delete columns[i];
				}
				columns = [];
				
				numColumns = newNumColumns;
				var columnWidth = (100 / numColumns) + "%";
	
				for(var i=0; i < numColumns; i++){
	  			var newColumn = document.createElement('div');
	  			newColumn.id = "column" + i;
	  			newColumn.style.width =  columnWidth;
	 			  newColumn.style.cssFloat = "left";
	  			columns.push(newColumn);
	  			rootElement.appendChild(newColumn);
				}
	
				// To make sure that the root element adapts its size to the content
				var closeElement = document.createElement('div');
				closeElement.style.clear = 'both';
				rootElement.appendChild(closeElement); 
				
				this.refreshLayout();

				return columns;
			
			}
			
		};
		
}; 