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

function populateSelect(selectName, options, selectedOption) { 
  var select = $("#" + selectName);
  var currentSelection = $("#" + selectName + " option:selected").val();
  if (options.length === 0) {
    return;
  }
  select.find('option').remove().end();
  $.each(options, function() {
    var newOption;
    if (isObject(this) && toString.call(this) !== '[object String]') {
        newOption = $("<option />")
        newOption.val(this.id).text(this.text);
        select.append(newOption);
    } else {
        newOption = $("<option />")
        newOption.val(this.toString()).text(this.toString());
        select.append(newOption);
    }
    if (newOption.text() === selectedOption) {
      newOption.attr('selected',true);    
    } else if (newOption.val() === currentSelection) {
      newOption.attr('selected',true);    
    } 
  });

  if (!selectedOption && !currentSelection) {
    select.find('option:first').attr('selected',true);
  }

  select.change();
}

function extractKeys(obj){
  var keys = [];
  for(var key in obj){
    keys.push(key);
  }
  return keys;
}

function isEmpty(obj){ 
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop)){ 
      return false; 
    }
  } 
  return true; 
}

/**
 * Input: A string representing 2 ints and a float, or just a single float
 * Output: Returns A decimal representation of the coordinate string
 */
function tupleStrToDecimal(str) {
  str = trimString(str);
  var singleFoat = false;
  // split ra and dec at spaces
  var tupleStr = str.split(/ /); 
  if (!(tupleStr.length === 3)) {
	  tupleStr = str.split(/:/); // split ra and dec at colons
	  if (!(tupleStr.length === 3)) {
	    var tryFloat = parseFloat(tupleStr[0]); // maybe it's only a single decimal?
	    if (tupleStr.length === 1 && !isNaN(tryFloat)) {
    	  return tryFloat;
	    } else {
	    	return null;
	    }
	  }
  }
  
  // test for whether the first 2 are ints, and the 3rd is a float
  var tupleNums = [];
  // specify radix of 10, beacuse 05  looks like octal 5
  tupleNums[0] = parseInt(tupleStr[0], 10);
  tupleNums[1] = parseInt(tupleStr[1], 10);
  tupleNums[2] = parseFloat(tupleStr[2], 10);
  // test for NaN in all 3 fields of both ra and dec
  for (var i=0; i<3; i++) {
    if (isNaN(tupleNums[i])) {
	    return null;
	  }
  }
  // convert the 3 sections to decimal
  return tupleNums[0] + (tupleNums[1] / 60.0) + (tupleNums[2] / 3600.0);
}

// Helper
function trimString(str) {
  return str.replace(/^\s+|\s+$/g,"");
}

function isObject(obj){
  return obj === Object(obj);
}

function roughSizeOfObject(object) {
  var objectList = [];
  var recurse = function(value){
      var bytes = 0;
      if (typeof value === 'boolean' ) {
            bytes = 4;
      }
      else if(typeof value === 'string') {
            bytes = value.length * 2;
      }
      else if(typeof value === 'number') {
            bytes = 8;
      }
      else if(typeof value === 'object' && objectList.indexOf( value ) === -1){
        objectList[ objectList.length ] = value;

        for( i in value ) {
          bytes+= 8; // an assumed existence overhead
          bytes+= recurse( value[i] )
        }
      }
    return bytes;
  }
  return recurse( object );
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