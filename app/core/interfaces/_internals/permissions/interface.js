//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/* jshint multistr: true */

define([
  'app',
  'underscore',
  'core/UIComponent',
  'core/UIView',
  'core/table/table.view',
  'core/overlays/overlays',
  'core/interfaces/_internals/permissions/table',
  'core/t'
], function (app, _, UIComponent, UIView, TableView, Overlays, PermissionsTableView, __t) {
  'use strict';

  var Input = UIView.extend({

    template: '_internals/permissions/interface',

    events: {
      'click .js-toggle-directus-tables': 'onToggleTables'
    },

    onToggleTables: function () {
      this.showCoreTables = this.nestedTableView.toggleTables();
    },

    serialize: function () {
      return {
        isAdmin: this.model.id === 1,
        title: this.name,
        tableTitle: this.relatedCollection.table.get('table_name'),
        canEdit: this.canEdit,
        showChooseButton: this.showChooseButton, // && this.canEdit,
        showAddButton: this.showAddButton && this.canEdit
      };
    },

    afterRender: function () {
      if (this.model.id !== 1) {
        this.setView('.table-container', this.nestedTableView).render();
      }
    },

    initialize: function (options) {
      // Make sure that the relationship type is correct
      if (!this.columnSchema.relationship ||
        this.columnSchema.relationship.get('type') !== 'ONETOMANY') {
        throw __t('m2m_the_column_need_to_have_m2m_relationship', {
          column: this.columnSchema.id,
          type: 'ONETOMANY',
          ui: Component.id
        });
      }

      this.canEdit = !(options.inModal || false);
      this.relatedCollection = this.model.get(this.name);
      this.nestedTableView = new PermissionsTableView({
        model: this.model,
        collection: this.relatedCollection
      });
    }
  });

  var Component = UIComponent.extend({
    id: 'directus_permissions',
    dataTypes: ['ONETOMANY'],
    variables: [
      {id: 'visible_columns', type: 'String', ui: 'textinput', char_length: 255, required: true},
      {id: 'result_limit', type: 'Number', ui: 'numeric', char_length: 10, default_value: 100, comment: __t('o2m_result_limit_comment')},
      {id: 'add_button', type: 'Boolean', ui: 'checkbox'},
      {id: 'choose_button', type: 'Boolean', ui: 'checkbox', default_value: true},
      {id: 'remove_button', type: 'Boolean', ui: 'checkbox'},
      {id: 'only_unassigned', type: 'Boolean', ui: 'checkbox', default_value: false}
    ],
    Input: Input,
    validate: function (collection, options) {
      if (options.schema.isRequired() && collection.length === 0) {
        return __t('this_field_is_required');
      }
    },
    list: function () {
      return 'x';
    }
  });

  return Component;
});
