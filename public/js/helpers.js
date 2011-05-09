// To make my life easier

/*
function $() {

	var elements = new Array();

	for (var i = 0; i < arguments.length; i++) {
	
		var element = arguments[i];

		if (typeof element == 'string')

			element = document.getElementById(element);

		if (arguments.length == 1)

			return element;

		elements.push(element);

	}

	return elements;

}
*/

var CustomEvent = function() {
	//name of the event
	this.eventName = arguments[0];
	var mEventName = this.eventName;

	//function to call on event fire
	var eventAction = null;

	//subscribe a function to the event
	this.subscribe = function(fn) {
		eventAction = fn;
	};

	//fire the event
	this.fire = function(sender, eventArgs) {
		this.eventName = eventName2;
		if(eventAction != null) {
			eventAction(sender, eventArgs);
		}
		else {
			alert('There was no function subscribed to the ' + mEventName + ' event!');
		}
	};
};


function parseURL(data) {
    var e=/^((http|ftp|https|localhost):(\d{4})?\/)?\/?([^:\/\s]+)((\/\w+)*\/)(([\w\-\.]+)\.[^#?\s]+)$/;

    if (data.match(e)) {
        return  {url: RegExp['$&'],
                protocol: RegExp.$2,
                host:RegExp.$4,
                path:RegExp.$5,
                file:RegExp.$7,
                fileNoExtension:RegExp.$8};
    }
    else {
        return  {url:"", protocol:"",host:"",path:"",file:"",hash:""};
    }
}


var JSON = JSON || {};  

// implement JSON.stringify serialization  
JSON.stringify = JSON.stringify || function (obj) {  
    var t = typeof (obj);  
    if (t != "object" || obj === null) {  
        // simple data type  
        if (t == "string") obj = '"'+obj+'"';  
        return String(obj);  
    }  
    else {  
        // recurse array or object  
        var n, v, json = [], arr = (obj && obj.constructor == Array);  
        for (n in obj) {  
            v = obj[n]; t = typeof(v);  
            if (t == "string") v = '"'+v+'"';  
            else if (t == "object" && v !== null) v = JSON.stringify(v);  
            json.push((arr ? "" : '"' + n + '":') + String(v));  
        }  
        return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");  
    }  
};  

// implement JSON.parse de-serialization  
JSON.parse = JSON.parse || function (str) {  
    if (str === "") str = '""';  
    eval("var p=" + str + ";");  
    return p;  
};  