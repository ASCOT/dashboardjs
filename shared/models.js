if (!UW) var UW={};

UW.AbstractModel = Backbone.Model.extend({
  
  addChildCollection: function(id, constructor){
    var newCollection = new constructor();
    this[id] = newCollection; 
    this[id].bind('publish', _(this.publishProxy).bind(this));
    this[id].bind('remove', _(this.publishRemove).bind(this));
    this[id].bind('add', _(this.publishAdd).bind(this));
    this[id].bind('move', _(this.publishMove).bind(this));
    newCollection.parent = this;
    return newCollection;
  },
  
  addChildModel: function (id, constructor) {
    this[id] = new constructor();
    this[id].bind('publish', _(this.publishProxy).bind(this));
    this[id].parent = this;
    return this[id];
  },
  
  export: function (opt) {
    var result = {},
      settings = _({
        recurse: true
      }).extend(opt || {});
    
    function process(targetObj, source) {
      targetObj.attrs = source.toJSON();
      _.each(source, function (value, key) {
        if (settings.recurse) {
          if (key !== 'collection' && source[key] instanceof Backbone.Collection) {
            targetObj.collections = targetObj.collections || {};
            targetObj.collections[key] = {};
            targetObj.collections[key].models = [];
            targetObj.collections[key].id = source[key].id || null;
            _.each(source[key].models, function (value, index) {
              process(targetObj.collections[key].models[index] = {}, value);
            });
          } else if (key !== 'parent' && source[key] instanceof Backbone.Model) {
            targetObj.models = targetObj.models || {};
            process(targetObj.models[key] = {}, value);
          }
        }
      });
    }
    process(result, this);
    return result;
  },
  
  import: function (data, silent) {
       function process(targetObj, data) {
         targetObj.set(data.attrs, {silent: silent});
         if (data.collections) {
           _.each(data.collections, function (collection, name) {
             targetObj[name].id = collection.id;
             _.each(collection.models, function (modelData, index) {
               var nextObject = targetObj[name].get(modelData.attrs.id) || targetObj[name]._add({}, {silent: silent});
               process(nextObject, modelData);
             });
           });
         }
       if (data.models) {
         _.each(data.models, function (modelData, name) {
          process(targetObj[name], modelData);
        });
      }
    }
    process(this, data);
    return this;
  },
  
  publishProxy: function (data) {
    this.trigger('publish', data);
  },

  publishChange: function (model) { 
    if (model instanceof Backbone.Model) {
      this.trigger('publish', {
      event: 'change',
      id: model.id,
      data: model.attributes
    });
    } else {
      console.error('event was not a model', e);
    }
  },
  
  publishAdd: function (model, collection) {
    this.trigger('publish', {
      event: 'add',
      data: "",
      collection: collection.id
    });
  },

  publishRemove: function (model, collection) {
    this.trigger('publish', {
      event: 'remove',
      id: model.id
    });
  },

  publishMove: function (collection, id, newPosition) {
    this.trigger('publish', {
      event: 'move',
      collection: collection.id,
      id: id, 
      newPosition: newPosition
    });
 }
  
});