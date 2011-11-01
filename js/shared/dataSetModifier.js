/**
 * It represents additional information added on top of dataSets
 * It could be annotations, transformations or additional information that affects 
 * how the dataSet is displayed
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
    
  UW.DataSetModifier = function(name, modifierJSON){
    this.initialize();
    if (modifierJSON) {
      this.values = modifierJSON.values || {};
      this.indices = modifierJSON.indices || {};
    }
  }
  
  _.extend(UW.DataSetModifier.prototype, Backbone.Events, {
    
    id: _.uniqueId('dsm'),
    
    initialize: function(name){
      this.name = name;
      this.values = {};
      this.indices = {};
    },
    
    getModifier: function(targetId){
      return this.values[targetId];
    },
    
    getTargetIndices: function(attribute){
      return this.indices[attribute];
    },
    
    getKeys: function(){
      return extractKeys(this.indices);
    },
        
    applyModifier: function(value, targetIds){
      if(!this.values[value]){
        this.values[value] = [];
        this.indices[value] = [];
      }
      if (_.isArray(targetIds)){
        for(var i = 0; i < targetIds.length; i++){
          this._applyModifierToTarget(value,targetIds[i]);
        }
      }
      else{
        this._applyModifierToTarget(value, targetIds);
      }
      this.trigger()
    },
    
    _applyModifierToTarget: function(value, targetId){
      var index = this.indices[value];
      var oldValue = this.values[targetId];
      var oldIndex = this.indices[oldValue];
      if(!this.values[value]){
        return;
      }
      if (oldValue != value && oldIndex){
        for(var i=0; i < oldIndex.length; ++i){
          if(oldIndex[i] == targetId){
            oldIndex.splice(i,1);
          }
        }
      }
      this.values[targetId] = value;
      index.push(targetId);
    },
    
    removeModifier: function(value, targetId){
      var indexEntry ;
      if(!this.values[targetId]){
        return;
      }
      indexEntry = this.indices(value);
      _.each(indexEntry, 
        function(entry, index, list) { 
            if(entry===targetId){
              list.splice(index,1);
            }});
      delete this.values[targetId];
    }
    
  });

})();
 