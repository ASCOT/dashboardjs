//     Date: 8/11
//     Author: Diego Marcos (diego.marcos@gmail.com)
//
//     Dataset
// ----------
//     Represents an ASCOT dataset. Provides routines to create, delete and
//		 modify data sets.

if (!UW) var UW={};

(function(){

  var server = false;
  var Backbone;
  var _;
  var uuid;

  if (typeof exports !== 'undefined') {
    Backbone = require('backbone');
    _ = require('underscore')._;
    uuid = require('node-uuid');
    server = true;
  } else {
    Backbone = this.Backbone;
    _ = this._;
  }
    
  UW.DataSet = function(dataSetJSON){
    this.initialize(dataSetJSON);
  }
  
  _.extend(UW.DataSet.prototype, Backbone.Events, {
    
    id: _.uniqueId('ds'),
    
    initialize: function(dataSetJSON){
			this.initalized = false;
      this.records = [];
      this.columns = {};
      this.visible = true;
      this.indices = {};
      if (dataSetJSON) {
        this.name = dataSetJSON.name;
        this.id = dataSetJSON.id;
        if (dataSetJSON.records) {
          this.addRecords(dataSetJSON.records, true);
        } 
        if (dataSetJSON.modifiers) {
          this.applyModifiers(dataSetJSON.modifiers, true)
        } 
        if (!dataSetJSON.modifiers || !dataSetJSON.modifiers.color) {
          this.setAllRecords({'color' : 'grey'}, true);
          this.setAllRecords({'visible' : true});
        }
      }
      
			this.initalized = true;
    },
    
    addRecords : function(records, silent){
      if (_.isArray(records)) {
        for (var i = 0, l = records.length; i < l; i++) {
          this.addRecord(records[i], {silent: true});
         }
      }
      else{
          this.addRecord(records, {silent: true});
      }
      if(!silent){
        this.trigger('changed');
      }
    },
    
    addRecord : function(record){
      this._addColumns(record);
      record.id = this.records.length;
      return this.records.push(record);
    },

    applyModifiers: function(modifiers, silent){
      var current;
      if (modifiers.length > 0) {
        for (var i = modifiers.length-1; i >= 0; --i) {
          this.applyModifier(modifiers[i]);
        }
	this.cleanModifiers();
        if (!silent) {
          this.trigger('changed');
        }
      }
    },
    // Remove any modifier fields that contain no points
    cleanModifiers: function() {
       for (i in this.indices) {
           for (j in this.indices[i]) {
               if (this.indices[i][j].length == 0) delete this.indices[i][j];
           }
       } 
    },
    applyModifier : function(modifier){
      var field = modifier.field;
      var attribute = {};
      if (field) {
        for (var value in modifier) {
          if (value === "field") {
            continue;
          }
          attribute[field] = value;
          this.setRecords(attribute, modifier[value], true);
        } 
      }
    },

    setAllRecords: function(attributes, silent){
      var modifiers = [];
      if(!attributes){
        return;
      }
      for(var i=0; i < this.records.length; ++i){
        modifiers = this.setRecords(attributes, i, true);
      }
      if(!silent){
        this.trigger('changed', { "event": 'dataSetChanged', "id" : this.id, "modifiers" : modifiers });
      }
    },
    
    getAttributeValues: function(attribute){
      var index = this.indices[attribute];
      var values = [];
      if(index){
        for(var value in index) {
          values.push(value);
        }  
      }
      return values;
    },
    
    getRecordsIndicesWithAttribute: function(attribute, value){
      var index = this.indices[attribute];
      var recordsIndices = [];
      if(index && index[value]){
        for(var i = 0; i < index[value].length; ++i) {
          recordsIndices.push(index[value][i]); 
        }
      }
      return recordsIndices;
    },
    
    setRecords: function(attributes, ids, silent){
      var modifiers = [];
      var modifier;

      if(ids === undefined){
        return;
      }
      else{
        if (_.isArray(ids)) {
          for (var i = 0, l = ids.length; i < l; i++) {
            this.setRecord(attributes, ids[i]);
          }
        }
        else{
          this.setRecord(attributes, ids);
        }
      }

      if (!silent) {
        for (var currentAttribute in attributes) {
          if (attributes.hasOwnProperty(currentAttribute)) {
            modifier = _.extend({}, this.indices[currentAttribute]);
            modifier.field = currentAttribute;
            modifiers.push(modifier);
          }
        }
        this.trigger('changed', { "event": 'dataSetChanged', "id" : this.id, "modifiers" : modifiers });
      }

      return modifiers;
      
    },
  
    setRecord: function (attributes, id) {
      var record = this.records[id];
      var oldValue;
      var newValue;
      var index;

      if (!attributes || !record) return this;
      
      for (var attr in attributes) {
        oldValue = record[attr];
        newValue = attributes[attr];
        record[attr] = attributes[attr];
        
        // Update index

        // Add new value
        index = this.indices[attr] = this.indices[attr] || {};
        index[newValue] = index[newValue] || [];
        index[newValue].push(id);

        // Remove old value from index
        if (oldValue && this.initalized) {
          for (var i = 0; i < index[oldValue].length; ++i) {
            if (index[oldValue][i] === id){
              index[oldValue].splice(i,1);
              break;
            }
          }
        }

      }
    },
    
    length: function(){
      return this.records.length; 
    },
    
    getId: function(){
      return this.id;
    },

    getColumns: function(){
      return extractKeys(this.columns);
    },
    
    _addColumns: function(columns){
      for (var value in columns) {
        this.columns[value] = value;
      }
    },
    
    getRecord: function(id){
      return _.extend({}, this.records[id]);
    },
    
    getRecordsJSON: function(){
      return this.records;
    },
    
    isVisible: function(){
      return this.visible;
    },

    setVisible: function(visible){
      this.visible = visible;
      this.trigger('changed', { event: 'dataSetChanged', id: this.id});
    },
    
    change: function(){
      this.trigger('changed', { event: 'dataSetChanged', id: this.id });
    }
    
  });

})();
