define(function(require, exports, module) {

  'use strict';

  var Backbone = require('backbone'),
      app = require('app'),
      _ = require('underscore'),
      ColumnsCollection = require('./ColumnsCollection'),
      PreferenceModel = require('./../core/PreferenceModel');

  module.exports =  Backbone.Model.extend({

    parse: function (data) {
      data = data.data ? data.data : data;
      if (this.columns === undefined) {
        this.columns = new ColumnsCollection(data.columns, {
          parse: true,
          table: this,
          url: this.url + '/columns'
        });
      } else {
        this.columns.reset(data.columns, {parse: true});
      }

      if (data.preferences !== undefined) {
        if (this.preferences === undefined) {
          var preference = data.preferences;
          this.preferences = new PreferenceModel(data.preferences, {url: app.API_URL + 'tables/' + preference.table_name + '/preferences'})
        } else {
          this.preferences.set(data.preferences);
        }
      }

      data.status_column = data.status_column || app.statusMapping.status_name;
      data.primary_column = data.primary_column || 'id';
      data.sort_column = data.sort_column || 'id';

      return _.omit(data, ['columns', 'preferences']);
    },

    getStatusColumn: function () {
      var name = this.get('status_column') || app.statusMapping.status_name;

      return this.columns.get(name);
    },

    hasStatusColumn: function () {
      return this.getStatusColumn() != null;
    },

    getStatusColumnName: function () {
      var column = this.getStatusColumn();
      return column ? column.get('column_name') : null;
    },

    getSortColumn: function () {
      // set a default primary key, same as default sort and status
      var name = this.get('sort_column') || this.getPrimaryColumnName();

      return this.columns.get(name);
    },

    hasSortColumn: function () {
      return this.getSortColumn() != null;
    },

    getSortColumnName: function () {
      return this.getSortColumn().get('column_name');
    },

    getPrimaryColumn: function () {
      var name = this.get('primary_column') || 'id';

      return this.columns.get(name);
    },

    hasPrimaryColumn: function () {
      return this.getPrimaryColumn() != null;
    },

    getPrimaryColumnName: function () {
      return this.getPrimaryColumn().get('column_name');
    },

    toJSON: function (options) {
      var attrs = _.clone(this.attributes);

      attrs.columns = this.columns.toJSON();

      return attrs;
    }
  });
});
