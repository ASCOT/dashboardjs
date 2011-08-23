/**
 * Ascot internal abstract data model
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
    
  UW.DataSetModel = function(){
    this.initialize();
  }
  
  _.extend(UW.DataSetModel.prototype, Backbone.Events, {
    
    id: _.uniqueId('ds'),
    
    initialize: function(){
      this.records = [];
      this.columns = {};
      this.visible = true;
      this.indices = {};
    },
    
    addRecords: function(records, silent){
      if (_.isArray(records)) {
        for (var i = 0, l = records.length; i < l; i++) {
          this.addRecord(records[i], {silent: true});
         }
      }
      else{
          this.addRecord(records, {silent: true});
      }
      if(!silent){
        this.trigger('publish');
      }
    },
    
    addRecord: function(record){
      this._addColumns(record);
      record.metaData = {};
      record.metaData.visible = true;
      record.metaData.name = "";
      record.id = this.records.length;
      return this.records.push(record);
    },
    
    getRecord: function(id){
      return this.records[id];
    },
    
    getRecordMetaData: function(id){
      return this.records[id].metaData;
    },
    
    setRecords: function(attributes, ids){
      if(!ids){
        this.setAllRecords(attributes);
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
      this.trigger('publish', { event: 'dataSetChanged', id: this.id });
    },
    
    setRecordsMetaData: function(attributes, ids, silent){
      if(!ids){
        this.setAllRecords(attributes);
      }
      else{
        if (_.isArray(ids)) {
          for (var i = 0, l = ids.length; i < l; i++) {
            this.setRecordMetaData(attributes, ids[i]);
          }
        }
        else{
          this.setRecordMetaData(attributes, ids);
        }
      }
      if(!silent){
        this.trigger('publish', { event: 'changedMetaData', id: this.id});
      }
    },
    
    setRecordMetaData: function(attributes, id){
      if (!attributes) return this;
      
      var metaDataRecord = this.getRecord(id).metaData;
      for (var attr in attributes) {
        var newValue = attributes[attr];
        var oldValue = metaDataRecord[attr];
        if (!_.isEqual(newValue, oldValue)) {
          metaDataRecord[attr] = newValue;
          if(oldValue){
            this.removeFromIndex(attr, oldValue, id);
          }
          this.addToIndex(attr, newValue, id);      
        }
      }
    },
    
    setRecord: function(attributes, id){
      if (!attributes) return this;
      
      var record = this.getRecord(id);
      for (var attr in attributes) {
        var newValue = attributes[attr];
        var oldValue = record[attr];
        if (!_.isEqual(newValue, oldValue)) {
          var newObj = {};
          newObj[attr] = newValue;
          record = newObj;
          if(oldValue){
            this.removeFromIndex(attr, oldValue, id);
          }
          this.addToIndex(attr, newValue, id);      
        }
      }
      
    },
    
    createIndex: function(id){
      this.indices[id] = {};
      return this.indices[id];
    },
    
    getIndex: function(id){
      return this.indices[id];
    },
    
    addToIndex: function(indexId, valueId, recordsIds){
      var index = this.getIndex(indexId) || this.createIndex(indexId);
      var indexEntry = index[valueId] = index[valueId] || [];
      if (_.isArray(recordsIds)) {
        for (var i = 0, l = recordsIds.length; i < l; i++) {
          indexEntry.push(recordsIds[i]);
        }
      }
      else{
          indexEntry.push(recordsIds);
      }      
    },
    
    removeFromIndex: function(indexId, valueId, recordsIds){
      var index = this.getIndex(indexId);
      if(!index)
        return this;
      var indexEntry = index[valueId];
      if(!indexEntry)
        return this;
      
      if (_.isArray(recordsIds)) {
          for (var i = 0, l = recordsIds.length; i < l; i++) {
            this._removeFromIndexEntry(indexId, valueId, recordsIds[i]);
          }
        }
        else{
          this._removeFromIndexEntry(indexId, valueId, recordsIds);
        }
    },
    
    _removeFromIndexEntry: function(indexId, valueId, recordId){
      var indexEntry = this.getIndex(indexId)[valueId];
      _.each(indexEntry, function(entry, index, list) { 
                          if(entry===recordId){
                            list.splice(index,index+1);
                          }
                        });
    },
    
    getIndexKeys: function(indexId){
      return extractKeys(this.getIndex(indexId));
    },
    
    getIndexEntries: function(indexId, valueId){
      return this.getIndex(indexId)[valueId];
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
    
    getRecords: function(){
      return this.records;
    },
    
    getRecordsJSON: function(){
      return this.records;
    },
    
    isVisible: function(){
      return this.visible;
    },
    
    setVisible: function(visible){
      this.visible = visible;
      this.trigger('publish', { event: 'changedMetaData', id: this.id});
    },
    
    change: function(){
      this.trigger('publish', { event: 'dataSetChanged', id: this.id });
    }
    
  });

})();