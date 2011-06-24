/**
 * @fileoverview dataset.js defines a Dataset, which abstracts a table of values with rows and columns.
 * The implementation uses a JavaScript database called TaffyDB.
 * @version 0.1
 *  Date: 7/10
 * @author Ian Smith (imsmith@uw.edu)
 */

// Create the UW.astro namspace
if (!UW) var UW={};
if (!UW.astro) UW.astro={};

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
  
  // Represents the gadget state
  UW.DataRecordModel = UW.AbstractModel.extend({
     initialize: function () {
        this.addChildModel('metaData', UW.AstroMetaData);
     }
  });
  
  UW.DataRecordCollection = Backbone.Collection.extend({
    model: UW.DataRecordModel,
  });
  
  UW.DataSetModel = UW.AbstractModel.extend({
    initialize: function () {
      this.addChildCollection('records', UW.DataRecordCollection);
      this.set({columns: {}});
      this.set({indices: {}});
      this.set({visible: true});
    },
    
    addRecords: function(records){
      if (_.isArray(records)) {
        for (var i = 0, l = records.length; i < l; i++) {
          this.addRecord(records[i], {silent: true});
         }
      }
      else{
          this.addRecord(records, {silent: true});
      }
      this.change();   
    },
    
    addRecord: function(record, options){
      this._addColumns(record);
      record.metaVisible = true;
      record.id = this.records.length;
      return this.records.add(record, options);
    },
    
    getRecord: function(id){
      return this.records.get(id);
    },
    
    getRecordMetaData: function(id){
      return this.records.get(id).metaData;
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
    },
    
    setRecordsMetaData: function(attributes, ids){
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
    },
    
    setRecordMetaData: function(attributes, id){
      if (!attributes) return this;
      
      var metaDataRecord = this.getRecord(id).metaData;
      for (var attr in attributes) {
        var newValue = attributes[attr];
        var oldValue = metaDataRecord.get(attr);
        if (!_.isEqual(newValue, oldValue)) {
          var newObj = {};
          newObj[attr] = newValue;
          metaDataRecord.set(newObj);
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
        var oldValue = record.get(attr);
        if (!_.isEqual(newValue, oldValue)) {
          var newObj = {};
          newObj[attr] = newValue;
          record.set(newObj);
          if(oldValue){
            this.removeFromIndex(attr, oldValue, id);
          }
          this.addToIndex(attr, newValue, id);      
        }
      }
      
    },
    
    createIndex: function(id){
      this.get('indices')[id] = {};
    },
    
    getIndex: function(id){
      return this.get('indices')[id];
    },
    
    addToIndex: function(indexId, valueId, recordsIds){
      var index = this.get('indices')[indexId] = this.get('indices')[indexId] || {};
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
      var index = this.get('indices')[indexId];
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
      var indexEntry = this.get('indices')[indexId][valueId];
      _.each(indexEntry, function(entry, index, list) { 
                          if(entry===recordId){
                            list.splice(index,index+1);
                          }
                        });
    },
    
    getIndexKeys: function(id){
      return extractKeys(this.get('indices')[id]);
    },
    
    getIndexEntries: function(indexId, valueId){
      return this.get('indices')[indexId][valueId];
    },
    
    length: function(){
      return this.records.length; 
    },
    
    getId: function(){
      return this.get('id');
    },
    
    getColumns: function(){
      return extractKeys(this.get('columns'));
    },
    
    getNonDBColumns: function(){
      var columns = this.getColumns();
      for (var i=columns.length -1; i>=0; i--) {
        if (columns[i].indexOf('meta') === 0) {
          columns.splice(i,1);
        }
      }
      return columns;
    },
    
    _addColumns: function(columns){
      var currentColumns = this.get('columns');
      for (var value in columns) {
        currentColumns[value] = value;
      }
    },
    
    getRecords: function(){
      return this.records.models;
    },
    
    getRecordsJSON: function(){
        var recordsJSON = [];
        for(var i = 0; i < this.records.length; ++i){
          recordsJSON.push(this.records.models[i].toJSON());
        }
        return recordsJSON;
    },
    
    isVisible: function(){
      return this.get('visible');
    },
    
    setVisible: function(visible){
      this.set({'visible': visible});
    },
    
    select: function(callback){   
    },
    
    findByAttribute: function(attribute, value){    
    },
    
    findAllByAttribute: function(attribute, value){     
    },
    
    each: function(callback){    
    },
    
  });
  
  // The dashboard contains a collection of data sets
  UW.DataSetsCollection =  Backbone.Collection.extend({  
    model: UW.DataSetModel
  });
  
  UW.DataModel = UW.AbstractModel.extend({
    initialize: function () {
      this.addChildCollection('dataSets', UW.DataSetsCollection);
    }
  });

// SelectedSet
//HELPER
function arrayContains(arr, el) {
	for (var i=0, len=arr.length; i<len; i++) {
    	if (arr[i] === el) {
        	return true;
    	}
    }
    return false;
}

})();