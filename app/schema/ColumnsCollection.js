define(function(require, exports, module) {

  "use strict";

  var Backbone = require('backbone'),
      _ = require('underscore'),
      ColumnModel = require('./ColumnModel');

  var columnsOptions = ['table'];

  module.exports = Backbone.Collection.extend({

    model: ColumnModel,

    comparator: function(row) {
      return row.get('sort');
    },

    parse: function(result) {
      return result.data ? result.data : result;
    },

    getRelationalColumns: function() {
      return this.filter(function(column) {
        return column.hasRelated();
      });
    },

    getColumnsByType: function(type) {
      type = type.toLowerCase();
      return this.filter(function(column) {
        return column.get('type').toLowerCase() === type;
      });
    },

    save: function(attributes, options) {
      options = options || {};
      var collection = this;
      var success = options.success;

      options.success = function(model, resp, xhr) {
        collection.reset(model);
        if (success !== undefined) {
          success();
        }
      };

      return Backbone.sync('update', this, options);
    },

    constructor: function (models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      _.extend(this, _.pick(options, columnsOptions));
    }

  });

});
