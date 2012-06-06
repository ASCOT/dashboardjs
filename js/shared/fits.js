
// DataView API wrapper. String -> ArrayBuffer converter
// Author: Diego Marcos
// Email: diego.marcos@gmail.com

define('libs/fitsParser/src/binaryDataView',[],function () {

  var BinaryDataView = function(binaryData, plittleEndian, start, offset){
    
    var littleEndian = littleEndian === undefined ? true : littleEndian;
    var dataBuffer;
    var dataView;
    var bytePointer = 0;
    var bufferLength;
    var dataSize = {
      'Int8': 1,
      'Int16': 2,
      'Int32': 4,
      'Uint8': 1,
      'Uint16': 2,
      'Uint32': 4,
      'Float32': 4,
      'Float64': 8
    };
    
    var dataGetter = function(byteOffset, plittleEndian, type){
      var data;
      if(plittleEndian === undefined){
        plittleEndian = littleEndian;
      }
      if(!byteOffset){
        byteOffset = bytePointer;
      }
      data = dataView['get' + type](byteOffset, plittleEndian);
      bytePointer = byteOffset + dataSize[type];
      return data;
    };
    
    if (!window.ArrayBuffer || !window.DataView) {
      throw new Error('The ArrayBuffer and DataView APIs are not supported in your browser.');
    }
    
    function parseBinaryString(binaryString){
      var i = 0;
      var character; 
      var byte;
      bufferLength = binaryString.length;
      dataBuffer = new ArrayBuffer(binaryString.length);
      dataView = new DataView(dataBuffer, 0, bufferLength);
      while (i < binaryString.length) {
        character = binaryString.charCodeAt(i);
        byte = character & 0xff;  
        dataView.setUint8(i, byte);
        i += 1;
      }
    }
    
    if (typeof binaryData === 'string') {
      parseBinaryString(binaryData);
    } else {
      if (binaryData instanceof ArrayBuffer) {
        dataBuffer = binaryData;
        bufferLength = offset || dataBuffer.byteLength;
        dataView = new DataView(dataBuffer, start !== undefined? start: 0, bufferLength);
      }
    }
    
    this.getInt8 = function(byteOffset, littleEndian) { return dataGetter(byteOffset, littleEndian, 'Int8'); };
    this.getInt16 = function(byteOffset, littleEndian) { return dataGetter(byteOffset, littleEndian, 'Int16'); };
    this.getInt32 = function(byteOffset, littleEndian) { return dataGetter(byteOffset, littleEndian, 'Int32'); };
    this.getUint8 = function(byteOffset, littleEndian) { return dataGetter(byteOffset, littleEndian, 'Uint8'); };    
    this.getUint16 = function(byteOffset, littleEndian) { return dataGetter(byteOffset, littleEndian, 'Uint16'); };    
    this.getUint32 = function(byteOffset, littleEndian) { return dataGetter(byteOffset, littleEndian, 'Uint32'); };    
    this.getFloat32 = function(byteOffset, littleEndian) { return dataGetter(byteOffset, littleEndian, 'Float32'); };    
    this.getFloat64 = function(byteOffset, littleEndian) { return dataGetter(byteOffset, littleEndian, 'Float64'); };
    this.length = function() { return dataView.byteLength; };    
  
  };

  return BinaryDataView;

});
// Parses FITS pixel data and converts fits photon count to the desired format
// Author: Diego Marcos
// Email: diego.marcos@gmail.com

// FITS images have arbitrary pixel values. Cameras count individual photons
// Highest pixel value is the brightest and lowest value the faintest

define('libs/fitsParser/src/fitsPixelMapper',['./binaryDataView'], function (BinaryDataView) {
  
  
  var mapPixel = function(pixelValue, colorMapping, maxColorValue, highestPixelValue, lowestPixelValue, meanPixelValue) {
    var mappedValue;
    var valuesRange = highestPixelValue - lowestPixelValue;
    switch (colorMapping) { 
        case 'linear' :
        mappedValue = maxColorValue * ((pixelValue - lowestPixelValue) / valuesRange );
        break;
      case 'sqrt' :
        mappedValue = maxColorValue * Math.sqrt((pixelValue - lowestPixelValue) / valuesRange );
        break;
      case 'cuberoot' :
        mappedValue = maxColorValue * Math.pow((pixelValue - lowestPixelValue) / valuesRange );
        break;
      case 'log' :
        mappedValue = maxColorValue * (Math.log((pixelValue - lowestPixelValue)) / valuesRange );
        break;
      case 'loglog':
        mappedValue = maxColorValue * (Math.log((Math.log(pixelValue) - lowestPixelValue)) / valuesRange );
        break;
      case 'sqrtlog':
        mappedValue = maxColorValue * (Math.sqrt((Math.log(pixelValue) - lowestPixelValue)) / valuesRange );
        break;
      default:
        break;
    }
    return mappedValue;
  };

  var convertToRGBA = function (pixelValue, colorMapping, highestPixelValue, lowestPixelValue, meanPixelValue){
    var colorValue = mapPixel(pixelValue, colorMapping, 255, highestPixelValue, lowestPixelValue, meanPixelValue);
    return {
      "red" : colorValue,
      "green" : colorValue,
      "blue" : colorValue,
      "alpha" : 255
    };
  };
  
  var convertToRGB = function () {
     
  };
  
  var pixelFormats = { 
    "RGB" : { "components" : 3, "convert" : convertToRGB },
    "RGBA" : { "components" : 4, "convert" : convertToRGBA }
  };

  var readPixel = function (dataView, bitpix) {
    var pixelValue;
    switch (bitpix) {
      case 8:
        pixelValue = dataView.getUint8();
        break;
      case 16:
        pixelValue = dataView.getInt16(0, false);
        break;
      case 32:
        pixelValue = dataView.getInt32(0, false);
        break;
      case 64:
        pixelValue = dataView.getFloat64(0, false);
        break;
      case -32:
        pixelValue = dataView.getFloat32(0, false);
        //if (pixelValue){
        //  pixelValue = (1.0 + ((pixelValue & 0x007fffff) / 0x0800000)) * Math.pow(2, ((pixelValue&0x7f800000)>>23) - 127);
        //}
        //pixelValue = Math.abs(pixelValue);  
        break;
      case -64:
        pixelValue = dataView.getFloat64(0, false);
        break;
      default: 
        //error('Unknown bitpix value');
    }
    return pixelValue; 
  };

  var error = function (message) {
    throw new Error('PIXEL PARSER - ' + message); 
  };
  
  var flipVertical = function (pixels, width, height) {
    var flippedPixels = [];
    var column = 0;
    var row = 0;
    while (row < height) {
      column = 0;
      while (column < width) {
        flippedPixels[(height - row -1)*width + column] = pixels[row*width + column];
        column += 1;  
      }
      row += 1;
    } 
    return flippedPixels;
  };
  
  var transpose = function (pixels, width, height) {
    var transposedPixels = [];
    var column = 0;
    var row = 0;
    while (row < height) {
      column = 0;
      while (column < width) {
        transposedPixels[row*width + column] = pixels[column*height + row];
        column += 1;  
      }
      row += 1;
    } 
    return transposedPixels;
  };

  var parsePixels = function(header, data){

    var bzero;
    var bscale;
    var bitpix;
    var pixelSize; // In bytes
    var pixelValue;
    var lowestPixelValue;
    var highestPixelValue;
    var meanPixelValue;
    var imagePixelsNumber;
    var remainingDataBytes;
    var dataView;
    var pixels = [];

    if (!header) {
      error('No header available in HDU');
    }
    
    if (!data) {
      error('No data available in HDU');
    }

    bzero = header.BZERO || 0.0;
    bscale = header.BSCALE || 1.0;
    bitpix = header.BITPIX;
    pixelSize = Math.abs(bitpix) / 8; // In bytes
    imagePixelsNumber = header.NAXIS1 * header.NAXIS2;
    dataView = new BinaryDataView(data, false, 0, imagePixelsNumber * pixelSize);
    remainingDataBytes = dataView.length();

    while(remainingDataBytes){
      pixelValue = readPixel(dataView, bitpix) * bscale + bzero;        
    
      if(lowestPixelValue === undefined){
        lowestPixelValue = pixelValue;
      } else {
        lowestPixelValue = pixelValue < lowestPixelValue? pixelValue : lowestPixelValue;
      }
      
      if(highestPixelValue === undefined){
        highestPixelValue = pixelValue;
      } else {
        highestPixelValue = pixelValue > highestPixelValue? pixelValue : highestPixelValue;
      }
      
      pixels.push(pixelValue);
      
      if(!meanPixelValue){
        meanPixelValue = pixelValue;
      } else {
        meanPixelValue = ((pixels.length - 1) / pixels.length) * meanPixelValue + (1 / pixels.length) * pixelValue; // Iterative mean formula
      }
      remainingDataBytes -= pixelSize;
    }

    header.MAXPIXEL = highestPixelValue;
    header.MINPIXEL = lowestPixelValue;
    header.MEANPIXEL = meanPixelValue;
    
    pixels = flipVertical(pixels, header.NAXIS1, header.NAXIS2); // FITS stores pixels in column major order
  
    return pixels;
    
  };

  var mapPixels = function (header, pixels, format, colorMapping) {
    var mappedPixel;
    var i = 0;
    var colorMapping = colorMapping || 'linear';
    
    if (!format || !pixelFormats[format]) {
     error('Unknown pixel format');
    }
    
    if (!header) {
      error('No header available in HDU');
    }
    
    if (!pixels) {
      error('No pixels available');
    }
    
    while (i < pixels.length) {
      mappedPixel = pixelFormats.RGBA.convert(pixels[i], colorMapping, header.MAXPIXEL, header.MINPIXEL, header.MEANPIXEL);
      mappedPixel.value = pixels[i];
      pixels[i] = mappedPixel;
      i += 1;
    }  

    return pixels;

  };

  return {
    'mapPixels' : mapPixels,
    'parsePixels' : parsePixels
  };

});
define('libs/fitsParser/src/fitsValidator',[],function () {
  
  var mandatoryKeywordsPrimaryHeader = ['BITPIX', 'NAXIS'];  // Sec 4.4.1.1
  var mandatoryKeywordsExtensionHeader = ['XTENSION', 'BITPIX', 'NAXIS', 'PCOUNT', 'GCOUNT']; // Sec 4.4.1.2
  
  var expressions = {
    "keyword" : /^[\x30-\x39\x41-\x5A\x5F\x2D]+$/, // Sec 4.1.2.1
    "comment" : /^[\x20-\x7E]*$/, // Sec 4.1.2.3
    "string" : /^\x27[\x20-\x7E]*\x27$/,
    "integer" : /^[\-+]{0,1}\d+$/,
    "complexInteger" : /^\(\s*([\-+]{0,1}\d)\s*,\s*([\-+]{0,1}\d)\s*\)$/,
    "float" : /^[\-+]{0,1}\d*(\.\d*){0,1}([ED][\-+]{0,1}\d+){0,1}$/,
    "complexFloat" : /^\(\s*([\-+]{0,1}\d*(?:\.\d*){0,1}(?:[ED][\-+]{0,1}\d+){0,1})\s*,\s*([\-+]{0,1}\d*(?:\.\d*){0,1}(?:[ED][\-+]{0,1}\d+){0,1})\s*\)$/,
    "valueComment" : /^(\s*\x27.*\x27\s*|[^\x2F]*)\x2F{0,1}(.*)$/,
    "logical" : /^(T|F)$/,
    "date" : /^\d{2,4}[:\/\-]\d{2}[:\/\-]\d{2}(T\d{2}:\d{2}:\d{2}(\.\d*){0,1}){0,1}$/,
    "dateXXXX" : /^DATE(.){1,4}$/,
    "ptypeXXX" : /^PTYPE\d{1,3}$/,
    "pscalXXX" : /^PSCAL\d{1,3}$/,
    "pzeroXXX" : /^PZERO\d{1,3}$/,
    "naxis" : /^NAXIS\d{1,3}$/
  };

  var trim = function(inputString, leading, trailing) {
    var trimmedString = inputString;
    if (!leading && !trailing) {
      return trimmedString.replace(/^\s*(\S*(?:\s+\S+)*)\s*$/, "$1");
    } else {
      if (leading) {
        trimmedString = trimmedString.replace(/^\s*(\S*(?:\s+\S+)*\s*)$/, "$1");
      }
      if (trailing) {
        trimmedString = trimmedString.replace(/^(\s*\S*(?:\s+\S+)*)\s*$/, "$1");
      }
      return trimmedString;
    }
  };
  
  var validateLogical = function(value, error){
    if (value) {
      if (!expressions.logical.test(value)) {
        error('Logical value: ' + value + 'not valid. Must be T or F');
        return;
      }
    } 
    return value === 'T'? true : false;
  };
  
  var validateDate = function(value, error){
    if (value) {  
      value = value.replace(/\x27/g, ''); // Removing enclosing quotes.
      if (!expressions.date.test(value)) {
        error('Date ' + value + ' has no valid format');
        return;
      }
    }
    return value;
  };
  
  var validateFloat = function(value, error){ // Sec 4.2.4
    if (value) {  
      if (!expressions.float.test(value)) {
        error('Float ' + value + ' has no valid format. Sec 4.2.4');
        return;
      }
    }
    return parseFloat(value);
  };
  
  var validateComplexFloat = function(value, error) { // Sec 4.2.6
    var parts;
    if (value) {  
      if (!expressions.complexFloat.test(value)) {
        error('Complex Float ' + value + ' has no valid format. Sec 4.2.6');
        return;
      }
      parts = expressions.complexFloat.exec(value);
    }
    return { 
      real : parseFloat(parts[1]),
      imaginary : parseFloat(parts[2])  
    };
  };
  
  var validateInteger = function(value, error) { // Sec 4.2.3
    if (value) {  
      if (!expressions.integer.test(value)) {
        error('Integer ' + value + ' has no valid format. Sec 4.2.3');
        return;
      }
    }
    return parseInt(value, 10);       
  };
  
  var validateComplexInteger = function(value, error) { // Sec 4.2.5
    var parts;
    if (value) {  
      if (!expressions.complexInteger.test(value)) {
        error('Complex Integer ' + value + ' has no valid format. Sec 4.2.5');
      return;
      }
      parts = expressions.complexInteger.exec(value);
    }
    return { 
      real : parseInt(parts[1], 10),
      imaginary : parseInt(parts[2], 10)  
    };
  };
  
  var validateString = function(value, error) { // Sec 4.2.1
    if (value) {  
      if (!expressions.string.test(value)) {
        error('String ' + value + ' contains non valid characters. Sec 4.2.1');
        return;
      }
      if (value.length > 68) {
        error('String ' + value + 'too long. Limit is 68 characters. Sec 4.2.1');
        return;
      }
      value = value.replace(/\x27{2}/g, "'"); // Replace two sucesive quotes with a single one.
      value = value.replace(/\x27/g, ''); // Enclosing single quotes are redundant at this point. We have a JavaScript native String.
      value = trim(value, false, true); // Removing non significant trailing spaces. Sec. 4.2.1 
    }
    return value;
  };
  
  var validateNAXIS = function(value, error) {
    value = parseInt(validateInteger(value, error), 10);
    if (value <= 0 || value > 999) {
      error('Not valid value for NAXIS: ' + value + ' Accepted values between 1 and 999. Sec 4.4.1');
      return;
    } 
    return value;
  };

  var validateBITPIX = function(value, error) {
    var validValues = fixedFormatKeywords.BITPIX.validValues;
    var i = 0;
    var valid = false;
    value = parseInt(validateInteger(value, error), 10);
    while (i < validValues.length) {
      if (validValues[i] === value) {
        valid = true;
        break;
      }
      i += 1;
    } 
    if(!valid){
      error('Not valid value for NAXIS: ' + value + ' Accepted values are ' + validValues.toString() + ' Sec 4.4.1');
      return;
    }
    return value;
  };
  
  var validatePrimaryHeader = function(header, error) {
    var i = 0;
    while (i < mandatoryKeywordsPrimaryHeader.length) {
      if (header[mandatoryKeywordsPrimaryHeader[i]] === undefined) {
        error('Keyword ' + mandatoryKeywordsPrimaryHeader[i] + ' not found in primary header');
      }
      i += 1;
    }
  };
  
  var validateExtensionHeader = function(header, error) {
    var i = 0;
    while (i < mandatoryKeywordsExtensionHeader.length) {
      if (header[mandatoryKeywordsExtensionHeader[i]] === undefined) {
        error('Keyword ' + mandatoryKeywordsExtensionHeader[i] + ' not found in primary header');
      }
      i += 1;
    }
  };

  var fixedFormatKeywords = {
    "BITPIX": { // Sec 4.4.1.1
      validValues: [8, 16, 32, 64, -32, -64],
      validate: validateBITPIX
    },
    "NAXIS": { // Sec 4.4.1.1
      validValues: { min: 0, max: 999 },
      validate: validateNAXIS
    },
    "PCOUNT": {
      validate: validateInteger
    },
    "GCOUNT": {
      validate: validateInteger
    },
    "DATE": {
      validate: validateDate 
    },
    "ORIGIN": {
      validate: validateString 
    },
    "EXTEND": {
      validate: validateLogical
    },
    "DATE-OBS": {
      validate: validateDate
    },
    "TELESCOP": {
      validate: validateString
    },
    "INSTRUME": {
      validate: validateString
    },
    "OBSERVER": {
      validate: validateString
    },
    "OBJECT": {
     validate: validateString
    },
    "BSCALE": {
      validate: validateFloat 
    },
    "BZERO": {
      validate: validateFloat 
    },
    "BUNIT": {
      validate: validateString
    },
    "BLANK": {
      validate: validateString
    },
    "DATAMAX": {
      validate: validateFloat
    },
    "DATAMIN": {
      validate: validateFloat
    },
    "EXTNAME": {
      validate: validateString
    },
    "EXTVER": {
      validate: validateInteger
    },
    "EXTLEVEL": {
      validate: validateInteger
    }
  };
  
  var extend = function(objTarget, objSource) {
    var prop;
    for (prop in objSource) {
      if (objSource[prop] !== void 0) {
        objTarget[prop] = objSource[prop];
      }
    }
    return objTarget; 
  };
  
  var validateComment = function(comment, keyword, error) { 
    if (comment) {
      comment = trim(comment);
      if (!expressions.comment.test(comment)) { 
        error("Illegal characther in record comment for record " + keyword);
        return;
      }
    }
    return comment;
  };
  
  var validateKeyword = function(keyword, error) { 
    keyword = trim(keyword);
    if (keyword) {
      if (!expressions['keyword'].test(keyword)) { 
        error("Illegal characther in header keyword " + keyword);
        return;
      } 
    }
    return keyword;
  };
  
  var validateFreeFormatValue = function(value, keyword, error){
    if (expressions.dateXXXX.test(keyword)) {
      return validateDate(value, error);
    }
    if (expressions.ptypeXXX.test(keyword)) {
      return validateString(value, error);
    }
    if (expressions.pscalXXX.test(keyword)) {
      return validateFloat(value, error);
    }
    if (expressions.pzeroXXX.test(keyword)) {
      return validateFloat(value, error);
    }
    if (expressions.naxis.test(keyword)) {
      return validateInteger(value, error);
    }
    if (expressions.string.test(value)) {
      return validateString(value, error);
    }
    if (expressions.logical.test(value)) {
      return validateLogical(value, error);
    }
    if (expressions.integer.test(value)) {
      return validateInteger(value, error);
    }
    if (expressions.float.test(value)) {
      return validateFloat(value, error);
    }
    return value;
  };
  
  var validateValue = function(value, keyword, recordString, error){
    if(value){
      value = trim(value);
      if (fixedFormatKeywords[keyword]) {
        if (expressions.string.test(value) && recordString.charCodeAt(10) !== 39) {
          error("Illegal characther in header keyword " + keyword + " Fixed format keyword values must start with simple quote after ="); // Sec 4.2.1
          return;
        }
        return fixedFormatKeywords[keyword].validate(value, error);
      } else {
        return validateFreeFormatValue(value, keyword, error);
      }
    }
    return value;
  };

  return {
    'validatePrimaryHeader' : validatePrimaryHeader,
    'validateExtensionHeader' : validateExtensionHeader,
    'validateKeyword' : validateKeyword,
    'validateComment' : validateComment,
    'validateValue' : validateValue
  };

});
define('libs/fitsParser/src/fitsFileParser',['./fitsValidator', './fitsPixelMapper'], function(fitsValidator, pixelMapper) {

  var FitsFileParser = function () {
    var blockSize = 2880; // In bytes
    var recordSize = 80;
    var file;
    var data = "";
    var headerRecords = [];
    var headerDataUnits = [];
    var fileBytePointer = 0;
    var slice;

    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
      console.error('The File APIs are not fully supported in this browser.');
      return;
    } else {  // For Mozilla 4.0+ || Chrome and Safari || Opera and standard browsers
      slice = File.prototype.mozSlice || File.prototype.webkitSlice || File.prototype.slice;
    }

    var parseHeaderRecord = function(recordString, error, warning) {
      var record = {};
      var valueComment = /^(\s*\x27.*\x27\s*|[^\x2F]*)\x2F{0,1}(.*)$/.exec(recordString.substring(10));
      var value;
      var comment;
      var keyword = recordString.substring(0, 8); // Keyword in the first 8 bytes. Sec 4.1.2.1
      
      if (recordString.charCodeAt(8) !== 61 || recordString.charCodeAt(9) !== 32) { // Value indicator Sec 4.1.2.2
        comment = recordString.substring(8); // If not value all the rest of the record treated like a comment Sec 4.1.2
        comment = comment.trim().replace(/^\/(.*)$/,"$1"); // Removing comment slash indicator
      } else {
        value = valueComment[1];
        comment = valueComment[2];
      }
      
      record.keyword = fitsValidator.validateKeyword(keyword, error) || undefined;
      record.comment = fitsValidator.validateComment(comment, keyword, warning) || undefined;
      record.value = fitsValidator.validateValue(value, record.keyword, recordString, error);
      return record;
    };

    var parseHeaderBlock = function(blockString, error, warning) {
      var records = [];
      var record = {};
      var bytePointer = 0;
      var recordString;
      while (bytePointer < blockString.length) {
        recordString = blockString.substring(bytePointer, bytePointer + recordSize - 1);
        if (/^END[\x20]*/.test(recordString)) {
          records.end = true;
          return records;
        }
        console.log(recordString);
        bytePointer += recordSize;
        record = parseHeaderRecord(recordString, error, warning);
        if (record) {
          records.push(record);
        }  
      }
      return records;
      };

    var parseHeaderBlocks = function (success, error) {
      var fileBlock;
      var reader = new FileReader();
      
      var parseError = function (message) {
        error("Error parsing file: " + message);
      };
      
      var parseWarning = function (message) {
        error("Warning: " + message);
      };
           
      reader.onload = function (e) {
        var parsedRecords;
        // Checking allowed characters in Header Data Unit (HDU). 
        // Subset of ASCII characters between 32 and 126 (20 and 7E in hex)
        if (!/^[\x20-\x7E]*$/.test(this.result)) { // Sec 3.2
          error("Ilegal character in header block");
        }
        parsedRecords = parseHeaderBlock(this.result, parseError, parseWarning);
        headerRecords = [].concat(headerRecords, parsedRecords);
        if (parsedRecords.errorMessage) {
          parseError(parsedRecords.errorMessage);
        }
        if (!parsedRecords.end) {
          parseHeaderBlocks(success, error);
        } else {
          success(headerRecords); 
        }
      };

      reader.onerror = function (e) {
        console.error("Error loading block");
      };
      
      if (fileBytePointer === blockSize) { // After reading the first block
        if (headerRecords[0].keyword !== 'SIMPLE') {  
          parseError('First keyword in primary header must be SIMPLE'); // Sec 4.4.1.1
        } else {
          if (!headerRecords[0].value) {  
            parseWarning("This file doesn't conform the standard. SIMPLE keyword value different than T"); // Sec 4.4.1.1
          }
        }
      }  
      fileBlock = slice.call(file, fileBytePointer, fileBytePointer + blockSize);
      fileBytePointer += blockSize;
      reader.readAsText(fileBlock);
    };
      
    var parseDataBlocks = function(dataSize, success, error) {
      var fileBlock;
      var reader = new FileReader();
      var blocksToRead = Math.ceil(dataSize / blockSize);
      var bytesToRead = blocksToRead * blockSize;
      var parseError = function (message) {
        error("Error parsing file: " + message);
      };
     
      reader.onload = function (e) {
        data = this.result; //.substring(0, dataSize); // Triming last bytes in excess in last block
        success(); 
      };

      reader.onerror = function (e) {
        console.error("Error loading data block");
      };

      fileBlock = slice.call(file, fileBytePointer, fileBytePointer + bytesToRead);
      fileBytePointer += bytesToRead;
      reader.readAsArrayBuffer(fileBlock);
    };

    var parseHeaderJSON = function(headerRecords){
      var i = 0;
      var header = {};
      var keyword;
      var record;
      while (i < headerRecords.length) {
        record = headerRecords[i];
        keyword = record.keyword;
        if(keyword && keyword !== "COMMENT" && keyword !== "HISTORY"){
          if (record.value) {
            header[keyword] = record.value;
          }
        }
        i += 1;
      }
      return header;
    };

    var parseHeaderDataUnit = function(success, error) {
      var headerJSON;
      var dataSize;
      var successParsingData = function () {
        success({
          "header": headerJSON,
          "data": pixelMapper.parsePixels(headerJSON, data),
          "headerRecords": headerRecords
        });
      };
      
      var succesParsingHeader = function (records) {
        var i = 1;
        headerRecords = records;
        headerJSON = parseHeaderJSON(headerRecords);
        dataSize = Math.abs(headerJSON.BITPIX) / 8;
        while (i <= headerJSON.NAXIS) {
          dataSize = dataSize * headerJSON["NAXIS" + i];
          i += 1;
        }
        parseDataBlocks(dataSize, successParsingData, error);
      };
      
      headerRecords = [];
      data = [];
      parseHeaderBlocks(succesParsingHeader, error);

    };

    this.parse = function (inputFile) {
      fileBytePointer = 0;
      file = inputFile;
      var that = this;
      if (!file) {
        console.error('Failed when loading file. No file selected');
        return;
      }
      
      var onErrorParsingHeaderDataUnit = function(error) {
        that.onError(error);
      };
      
      var onParsedHeaderDataUnit = function(headerDataUnit){
        if (headerDataUnits.length === 0){
          fitsValidator.validatePrimaryHeader(headerDataUnit.header, onErrorParsingHeaderDataUnit);
        } else {
          fitsValidator.validateExtensionHeader(headerDataUnit.header, onErrorParsingHeaderDataUnit);
        }
        headerDataUnits.push(headerDataUnit);
        if (fileBytePointer < file.fileSize){
          parseHeaderDataUnit(onParsedHeaderDataUnit, onErrorParsingHeaderDataUnit);
        } else {
          that.onParsed(headerDataUnits);
        }
      };  
        
      parseHeaderDataUnit(onParsedHeaderDataUnit, onErrorParsingHeaderDataUnit);
      
    };

    this.onParsed = function (headerDataUnits) {};
    this.onError = function (error) {
      console.error(error);
    };

  };

  return FitsFileParser;

});
//
// jDataView by Vjeux - Jan 2010
//
// A unique way to read a binary file in the browser
// http://github.com/vjeux/jsDataView
// http://blog.vjeux.com/ <vjeuxx@gmail.com>
// 

define('libs/fitsParser/src/libs/pngParser/src/jdataview',[],function () {

  var compatibility = {
    ArrayBuffer: typeof ArrayBuffer !== 'undefined',
    DataView: typeof DataView !== 'undefined' && 'getFloat64' in DataView.prototype
  }

  var jDataView = function (buffer, byteOffset, byteLength, littleEndian) {
    this._buffer = buffer;

    // Handle Type Errors
    if (!(compatibility.ArrayBuffer && buffer instanceof ArrayBuffer) &&
      !(typeof buffer === 'string')) {
      throw new TypeError("Type error");
    }

    // Check parameters and existing functionnalities
    this._isArrayBuffer = compatibility.ArrayBuffer && buffer instanceof ArrayBuffer;
    this._isDataView = compatibility.DataView && this._isArrayBuffer;

    // Default Values
    this._littleEndian = littleEndian === undefined ? false : littleEndian;

    var bufferLength = this._isArrayBuffer ? buffer.byteLength : buffer.length;
    if (byteOffset == undefined) {
      byteOffset = 0;
    }

    if (byteLength == undefined) {
      byteLength = bufferLength - byteOffset;
    }

    if (!this._isDataView) {
      // Do additional checks to simulate DataView
      if (typeof byteOffset !== 'number') {
        throw new TypeError("Type error");
      }
      if (typeof byteLength !== 'number') {
        throw new TypeError("Type error");
      }
      if (typeof byteOffset < 0) {
        throw new Error("INDEX_SIZE_ERR: DOM Exception 1");
      }
      if (typeof byteLength < 0) {
        throw new Error("INDEX_SIZE_ERR: DOM Exception 1");
      }
    }

    // Instanciate
    if (this._isDataView) {
      this._view = new DataView(buffer, byteOffset, byteLength);
      this._start = 0;
    }
    this._start = byteOffset;
    if (byteOffset >= bufferLength) {
      throw new Error("INDEX_SIZE_ERR: DOM Exception 1");
    }

    this._offset = 0;
    this.length = byteLength;
  };

  jDataView.createBuffer = function () {
    if (typeof ArrayBuffer !== 'undefined') {
      var buffer = new ArrayBuffer(arguments.length);
      var view = new Int8Array(buffer);
      for (var i = 0; i < arguments.length; ++i) {
        view[i] = arguments[i];
      }
      return buffer;
    }

    return String.fromCharCode.apply(null, arguments);
  };

  jDataView.prototype = {

    // Helpers

    getString: function (length, byteOffset) {
      var value;

      // Handle the lack of byteOffset
      if (byteOffset === undefined) {
        byteOffset = this._offset;
      }

      // Error Checking
      if (typeof byteOffset !== 'number') {
        throw new TypeError("Type error");
      }
      if (length < 0 || byteOffset + length > this.length) {
        throw new Error("INDEX_SIZE_ERR: DOM Exception 1");
      }

      if (this._isArrayBuffer) {
        // Use Int8Array and String.fromCharCode to extract a string
        var int8array = new Int8Array(this._buffer, this._start + byteOffset, length);
        var stringarray = [];
        for (var i = 0; i < length; ++i) {
          stringarray[i] = int8array[i];
        }
        value = String.fromCharCode.apply(null, stringarray);
      } else {
        value = this._buffer.substr(this._start + byteOffset, length);
      }

      this._offset = byteOffset + length;
      return value;
    },

    getChar: function (byteOffset) {
      var value, size = 1;

      // Handle the lack of byteOffset
      if (byteOffset === undefined) {
        byteOffset = this._offset;
      }

      if (this._isArrayBuffer) {
        // Use Int8Array and String.fromCharCode to extract a string
        value = String.fromCharCode(this.getUint8(byteOffset));
      } else {
        // Error Checking
        if (typeof byteOffset !== 'number') {
          throw new TypeError("Type error");
        }
        if (byteOffset + size > this.length) {
          throw new Error("INDEX_SIZE_ERR: DOM Exception 1");
        }

        value = this._buffer.charAt(this._start + byteOffset);
        this._offset = byteOffset + size;
      }

      return value;
    },

    tell: function () {
      return this._offset;
    },
    
    seek: function (byteOffset) {
      if (typeof byteOffset !== 'number') {
        throw new TypeError("Type error");
      }
      if (byteOffset < 0 || byteOffset > this.length) {
        throw new Error("INDEX_SIZE_ERR: DOM Exception 1");
      }

      this._offset = byteOffset;
    },

    // Compatibility functions on a String Buffer

    _endianness: function (offset, pos, max, littleEndian) {
      return offset + (littleEndian ? max - pos - 1 : pos);
    },

    _getFloat64: function (offset, littleEndian) {
      var b0 = this._getUint8(this._endianness(offset, 0, 8, littleEndian)),
        b1 = this._getUint8(this._endianness(offset, 1, 8, littleEndian)),
        b2 = this._getUint8(this._endianness(offset, 2, 8, littleEndian)),
        b3 = this._getUint8(this._endianness(offset, 3, 8, littleEndian)),
        b4 = this._getUint8(this._endianness(offset, 4, 8, littleEndian)),
        b5 = this._getUint8(this._endianness(offset, 5, 8, littleEndian)),
        b6 = this._getUint8(this._endianness(offset, 6, 8, littleEndian)),
        b7 = this._getUint8(this._endianness(offset, 7, 8, littleEndian)),

        sign = 1 - (2 * (b0 >> 7)),
        exponent = ((((b0 << 1) & 0xff) << 3) | (b1 >> 4)) - (Math.pow(2, 10) - 1),

      // Binary operators such as | and << operate on 32 bit values, using + and Math.pow(2) instead
        mantissa = ((b1 & 0x0f) * Math.pow(2, 48)) + (b2 * Math.pow(2, 40)) + (b3 * Math.pow(2, 32))
            + (b4 * Math.pow(2, 24)) + (b5 * Math.pow(2, 16)) + (b6 * Math.pow(2, 8)) + b7;

      if (mantissa == 0 && exponent == -(Math.pow(2, 10) - 1)) {
        return 0.0;
      }

      if (exponent == -1023) { // Denormalized
        return sign * mantissa * Math.pow(2, -1022 - 52);
      }

      return sign * (1 + mantissa * Math.pow(2, -52)) * Math.pow(2, exponent);
    },

    _getFloat32: function (offset, littleEndian) {
      var b0 = this._getUint8(this._endianness(offset, 0, 4, littleEndian)),
        b1 = this._getUint8(this._endianness(offset, 1, 4, littleEndian)),
        b2 = this._getUint8(this._endianness(offset, 2, 4, littleEndian)),
        b3 = this._getUint8(this._endianness(offset, 3, 4, littleEndian)),

        sign = 1 - (2 * (b0 >> 7)),
        exponent = (((b0 << 1) & 0xff) | (b1 >> 7)) - 127,
        mantissa = ((b1 & 0x7f) << 16) | (b2 << 8) | b3;

      if (mantissa == 0 && exponent == -127) {
        return 0.0;
      }

      if (exponent == -127) { // Denormalized
        return sign * mantissa * Math.pow(2, -126 - 23);
      }

      return sign * (1 + mantissa * Math.pow(2, -23)) * Math.pow(2, exponent);
    },

    _getInt32: function (offset, littleEndian) {
      var b = this._getUint32(offset, littleEndian);
      return b > Math.pow(2, 31) - 1 ? b - Math.pow(2, 32) : b;
    },

    _getUint32: function (offset, littleEndian) {
      var b3 = this._getUint8(this._endianness(offset, 0, 4, littleEndian)),
        b2 = this._getUint8(this._endianness(offset, 1, 4, littleEndian)),
        b1 = this._getUint8(this._endianness(offset, 2, 4, littleEndian)),
        b0 = this._getUint8(this._endianness(offset, 3, 4, littleEndian));

      return (b3 * Math.pow(2, 24)) + (b2 << 16) + (b1 << 8) + b0;
    },

    _getInt16: function (offset, littleEndian) {
      var b = this._getUint16(offset, littleEndian);
      return b > Math.pow(2, 15) - 1 ? b - Math.pow(2, 16) : b;
    },

    _getUint16: function (offset, littleEndian) {
      var b1 = this._getUint8(this._endianness(offset, 0, 2, littleEndian)),
        b0 = this._getUint8(this._endianness(offset, 1, 2, littleEndian));

      return (b1 << 8) + b0;
    },

    _getInt8: function (offset) {
      var b = this._getUint8(offset);
      return b > Math.pow(2, 7) - 1 ? b - Math.pow(2, 8) : b;
    },

    _getUint8: function (offset) {
      if (this._isArrayBuffer) {
        return new Uint8Array(this._buffer, this._start + offset, 1)[0];
      } else {
        return this._buffer.charCodeAt(this._start + offset) & 0xff;
      }
    }
  };

  // Create wrappers

  var dataTypes = {
    'Int8': 1,
    'Int16': 2,
    'Int32': 4,
    'Uint8': 1,
    'Uint16': 2,
    'Uint32': 4,
    'Float32': 4,
    'Float64': 8
  };

  for (var type in dataTypes) {
    // Bind the variable type
    (function (type) {
      var size = dataTypes[type];

      // Create the function
      jDataView.prototype['get' + type] = 
        function (byteOffset, littleEndian) {
          var value;

          // Handle the lack of endianness
          if (littleEndian == undefined) {
            littleEndian = this._littleEndian;
          }

          // Handle the lack of byteOffset
          if (byteOffset === undefined) {
            byteOffset = this._offset;
          }

          // Dispatch on the good method
          if (this._isDataView) {
            // DataView: we use the direct method
            value = this._view['get' + type](byteOffset, littleEndian);
          }
          // ArrayBuffer: we use a typed array of size 1 if the alignment is good
          // ArrayBuffer does not support endianess flag (for size > 1)
          else if (this._isArrayBuffer && byteOffset % size == 0 && (size == 1 || littleEndian)) {
            value = new self[type + 'Array'](this._buffer, byteOffset, 1)[0];
          }
          else {
            // Error Checking
            if (typeof byteOffset !== 'number') {
              throw new TypeError("Type error");
            }
            if (byteOffset + size > this.length) {
              throw new Error("INDEX_SIZE_ERR: DOM Exception 1");
            }
            value = this['_get' + type](this._start + byteOffset, littleEndian);
          }

          // Move the internal offset forward
          this._offset = byteOffset + size;

          return value;
        };
    })(type);
  }

  self.jDataView = jDataView;

  return jDataView;

});
/*
Copyright (c) 2008 notmasteryet

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

define('libs/fitsParser/src/libs/pngParser/src/deflateOld',[],function() {

  /* inflate stuff - RFC 1950 */
  var staticCodes, staticDistances;
  var encodedLengthStart = new Array(3,4,5,6,7,8,9,10,
    11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,
    115,131,163,195,227,258);
        
  var encodedLengthAdditionalBits = new Array(0,0,0,0,0,0,0,0,
    1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0);

  var encodedDistanceStart = new Array(1,2,3,4, 5,7,9,
    13,17,25, 33,49,65, 97,129,193,257,385,513,769,1025,1537,2049,
    3073,4097,6145,8193,12289,16385,24577);

  var encodedDistanceAdditionalBits = new Array(0,0,0,0,1,1,2,2,3,3,4,4,
    5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13);

  var clenMap = new Array(16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15);

  var BitReader = function(reader){
    this.bitsLength = 0;
    this.bits = 0;
    this.reader = reader;
    this.readBit = function() {
      if(this.bitsLength == 0) {
        var nextByte = this.reader.readByte();
        if(nextByte < 0) throw new "Unexpected end of stream";
        this.bits = nextByte;
        this.bitsLength = 8;
      }            
      var bit = (this.bits & 1) != 0;
      this.bits >>= 1;
      --this.bitsLength;
      return bit;
    };
    this.align = function() { this.bitsLength = 0; };
    this.readLSB = function(length) {
      var data = 0;
      for (var i=0;i<length;++i) {
        if(this.readBit()) data |= 1 << i;
      }
      return data;
    };
    this.readMSB = function(length) {
      var data = 0;
      for(var i=0;i<length;++i) {                 
        if(this.readBit()) data = (data << 1) | 1; else data <<= 1;
      }
      return data;
    };
  };

 var buildCodes = function (lengths) {
    var codes = new Array(lengths.length);
    var maxBits = lengths[0];
    for (var i=1; i<lengths.length; i++){
      if (maxBits < lengths[i]) maxBits = lengths[i];
    }

    var bitLengthsCount = new Array(maxBits + 1);
    for (var i=0; i<=maxBits; i++) bitLengthsCount[i]=0;
    
    for (var i=0; i<lengths.length; i++){
      ++bitLengthsCount[lengths[i]];
    }
  
    var nextCode = new Array(maxBits + 1);
    var code = 0;
    bitLengthsCount[0] = 0;

    for (var bits=1; bits<=maxBits; bits++){
      code = (code + bitLengthsCount[bits - 1]) << 1;
      nextCode[bits] = code;
    }

    for (var n=0; n<codes.length; n++){
      var len = lengths[n];
      if (len != 0) {
        codes[n] = nextCode[len];
        nextCode[len]++;
      }
    }
    return codes;
  };

  var initializeStaticTrees = function () {
    var codes = new Array(288);
    var codesLengths = new Array(288);
    
    for (var i = 0; i <= 143; i++)
    {
        codes[i] = 0x0030 + i;
        codesLengths[i] = 8;
    }
    for (var i = 144; i <= 255; i++)
    {
        codes[i] = 0x0190 + i - 144;
        codesLengths[i] = 9;
    }
    for (var i = 256; i <= 279; i++)
    {
        codes[i] = 0x0000 + i - 256;
        codesLengths[i] = 7;
    }
    for (var i = 280; i <= 287; i++)
    {
        codes[i] = 0x00C0 + i - 280;
        codesLengths[i] = 8;
    }
    staticCodes = buildTree(codes, codesLengths);

    var distances = new Array(32);
    var distancesLengths = new Array(32);
    for (var i = 0; i <= 31; i++)
    {
        distances[i] = i;
        distancesLengths[i] = 5;
    }
    staticDistances = buildTree(distances, distancesLengths);
  };

  var buildTree = function (codes, lengths) {
    var nonEmptyCodes = new Array(0);
    for(var i=0; i<codes.length; ++i)
    {
        if(lengths[i] > 0)
        {
            var code = new Object();
            code.bits = codes[i];
            code.length = lengths[i];
            code.index = i;
            nonEmptyCodes.push(code);
        }
    }
    return buildTreeBranch(nonEmptyCodes, 0, 0);
  };

  var buildTreeBranch = function (codes, prefix, prefixLength) {
    if(codes.length == 0) return null;
   
    var zeros = new Array(0);
    var ones = new Array(0);
    var branch = new Object();
    branch.isLeaf = false;
    for (var i=0; i<codes.length; ++i) {
      if(codes[i].length == prefixLength && codes[i].bits == prefix) {
        branch.isLeaf = true;
        branch.index = codes[i].index;
        break;
      } else {
        var nextBit = ((codes[i].bits >> (codes[i].length - prefixLength - 1)) & 1) > 0;
        if (nextBit) {
          ones.push(codes[i]);
        }
        else {
          zeros.push(codes[i]);
        }
      }
    }
    if (!branch.isLeaf) {
      branch.zero = buildTreeBranch(zeros, (prefix << 1), prefixLength + 1);
      branch.one = buildTreeBranch(ones, (prefix << 1) | 1, prefixLength + 1);
    }
    return branch;
  };

  var readDynamicTrees = function (bitReader) {
    var hlit = bitReader.readLSB(5) + 257;
    var hdist = bitReader.readLSB(5) + 1;
    var hclen = bitReader.readLSB(4) + 4;
    
    var clen = new Array(19);
    for(var i=0; i<clen.length; ++i) clen[i] = 0;
    for(var i=0; i<hclen; ++i) clen[clenMap[i]] = bitReader.readLSB(3);

    var clenCodes = buildCodes(clen);
    var clenTree = buildTree(clenCodes, clen);
    
    var lengthsSequence = new Array(0);
    while (lengthsSequence.length < hlit + hdist) {
      var p = clenTree;
      while (!p.isLeaf) {
        p = bitReader.readBit() ? p.one : p.zero;
      }
      
      var code = p.index;
      if(code <= 15) {
        lengthsSequence.push(code);
      } else if(code == 16) {
        var repeat = bitReader.readLSB(2) + 3;
        for(var q=0; q<repeat; ++q) {
          lengthsSequence.push(lengthsSequence[lengthsSequence.length - 1]);
        }
      }
      else if(code == 17) {
        var repeat = bitReader.readLSB(3) + 3;
        for (var q=0; q<repeat; ++q) {
          lengthsSequence.push(0);
        }
      }
      else if(code == 18) {
        var repeat = bitReader.readLSB(7) + 11;
        for (var q=0; q<repeat; ++q) {
          lengthsSequence.push(0);
        }
      }
    }

    var codesLengths = lengthsSequence.slice(0, hlit);
    var codes = buildCodes(codesLengths);
    var distancesLengths = lengthsSequence.slice(hlit, hlit + hdist);
    var distances = buildCodes(distancesLengths);
    
    var result = new Object();
    result.codesTree = buildTree(codes, codesLengths);
    result.distancesTree = buildTree(distances, distancesLengths);
    return result;
  };
        
  var Inflator = function(reader) {
    this.reader = reader;
    this.bitReader = new BitReader(reader);
    this.buffer = new Array(0);
    this.bufferPosition = 0;
    this.state = 0;
    this.blockFinal = false;
    this.counter = 0;
    this.readByte = function() {
      while (this.bufferPosition >= this.buffer.length) {
        var item = this.decodeItem();
        if(item == null) return -1;
        switch(item.itemType) {
          case 0:
              this.buffer = this.buffer.concat(item.array);
              break;
          case 2:
              this.buffer.push(item.symbol);
              break;
          case 3:
              var j = this.buffer.length - item.distance;
              for(var i=0;i<item.length;i++) {
                this.buffer.push(this.buffer[j++]);
              }
              break;
        }
      }
      var symbol = this.buffer[this.bufferPosition++];
      if (this.bufferPosition > 0xC000) {
        var shift = this.buffer.length - 0x8000;
        if(shift > this.bufferPosition) shift = this.bufferPosition;
        this.buffer.splice(0, shift);
        this.bufferPosition -= shift;
      }
      return symbol;
    };
    
    this.decodeItem = function() {
      if(this.state == 2) return null;
      
      var item;
      if(this.state == 0) {
        this.blockFinal = this.bitReader.readBit();
        var blockType = this.bitReader.readLSB(2);
        switch (blockType) {
          case 0:
            this.bitReader.align();
            var len = this.bitReader.readLSB(16);
            var nlen = this.bitReader.readLSB(16);
            if((len & ~nlen) != len) throw "Invalid block type 0 length";
            
            item = new Object();
            item.itemType = 0;
            item.array = new Array(len);
            for (var i=0;i<len;++i) {
                var nextByte = this.reader.readByte();
                if(nextByte < 0) throw "Uncomplete block";
                item.array[i] = nextByte;
            }
            if (this.blockFinal) this.state = 2;                 
            return item;
          case 1:
            this.codesTree = staticCodes;
            this.distancesTree = staticDistances;
            this.state = 1;
            break;
          case 2:
            var dynamicTrees = readDynamicTrees(this.bitReader);
            this.codesTree = dynamicTrees.codesTree;
            this.distancesTree = dynamicTrees.distancesTree;
            this.state = 1;
            break;
          default:    
            throw new "Invalid block type (3)";
        }
      }

      item = new Object();
      var p = this.codesTree;
      while (!p.isLeaf) {
        p = this.bitReader.readBit() ? p.one : p.zero;
      }
      if (p.index < 256) {
        item.itemType = 2;
        item.symbol = p.index;
      }
      else if (p.index > 256) {
        var lengthCode = p.index;
        if (lengthCode > 285) throw new "Invalid length code";
        
        var length = encodedLengthStart[lengthCode - 257];
        if (encodedLengthAdditionalBits[lengthCode - 257] > 0) {
          length += this.bitReader.readLSB(encodedLengthAdditionalBits[lengthCode - 257]);
        }
    
        p = this.distancesTree;
        while (!p.isLeaf) {
          p = this.bitReader.readBit() ? p.one : p.zero;
        }
        
        var distanceCode = p.index;
        var distance = encodedDistanceStart[distanceCode];
        if (encodedDistanceAdditionalBits[distanceCode] > 0) {
          distance += this.bitReader.readLSB(encodedDistanceAdditionalBits[distanceCode]);
        }
        item.itemType = 3;
        item.distance = distance;
        item.length = length;
      }
      else {
        item.itemType = 1;
        this.state = this.blockFinal ? 2 : 0;
      }
      return item;
    };
  };

  /* initialization */
  initializeStaticTrees();

  return Inflator;

});
define('libs/fitsParser/src/libs/pngParser/src/pngParser.js',['./jdataview', './deflateOld'], function (jDataView, Inflator) {
  

  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  var PNGStringParser = function () {
    this.paeth_predictor = __bind(this.paeth_predictor, this);
    this.filter_paeth = __bind(this.filter_paeth, this);
    this.filter_average = __bind(this.filter_average, this);
    this.filter_up = __bind(this.filter_up, this);
    this.filter_sub = __bind(this.filter_sub, this);
    this.filter_none = __bind(this.filter_none, this);
    this.read_line = __bind(this.read_line, this);

    this.parse = function (binary_string) {
      var headerDataUnit = {};
      headerDataUnit.header = {};
      headerDataUnit.data = [];
      var chunk;
      this.view = new jDataView(binary_string);
      this.idat_chunks = [];
      this.eof = false;
      this.number_of_ihdr = 0;
      this.number_of_idat = 0;
      this.check_signature();
      this.headerDataUnits = [];
      this.filters = [this.filter_none, this.filter_sub, this.filter_up, this.filter_average, this.filter_paeth];
      while (!this.eof) {
        chunk = this.read_chunk();
        switch (chunk.type) {
          case 'IHDR':
            this.read_ihdr(chunk.data);
            break;
          case 'wHAT':
            this.read_what(chunk.data);
            break;
          case 'IDAT':
            this.read_idat(chunk.data);
            break;
          case 'IEND':
            console.log('end of file, baby!');
        }
      }
      this.chunk_reader = new Inflator({
        chunk: 0,
        index: 2,
        data: this.idat_chunks,
        num_chunks: this.number_of_idat,
        readByte: function() {
          if (this.chunk >= this.data.length) return -1;
          while (this.index >= this.data[this.chunk].length) {
            this.index = 0;
            this.chunk += 1;
            if (this.chunk >= this.num_chunks) return -1;
          }
          this.index += 1;
          return this.data[this.chunk][this.index - 1];
        }
      });

      headerDataUnit.header.NAXIS1 = this.width;
      headerDataUnit.header.NAXIS2 = this.height;
      headerDataUnit.header.BITPIX = 16;
      headerDataUnit.header.MINPIXEL = this.min_pixel;
      headerDataUnit.header.MAXPIXEL = this.max_pixel;

      for (var i = 0; i < this.height; ++i) {
        headerDataUnit.data = headerDataUnit.data.concat(this.read_line());
      }

      this.headerDataUnits.push(headerDataUnit);
      this.onParsed(this.headerDataUnits);

    };

    this.onParsed = function (headerDataUnits) {};
    this.onError = function (error) {
      console.error(error);
    };

  };

  // Convert bytes to an integer
  PNGStringParser.to_integer = function(bytes, index) {
    return (bytes[index] << 24) | (bytes[index + 1] << 16) | (bytes[index + 2] << 8) | bytes[index + 3];
  };

  //Verify the PNG signature
  PNGStringParser.png_signature = [137, 80, 78, 71, 13, 10, 26, 10];

  PNGStringParser.prototype.check_signature = function() {
    var byte, _i, _len, _ref, _results;
    _ref = PNGStringParser.png_signature;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      byte = _ref[_i];
      _results.push(this.verify_byte(byte));
    }
    return _results;
  };

  PNGStringParser.prototype.verify_byte = function(byte) {
    if (byte !== this.view.getUint8()) throw "PNG signature is not correct";
  };

  // Read a PNG chunk, determines the length and type, and extracts the data
  PNGStringParser.prototype.read_chunk = function() {
    var data, i, length, type;
    length = this.view.getUint32();
    type = this.view.getString(4);
    console.log(type, length);
    data = (function() {
      var _results;
      _results = [];
      for (i = 1; 1 <= length ? i <= length : i >= length; 1 <= length ? i++ : i--) {
        _results.push(this.view.getUint8());
      }
      return _results;
    }).call(this);
    if (type === 'IEND') {
      this.eof = true;
      return {
        type: type,
        data: data
      };
    }
    if (data.length !== length) throw "PNG chunk out of bounds";
    this.view.seek(this.view.tell() + 4);
    return {
      type: type,
      data: data
    };
  };

  /*
    Read the required IHDR chunk of the PNG.  Sets variables for 
    scanning lines.  Extracts:
     * width
     * height
     * color type
     * bit depth
     * compression
     * filter method
     * interlace method
  */
  PNGStringParser.prototype.read_ihdr = function(data) {
    var allowed_bit_depths, allowed_color_types, index;
    this.number_of_ihdr += 1;
    if (this.number_of_ihdr > 1) throw "PNG contains too many IHDR chunks";
    this.width = PNGStringParser.to_integer(data, 0);
    this.height = PNGStringParser.to_integer(data, 4);
    allowed_color_types = [0];
    if (allowed_color_types.indexOf(data[9]) < 0) {
      throw "PNG contains an unallowed color type (only supporting grayscale)";
    }
    this.color_type = data[9];
    allowed_bit_depths = [8, 16];
    if (allowed_bit_depths.indexOf(data[8]) < 0) {
      throw "PNG contains an unallowed bit depth (only supporting 8 and 16 bit depths)";
    }
    this.bit_depth = data[8];
    this.shift = this.bit_depth - 8;
    this.param_length = this.bit_depth / 8;
    this.line_length = this.param_length * this.width;
    this.index_offset = this.param_length - 1;
    this.prev_line = (function() {
      var _ref, _results;
      _results = [];
      for (index = 1, _ref = this.line_length; 1 <= _ref ? index <= _ref : index >= _ref; 1 <= _ref ? index++ : index--) {
        _results.push(0);
      }
      return _results;
    }).call(this);
    if (data[10] !== 0) throw "PNG contains an unknown compression method";
    this.compression = data[10];
    if (data[11] !== 0) throw "PNG contains an unknown filter method";
    this.filter_method = data[11];
    if (data[12] !== 0 && data[12] !== 1) {
      throw "PNG contains an unknown interlace method";
    }
    this.interlace_method = data[12];
    return console.log(this.width, this.height, this.bit_depth, this.color_type);
  };

  /*
    Read the custom wHAT chunk.  Extracts
     * Minimum pixel value
     * Maximum pixel value
  */
  PNGStringParser.prototype.read_what = function(data) {
    if (this.bit_depth === 8) {
      this.min_pixel = data[0];
      this.max_pixel = data[1];
    } else if (this.bit_depth === 16) {
      this.min_pixel = data[0] << 8 | data[1];
      this.max_pixel = data[2] << 8 | data[3];
    }
    return console.log('min and max pixels', this.min_pixel, this.max_pixel);
  };

  /*
    Reads the IDAT (image data) into the class scope for later processing.
  */
  PNGStringParser.prototype.read_idat = function(data) {
    this.idat_chunks[this.number_of_idat] = data;
    return this.number_of_idat += 1;
  };

  /*
    Scans a line for image data.
  */
  PNGStringParser.prototype.read_line = function() {
    var a, a_param, b, c, data, element, filter_code, index, recon_data, _len, _ref;
    a_param = (function() {
      var _ref, _results;
      _results = [];
      for (index = 1, _ref = this.param_length; 1 <= _ref ? index <= _ref : index >= _ref; 1 <= _ref ? index++ : index--) {
        _results.push(0);
      }
      return _results;
    }).call(this);
    filter_code = this.chunk_reader.readByte();
    data = (function() {
      var _ref, _results;
      _results = [];
      for (index = 1, _ref = this.line_length; 1 <= _ref ? index <= _ref : index >= _ref; 1 <= _ref ? index++ : index--) {
        _results.push(this.chunk_reader.readByte());
      }
      return _results;
    }).call(this);
    recon_data = [];
    for (index = 0, _len = data.length; index < _len; index++) {
      element = data[index];
      a = a_param[index % this.param_length];
      b = this.prev_line[index];
      c = (_ref = this.prev_line[index - this.param_length]) != null ? _ref : 0;
      recon_data[index] = this.filters[filter_code](data[index], a, b, c);
      a_param[index % this.param_length] = recon_data[index];
    }
    this.prev_line = recon_data;
    data = (function() {
      var _ref2, _ref3, _results;
      _results = [];
      for (index = 0, _ref2 = this.line_length - 1, _ref3 = this.param_length; 0 <= _ref2 ? index <= _ref2 : index >= _ref2; index += _ref3) {
        _results.push(recon_data[index] << this.shift | recon_data[index + this.index_offset]);
      }
      return _results;
    }).call(this);
    return data;
  };

  /*
    Various filter functions, defined by the PNG specifications.
  */
  PNGStringParser.prototype.filter_none = function(x, a, b, c) {
    return x;
  };

  PNGStringParser.prototype.filter_sub = function(x, a, b, c) {
    return (x + a) & 0xff;
  };

  PNGStringParser.prototype.filter_up = function(x, a, b, c) {
    return (x + b) & 0xff;
  };

  PNGStringParser.prototype.filter_average = function(x, a, b, c) {
    return (x + ((a + b) >> 1)) & 0xff;
  };

  PNGStringParser.prototype.filter_paeth = function(x, a, b, c) {
    var pr;
    pr = this.paeth_predictor(a, b, c);
    return (x + pr) & 0xff;
  };

  PNGStringParser.prototype.paeth_predictor = function(a, b, c) {
    var p, pa, pb, pc, pr;
    p = a + b - c;
    pa = Math.abs(p - a);
    pb = Math.abs(p - b);
    pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) {
      pr = a;
    } else if (pb <= pc) {
      pr = b;
    } else {
      pr = c;
    }
    return pr;
  };

  return PNGStringParser;

});
// FITS Standard 3.0 Parser
// Author: Diego Marcos
// Email: diego.marcos@gmail.com

define('libs/fitsParser/src/fitsParser.js',['./fitsPixelMapper', './fitsFileParser', './libs/pngParser/src/pngParser.js'], function (fitsPixelMapper, FitsFileParser, PngParser) {
   
  
  var FitsParser = function() {
    var parser;
    //var fileExtensionExpr = /.*\.([^.]+)$/
    var imageType;
    var that = this;

    var checkFileSignature = function(file, success) {
      var reader = new FileReader();
      var slice;

      reader.onload = function (e) {
        success(this.result, file);
      };

      reader.onerror = function (e) {
        console.error("Error loading block");
      };

      if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
        console.error('The File APIs are not fully supported in this browser.');
        return;
      } else {  // For Mozilla 4.0+ || Chrome and Safari || Opera and standard browsers
        slice = File.prototype.mozSlice || File.prototype.webkitSlice || File.prototype.slice;
      }
      reader.readAsText(slice.call(file, 0, 8));

    };

    var parseFile = function (fileSignature, file){
      
      if (fileSignature === 'SIMPLE  ') {
        parser = new FitsFileParser();
      } else if (fileSignature === String.fromCharCode(65533, 80, 78, 71, 13, 10, 26, 10)) {
        parser = new PngFileParser();
      } else {
        console.error('FitsParser. Unknown image format')
        return;
      }
      parser.onParsed = that.onParsed;
      parser.onError = that.onError;
      parser.parse(file);

    };

    this.parse = function (input) {
      if (input instanceof File) {
        checkFileSignature(input, parseFile);
      }
      else if (typeof input === 'string') {
        parser = new PngParser();
        parser.onParsed = this.onParsed;
        parser.onError = this.onError;
        parser.parse(input);
      }
    };
    
    this.onParsed = function (headerDataUnits) {};

    this.onError = function (error) {
      console.error(error);
    };

  };

  return {
    'Parser': FitsParser,
    'mapPixels' : fitsPixelMapper.mapPixels
  };

});
define('libs/pixelCanvas/pixelCanvas.js',[],function () {
  

  var offScreenCanvas;
  var offScreenContext;
  var offScreenCanvasWidth;
  var offScreenCanvasHeight;

  var onScreenCanvas;
  var onScreenContext;
  var onScreenCanvasWidth;
  var onScreenCanvasHeight;

  var viewportPosition = { x : 0, y : 0 };
  var viewportWidth;
  var viewportHeight;

  var lastScrollPosition = {};
  var mouseDown = false;
  var zoomFactor = 1;

  var filters = {};
  var texture;

  var cursorToPixel = function(cursorX, cursorY){
    var viewportPixelX = cursorX / zoomFactor;
    var viewportPixelY = cursorY / zoomFactor;
    var xCoordinate = Math.floor(viewportPosition.x + viewportPixelX);
    var yCoordinate = Math.floor(viewportPosition.y + viewportPixelY);
    var raDec;
    var cursorInfo = {
      "x" : xCoordinate,
      "y" : yCoordinate,
      //"value" : pixelValues[xCoordinate + yCoordinate*offScreenCanvasHeight]
    };
    /*if (FITS.wcsMapper) {
      raDec = FITS.wcsMapper.pixelToCoordinate(xCoordinate, yCoordinate);
      cursorInfo.ra = raDec.ra;
      cursorInfo.dec = raDec.dec;
    }*/
    return cursorInfo;
  };

  var coordinateToCanvasPixel = function(x,y){
    var imageCoordinates = cursorToPixel(x, y);
    var viewportCoordinates = cursorToPixel(x, y);
  };

  var centerViewport = function(scaleFactor, zoomIn, cursorX, cursorY){
    var newPositionX;
    var newPositionY;
    var translationX = cursorX / scaleFactor;
    var translationY = cursorY / scaleFactor;
    var xOffset = zoomIn? translationX : - translationX / 2; 
    var yOffset = zoomIn? translationY : - translationY / 2; 
    newPositionX = viewportPosition.x + xOffset; 
    newPositionY = viewportPosition.y + yOffset; 
    if (newPositionX < 0 || newPositionY < 0) {
      return;
    }
    viewportPosition.x = newPositionX;
    viewportPosition.y = newPositionY;
  };

  var scaleViewport = function(zoomFactor){
    viewportWidth = onScreenCanvasWidth / zoomFactor;
    viewportHeight = onScreenCanvasHeight / zoomFactor;
  };

  var renderPixels = function (pixels, width, height, canvas) {
    var byteBuffer = new ArrayBuffer(pixels.length);
    var byteUIntBuffer = new Uint8Array(byteBuffer); 
    var pixelIndex = 0;
    while (pixelIndex < pixels.length) {
      byteUIntBuffer[pixelIndex] = pixels[pixelIndex];
      byteUIntBuffer[pixelIndex + 1] = pixels[pixelIndex + 1];
      byteUIntBuffer[pixelIndex + 2] = pixels[pixelIndex + 2];
      byteUIntBuffer[pixelIndex + 3] = pixels[pixelIndex + 3];
      pixelIndex += 4;
    } 
    texture = offScreenCanvas.texture(byteBuffer, width, height);
    canvas.draw(texture).update();
    //var context = canvas.getContext("2d");
    //var image = context.createImageData(canvas.getAttribute('width'), canvas.getAttribute('height'));
    //var pixelIndex = 0;
    //while (pixelIndex < pixels.length) {
    //  image.data[pixelIndex] = pixels[pixelIndex];
    //  image.data[pixelIndex + 1] = pixels[pixelIndex + 1];
    //  image.data[pixelIndex + 2] = pixels[pixelIndex + 2];
    //  image.data[pixelIndex + 3] = pixels[pixelIndex + 3];
    //  pixelIndex += 4;
    //}
    //context.clearRect(0, 0, canvas.getAttribute('width'), canvas.getAttribute('height'));
    //context.putImageData(image, 0, 0);
  };

  var draw = function() {
    scaleViewport(zoomFactor); 
    onScreenContext.clearRect(0, 0, onScreenCanvasWidth, onScreenCanvasHeight);
    onScreenContext.drawImage(offScreenCanvas, viewportPosition.x, viewportPosition.y, viewportWidth, viewportHeight, 0, 0, onScreenCanvasWidth, onScreenCanvasHeight);
  };

  var mouseMoved = function(event){
    var scrollVector;
    var mousePosition;
    if (mouseDown) {
      scrollVector = {};
      mousePosition = {};
      mousePosition.x = event.layerX || event.offsetX; 
      mousePosition.y = event.layerY || event.offsetY;
      scrollVector.x = lastScrollPosition.x - mousePosition.x; 
      scrollVector.y = lastScrollPosition.y - mousePosition.y;
      if (viewportPosition.x + scrollVector.x >= 0 && 
          viewportPosition.x + scrollVector.x + viewportWidth <= offScreenCanvasWidth ) {
            viewportPosition.x = viewportPosition.x + scrollVector.x / zoomFactor;
            lastScrollPosition.x = mousePosition.x;
      }
          
      if(viewportPosition.y + scrollVector.y >= 0 && 
         viewportPosition.y + scrollVector.y + viewportHeight <= offScreenCanvasHeight ) {
           viewportPosition.y = viewportPosition.y + scrollVector.y / zoomFactor;
           lastScrollPosition.y = mousePosition.y;
      }
      draw();
    }
    //onHoverPixelChanged(cursorToPixel(event.offsetX, event.offsetY));
    //highlightPixel(event.offsetX, event.offsetY);
  };
  
  var buttonPressed = function(event){
    mouseDown = true;
    lastScrollPosition.x = event.layerX || event.offsetX;
    lastScrollPosition.y = event.layerY || event.offsetY;
  };
  
  var buttonReleased = function(){
    mouseDown = false;
  };
  
  var mouseOut = function(){
    mouseDown = false;
  };

  var zoom = function(newZoomFactor, mouseX, mouseY){
    if (newZoomFactor >= 1 && newZoomFactor < zoomFactor || // Zoom out
        newZoomFactor > zoomFactor && viewportHeight >= 2 && viewportWidth >= 2) { // Zoom In
      viewportPosition = {x: 0, y: 0};
      centerViewport(newZoomFactor, newZoomFactor > zoomFactor, mouseX, mouseY);    
      zoomFactor = newZoomFactor; 
      //highlightPixel(event.offsetX, event.offsetY);
      draw();
    }
  };

  var doubleClick = function (event) {
    zoomIn(event.offsetX, event.offsetY);
  };

  var zoomIn = function(mouseX, mouseY) {
    zoom(zoomFactor*2, mouseX, mouseY);
  };
  
  var wheelMoved = function (event){
    var wheel = event.wheelDelta/120;//n or -n
    zoom(wheel > 0? zoomFactor*2 : zoomFactor/2, event.offsetX, event.offsetY);
  };
  
  var drawPixels = function (pixels, width, height, canvas) {   
    canvas.addEventListener('mousedown', buttonPressed, false);
    canvas.addEventListener('mouseup', buttonReleased, false);
    canvas.addEventListener('mousemove', mouseMoved, false);
    canvas.addEventListener('mouseout', mouseOut, false);
    canvas.addEventListener('mousewheel', wheelMoved, false);
    canvas.ondblclick = doubleClick;

    offScreenCanvas = fx.canvas(); // document.createElement('canvas');
    offScreenContext = offScreenCanvas.getContext('2d');
   
    offScreenCanvas.setAttribute('width', width);
    offScreenCanvas.setAttribute('height', height);
    offScreenCanvasWidth = width;
    offScreenCanvasHeight = height;

    onScreenCanvas = canvas;
    onScreenContext = onScreenCanvas.getContext('2d');
    viewportWidth = parseInt(onScreenCanvas.getAttribute('width'), 10);
    viewportHeight = parseInt(onScreenCanvas.getAttribute('height'), 10);
    viewportWidth = offScreenCanvasWidth >= viewportWidth? viewportWidth : offScreenCanvasWidth;
    viewportHeight = offScreenCanvasHeight >= viewportHeight? viewportHeight : offScreenCanvasHeight;
    onScreenCanvasWidth = viewportWidth;
    onScreenCanvasHeight = viewportHeight;

    onScreenCanvas.onselectstart = function () { return false; }; // ie 

    zoomFactor = 1;

    renderPixels(pixels, width, height, offScreenCanvas);
    draw();

  };
  
  var redrawPixels = function() {
  	draw();
  }

  filters.brightnessContrast = function(brightness, contrast){
    if(!offScreenCanvas) {
      return;
    }
    offScreenCanvas.draw(texture).brightnessContrast(brightness,contrast).update();
    draw();
  };

  return {  
    'drawPixels' : drawPixels,
    'redrawPixels' : redrawPixels,
    'cursorToPixel': cursorToPixel,
    'filters' : filters 
  };

});



define('fits',['./libs/fitsParser/src/fitsParser.js', './libs/pixelCanvas/pixelCanvas.js', '/wcs.js'], function (fitsParser, pixelCanvas) {
  

  var FitsParser = fitsParser.Parser;  
  var mapPixels = fitsParser.mapPixels;
  var wcs;
  var fitsImageWidth;
  var fitsImageHeight;
  
  var renderImage = function(file, canvas, success){
    var fitsParser = new FitsParser();
    
    fitsParser.onParsed = function(headerDataUnits){
      var HDUs = headerDataUnits;
      var pixels = mapPixels(HDUs[0].header, HDUs[0].data, 'RGBA', 'linear');
      var headerJSON = HDUs[0].header;
      wcs = new WCS.Mapper(headerJSON);
      
      var imageWidth = HDUs[0].header.NAXIS1;
      fitsImageWidth = imageWidth;
      var imageHeight = HDUs[0].header.NAXIS2;
      fitsImageHeight = imageHeight;
      var pixelsRGBA = [];
      for (var i = 0; i < pixels.length; ++i) {
        pixelsRGBA.push(pixels[i].red);
        pixelsRGBA.push(pixels[i].green);
        pixelsRGBA.push(pixels[i].blue);
        pixelsRGBA.push(pixels[i].alpha);
      }

      pixelCanvas.drawPixels(pixelsRGBA, imageWidth, imageHeight, canvas);
      console.log("File read!");
      if(success){
        success();
      }
    };

    fitsParser.parse(file);
  
  };
  
  var getImageDimensions = function() {
  	return {width: fitsImageWidth, height: fitsImageHeight};
  }
  
  var redrawImage = function() {
  	pixelCanvas.redrawPixels();
  }
  
  var wcs2pix = function(w1, w2) {
		var pix = wcs.coordinateToPixel(w1, w2);
		return {x: pix.x, y: fitsImageHeight-pix.y};
	}
		
	var pix2wcs = function(p1, p2) {
		var coord = wcs.pixelToCoordinate([p1, p2]);
		return {c1: coord.ra, c2: coord.dec};
	}

	var cursorToPix = function(x, y) {
		var info  = pixelCanvas.cursorToPixel(x,y);
		return {x: info.x, y: info.y};
	}

  return {
  	'getImageDimensions' : getImageDimensions,
    'renderImage' : renderImage,
    'redrawImage' : redrawImage,
    'filters' : pixelCanvas.filters,
    'cursorToPix': cursorToPix,
  	'wcs2pix' : wcs2pix,
  	'pix2wcs' : pix2wcs
  };
  
});
