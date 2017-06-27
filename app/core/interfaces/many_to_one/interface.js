/* global $ */
define([
  'backbone',
  'underscore',
  'handlebars',
  'core/UIView',
  'core/t'
], function (Backbone, _, Handlebars, UIView, __t) {
  'use strict';

  return UIView.extend({

    template: 'many_to_one/input',

    events: {
      'change select': function (event) {
        var model = this.model.get(this.name);
        var $target = $(event.currentTarget);
        var selectedId = parseInt($target.find(':selected').val(), 10);
        var attributes = this.collection.get(selectedId).toJSON();
        var primaryColumn = this.columnSchema.table.get('primary_column') || 'id';
        var attributesName;

        // TODO: Set proper model based on table name
        // ex: GroupsModel for directus_groups
        if (!(model instanceof Backbone.Model)) {
          model = new Backbone.Model();
          model.set(primaryColumn, selectedId);
        }

        attributesName = _.keys(model.attributes);
        model.clear();

        if (attributesName.length > 0) {
          attributes = _.pick(attributes, attributesName);
        }

        model.set(attributes);

        this.model.set(this.name, model);
      }
    },

    serialize: function () {
      var optionTemplate = Handlebars.compile(this.options.settings.get('visible_column_template'));

      if (this.options.settings.get('readonly') === true) {
        this.canEdit = false;
      }

      var data = this.collection.map(function (model) {
        var data = model.toJSON();

        var name = optionTemplate(data);
        return {
          id: model.id,
          name: name,
          selected: this.options.value !== undefined && (model.id === this.options.value.id)
        };
      }, this);

      // Default data while syncing (to avoid flickr when data is loaded)
      if (this.options.value !== undefined && this.options.value.id && data.length === 0) {
        data = [{
          id: this.options.value.id,
          name: this.options.value,
          selected: true
        }];
      }

      data = _.sortBy(data, 'name');

      // Set the first value to the column when the record is new
      // This prevent assigning the incorrect (null/empty) value to the column
      if (data.length > 0 && !this.options.settings.get('allow_null') && this.model.isNew()) {
        this.model.set(this.name, _.first(data).id);
      }

      return {
        name: this.options.name,
        data: data,
        handleBarString: this.options.settings.get('value_template'),
        comment: this.options.schema.get('comment'),
        use_radio_buttons: this.options.settings.get('use_radio_buttons') === true,
        allowNull: this.options.settings.get('allow_null') === true,
        placeholder: (this.options.settings.get('placeholder')) ? this.options.settings.get('placeholder') : __t('select_from_below'),
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite
      };
    },

    initialize: function () {
      // TODO display warning on UI & gracefully fail if the next value is undefined
      if (!this.columnSchema.relationship) {
        console.error(__t('column_misconfigured_in_directus_columns', {
          column: this.name
        }));
      }

      var value = this.model.get(this.name);
      value.startTracking();

      this.canEdit = this.model.canEdit(this.name);
      this.collection = value.collection.getNewInstance({omit: ['preferences']});

      var status = 1;
      if (this.options.settings.get('visible_status_ids')) {
        status = this.options.settings.get('visible_status_ids');
      }

      var data = {};
      if (value.table.hasStatusColumn()) {
        data[value.table.getStatusColumnName()] = status;
      }

      var visibleColumns = [];
      if (this.options.settings.get('visible_column')) {
        visibleColumns = this.options.settings.get('visible_column').split(',');
      }

      if (value.table.hasPrimaryColumn() && visibleColumns.indexOf(value.table.getPrimaryColumnName()) < 0) {
        visibleColumns.push(value.table.getPrimaryColumnName());
      }

      data.columns_visible = visibleColumns.join(',');

      // FILTER HERE!
      this.collection.fetch({includeFilters: false, data: data});
      // This.collection.on('reset', this.render, this);
      this.collection.on('sync', this.render, this);
    }
  });
});
