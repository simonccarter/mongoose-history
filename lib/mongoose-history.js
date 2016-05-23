"use strict";

var mongoose = require('mongoose')
  , hm = require('./history-model');

module.exports = function historyPlugin(schema, options) {
  var customCollectionName  = options && options.customCollectionName;
  var collectionName;

  schema.on("init", function(model) {
    collectionName = model.modelName + 's';  
  });
  
  // Clear all history collection from Schema
  schema.statics.historyModel = function() {
    return hm.HistoryModel(hm.historyCollectionName(collectionName, customCollectionName), options);
  };
  
  // Clear all history documents from history collection
  schema.statics.clearHistory = function(callback) {
    var History = hm.HistoryModel(hm.historyCollectionName(collectionName, customCollectionName), options);
    History.remove({}, function(err) {
      callback(err);
    });
  };
  
  schema.pre('save', function(next) {
    var d = this.toObject();
    var op = this.isNew ? 'i' : 'u';
    createHistory(op, d, next);
  });

  schema.pre('remove', function(next) {
    var d = this.toObject();    
    createHistory('r', d, next);
  });

  schema.post('findOneAndUpdate', function(data, next) {
    var d = data.toObject();    
    createHistory('u', d, next);
  });

  schema.post('findOneAndRemove', function(data, next) {
    var d = data.toObject();      
    createHistory('r', d, next);
  });

  function createHistory(op, d, next){
    d.__v = undefined;
    var historyDoc = {};
    historyDoc['t'] = new Date();
    historyDoc['o'] = op;
    historyDoc['d'] = d;
    
    var history = new hm.HistoryModel(hm.historyCollectionName(collectionName, customCollectionName), options)(historyDoc);    
    history.save(next);
  }
};

