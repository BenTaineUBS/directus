define([
  'app',
  'helpers/schema',
  'core/UIView',
  'core/notification',
  'core/doubleConfirmation',
  'schema/ColumnsCollection',
  'sortable',
  'core/t'
], function (app, SchemaHelper, UIView, Notification, DoubleConfirmation, ColumnsCollection, Sortable, __t) {
  'use strict';

  return UIView.extend({

    template: '_internals/columns/interface',

    events: {
      'click .js-row': 'editRow',
      'click .js-cell': 'editCell',
      'click .js-remove': 'verifyDestroyColumn',
      'click .js-button-add': 'addRow',
      'click .js-required': 'toggleRequired',
      'click .js-visible': 'toggleVisibility'
    },

    editCell: function (event) {
      event.stopPropagation();

      var $cell = $(event.currentTarget);
      var id = $cell.closest('.js-row').data('id');
      var viewName = $cell.data('section');
      var focusTo = $cell.data('field');
      var scrollTo = $cell.data('sub-section');

      if (scrollTo) {
        scrollTo = '#' + scrollTo;
      }

      if (!$cell.hasClass('js-cell-disable')) {
        this.editRow(id, viewName, focusTo, scrollTo);
      }
    },

    editRow: function (id, viewName, focusTo, scrollTo) {
      if (!this.canEdit) {
        return;
      }

      if (id.currentTarget) {
        id = $(id.currentTarget).data('id');
      }

      var table = app.schemaManager.getTable(this.model.id);
      var collection = table.columns;
      var columnModel = collection.get(id, true);

      if (!columnModel) {
        Notification.warning(__t('column_x_not_found', {
          column_name: id
        }));
        return;
      }

      var EditColumnView = require('modules/settings/views/EditColumnView');
      var optionsModel = columnModel.options;
      optionsModel.set({id: columnModel.get('ui')});

      var schema = app.schemaManager.getColumns('ui', optionsModel.id);
      optionsModel.structure = schema;

      switch (viewName) {
        case 'column':
          viewName = EditColumnView.VIEW_COLUMN;
          break;
        default:
        case 'interface':
          viewName = EditColumnView.VIEW_INTERFACE;
          break;
      }

      var view = new EditColumnView({
        model: optionsModel,
        schema: schema,
        currentView: viewName || EditColumnView.VIEW_INTERFACE,
        scrollTo: scrollTo,
        focusTo: focusTo
      });

      this.listenTo(columnModel, 'sync', this.onColumnChange);

      app.router.openViewInModal(view);
    },

    addRow: function () {
      var ColumnModalView = require('modules/settings/views/ColumnModalView');
      var ColumnModel = require('schema/ColumnModel');
      var collection = app.schemaManager.getColumns('tables', this.model.id);
      var model = new ColumnModel({data_type: 'ALIAS', ui: {}}, {collection: collection, table: collection.table});
      var view = new ColumnModalView({
        model: model,
        collection: collection
      });

      this.listenTo(model, 'sync', this.onColumnChange);

      app.router.openViewInModal(view);
    },

    // When the column change or a new column is added into a table
    onColumnChange: function (model, resp) {
      var columnsCollection = app.schemaManager.getColumns('tables', this.model.id);

      // Add new column to the table collection (interface)
      this.columns.add(resp, {parse: true, merge: true});
      // Add the new column into the table columns schema
      columnsCollection.add(model, {parse: true, merge: true});
    },

    destroyColumn: function (columnName) {
      var collection = app.schemaManager.getColumns('tables', this.model.id);
      var columns = this.model.get(this.name);
      var originalColumnModel = collection.get(columnName);

      if (!originalColumnModel) {
        return;
      }

      var columnModel = originalColumnModel.clone();
      // Url can be a function or a string
      // getting the result directly from the original model will prevent issue calling the function
      // calling the url() on the cloned model will throw an error because it doesn't have a collection object
      columnModel.url = _.result(originalColumnModel, 'url');

      if (!columnModel) {
        Notification.error('Error', 'Column ' + columnName + ' not found.');
        return;
      }

      var self = this;
      var onSuccess = function (model, response) {
        if (!response.success) {
          Notification.error('Column not removed', response.message);
        } else {
          self.collection.remove(originalColumnModel);
          collection.remove(originalColumnModel);
          columns.remove(originalColumnModel);
          self.$el.find('[data-id=' + model.get('id') + ']').remove();
          Notification.success('Column removed', '<b>' + columnName + '</b> was removed.');
        }
      };

      var onError = function (model, resp, options) {
        Notification.error('Column not removed', resp.responseJSON.message);
      };

      columnModel.destroy({success: onSuccess, error: onError, wait: true});
    },

    verifyDestroyColumn: function (event) {
      event.stopPropagation();

      var self = this;
      var columnName = $(event.target).closest('tr').attr('data-id');
      var destroyColumn = function () {
        self.destroyColumn(columnName);
      };

      DoubleConfirmation({
        value: columnName,
        emptyValueMessage: __t('invalid_column'),

        firstQuestion: __t('question_delete_this_column'),
        secondQuestion: __t('question_delete_this_column_confirm', {column_name: columnName}),
        notMatchMessage: __t('column_name_did_not_match'),
        callback: destroyColumn
      }, this);
    },

    toggleAttr: function (id, attr) {
      var column = this.columns.get(id);
      var options, attrs, originalUrl;

      if (column) {
        attrs = {};
        attrs[attr] = !column.get(attr);
        options = {patch: true};

        // Hotfix:
        originalUrl = column.url;
        column.url = function () {
          return app.API_URL + 'tables/' + column.get('table_name') + '/columns/' + column.get('column_name');
        };

        var self = this;
        options.success = function () {
          column.url = originalUrl;
          self.render();

          var message = __t('column_x_' + attr + '_has_changed', {
            column_name: column.get('column_name')
          });

          Notification.success(__t('saved'), message, {timeout: 3000});
        };

        return column.save(attrs, options);
      }
    },

    // @TODO: Create Base model with an toggle method for boolean values
    // model.toggle('required');
    toggleRequired: function (event) {
      event.stopPropagation();

      var $row = $(event.currentTarget).closest('tr');

      this.toggleAttr($row.data('id'), 'required');
    },

    toggleVisibility: function (event) {
      event.stopPropagation();

      var $row = $(event.currentTarget).closest('tr');

      this.toggleAttr($row.data('id'), 'hidden_input');
    },

    serialize: function () {
      var hasPrimaryKey = false;
      var hasPrimaryKeyInterface = false;
      var missingPrimaryKey = false;
      var missingPrimaryKeyMessage = '';
      var columns = this.columns.map(function (column) {
        var data = column.toJSON();

        // TODO: fallback primary key to primary key interface
        if (column.get('key') === 'PRI') {
          hasPrimaryKey = true;
        }

        if (column.get('ui') === 'primary_key') {
          hasPrimaryKeyInterface = true;
        }

        data.emptyComment = false;
        if (!data.comment) {
          if (SchemaHelper.isSystem(data.ui)) {
            data.comment = SchemaHelper.getSystemDefaultComment(data.ui);
          } else {
            data.comment = __t('add_comment');
          }

          data.emptyComment = true;
        }

        data.nullOrEmptyValue = false;
        if (data.default_value === null) {
          data.default_value = 'NULL';
          data.nullOrEmptyValue = true;
        } else if (data.default_value === '') {
          // FIXME: Add translations
          data.default_value = 'Empty String';
          data.nullOrEmptyValue = true;
        }

        data.isMissingRequiredOptions = SchemaHelper.isMissingRequiredOptions(column);

        return data;
      });

      missingPrimaryKey = !hasPrimaryKey || !hasPrimaryKeyInterface;
      if (missingPrimaryKey) {
        var key = 'warning_missing_primary_key';
        if (!hasPrimaryKeyInterface) {
          key += '_interface';
        }

        missingPrimaryKeyMessage = __t(key);
      }

      return {
        columns: columns,
        missingPrimaryKey: missingPrimaryKey,
        missingPrimaryKeyMessage: missingPrimaryKeyMessage,
        title: this.name,
        tableTitle: this.relatedCollection.table.get('table_name'),
        canEdit: this.canEdit,
        showChooseButton: this.showChooseButton,
        showAddButton: this.showAddButton && this.canEdit
      };
    },

    afterRender: function () {
      this.enableSort();
    },

    drop: function () {
      var collection = this.columns;

      this.$('table tbody tr').each(function (i) {
        // Use data-id instead of data-cid
        // As collection models will be synced from the server its cid will be generated again
        // But the dom element will be still pointing to the older cid
        collection.get($(this).data('id')).set({sort: i}, {silent: true});
      });

      var self = this;
      var originalUrl = collection.url;
      var table = this.model.id;
      collection.url = app.API_URL + 'tables/' + table + '/columns';

      collection.save(null, {wait: true, patch: true, success: function () {
        collection = originalUrl;
        self.collection.setOrder('sort', 'ASC', {silent: false});
      }});
    },

    enableSort: function () {
      var container = this.$('table tbody').get(0);

      this.sortable = new Sortable(container, {
        animation: 150, // Ms, animation speed moving items when sorting, `0` — without animation
        handle: '.js-sort', // Restricts sort start click/touch to the specified element
        draggable: 'tr', // Specifies which items inside the element should be sortable
        ghostClass: 'sortable-ghost',
        sort: true,
        disabled: false,
        onStart: function () {
          var tbody = $(container);

          tbody.addClass('remove-hover-state');
          tbody.removeClass('disable-transform');
        },
        onEnd: function () {
          var tbody = $(container);

          tbody.removeClass('remove-hover-state');
          tbody.addClass('disable-transform');
        },
        onUpdate: _.bind(this.drop, this)
      });
    },

    initialize: function (options) {
      // Make sure that the relationship type is correct
      if (!this.columnSchema.relationship ||
        this.columnSchema.relationship.get('type') !== 'ONETOMANY') {
        throw __t('m2m_the_column_need_to_have_m2m_relationship', {
          column: this.columnSchema.id,
          type: 'ONETOMANY',
          ui: 'columns'
        });
      }

      this.canEdit = !(options.inModal || false);

      var columns = this.columns = this.model.get(this.name);

      if (columns.structure.get('sort')) {
        columns.setOrder('sort', 'ASC', {silent: true});
      }

      this.listenTo(columns, 'add change remove', this.render);

      this.relatedCollection = columns;
    }
  });
});
