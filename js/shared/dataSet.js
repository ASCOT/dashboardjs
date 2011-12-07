/**
 * Ascot data set representation
 * @author Diego Marcos (dmarcos@uw.edu)
 */

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
      this.records = [];
      this.columns = {};
      this.visible = true;
      this.indices = {};
      this.modifiers = {};
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

    applyModifiers: function(modifiersJSON, silent){
      for (var attribute in modifiersJSON) {
        if (modifiersJSON.hasOwnProperty(attribute)) {
          this.applyModifier(attribute, modifiersJSON[attribute]);
        }
      }
      if(!silent){
        this.trigger('changed');
      }
    },

    applyModifier : function(attribute, modifierJSON){
      var newModifier = new UW.DataSetModifier(attribute, modifierJSON);
      this.modifiers[attribute] = newModifier;
    },
    
    setAllRecords: function(attributes, silent){
      if(!attributes){
        return;
      }
      var modifiers = {};
      for(var i=0; i < this.records.length; ++i){
        this.setRecords(attributes, i, true);
      }
      if(!silent){
        for (var currentAttribute in attributes) {
          modifiers[currentAttribute] = this.modifiers[currentAttribute];
        }
        this.trigger('changed', { "event": 'dataSetChanged', "id" : this.id, "modifiers" : modifiers });
      }
    },
    
    getAttributeValues: function(attribute){
      var modifier = this.modifiers[attribute];
      if(!modifier){
        return [];
      }
      else{
        return modifier.getKeys();
      }
    },
    
    getRecordsIndicesWithAttribute: function(attribute, value){
      var modifier = this.modifiers[attribute];
       if(!modifier){
          return [];
        }
        else{
          return modifier.getTargetIndices(value);
        }
    },
    
    setRecords: function(attributes, ids, silent){
      var modifiers = [];

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
            this.modifiers[currentAttribute].name = currentAttribute
            modifiers.push(this.modifiers[currentAttribute]);
          }
        }
        this.trigger('changed', { "event": 'dataSetChanged', "id" : this.id, "modifiers" : JSON.parse(JSON.stringify(modifiers)) });
      }
    },
  
    setRecord: function (attributes, id) {
      var record = this.getRecord(id);
      var modifier;
      var newValue;
      var oldValue;
      
      if (!attributes || !record) return this;
      
      for (var attr in attributes) {
        newValue = attributes[attr];
        if (!this.modifiers[attr]) {
          this.modifiers[attr] = new UW.DataSetModifier(attr);
        }
        oldValue = this.modifiers[attr].getModifier(id) || record[attr];
        if (!_.isEqual(newValue, oldValue)) {
           this.modifiers[attr].applyModifier(newValue, id);      
        }
      }
      
    },
    
    length: function(){
      return this.records.length; 
    },
    
    getId: function(){
      return this.id;
    },

    getModifiers: function(){
      return this.modifiers;
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
      var record = _.extend({}, this.records[id]);
      var recordModifier;
      for(var attribute in this.modifiers){
        recordModifier = this.modifiers[attribute].getModifier(id);
        if(recordModifier != undefined){
          record[attribute] = recordModifier;
        }
      }
      return record;
    },
    
    getRecordsJSON: function(){
      return this.records;
    },
    
    isVisible: function(){
      return this.visible;
    },

    setVisible: function(visible){
      this.visible = visible;
      this.trigger('changed', { event: 'dataSetChaned', id: this.id});
    },
    
    change: function(){
      this.trigger('changed', { event: 'dataSetChanged', id: this.id });
    }
    
  });

})();