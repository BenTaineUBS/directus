define([
  'app',
  'underscore',
  'backbone',
  'core/t',
  'core/Modal'
], function (app, _, Backbone, __t, ModalView) {

  var EditFields = Backbone.Layout.extend({
    template: 'modules/settings/permissions-fields',

    events: {
      'click .label': 'onLabelClick',
      'click .js-select-column': 'onSelectColumn'
    },

    onLabelClick: function (event) {
      var $el = $(event.currentTarget);
      var $checkbox = this.$('#' + $el.data('for'));

      $checkbox.click();
    },

    onSelectColumn: function (event) {
      var $checkbox = $(event.currentTarget);
      var $row = $checkbox.closest('tr');

      this.toggleColumn($row.data('column'));
    },

    toggleColumn: function (columnName) {
      var attr = this.name + '_field_blacklist';
      var blacklist = (this.model.get(attr)) ? this.model.get(attr).split(',') : [];
      var $checkbox = this.$('#check_' + columnName);
      var changed = false;

      // Remove or add to blacklist
      if (!$checkbox.is(':checked')) {
        if (!this.hasColumn(columnName)) {
          blacklist.push(columnName);
          changed = true;
        }
      } else if (this.hasColumn(columnName)) {
        blacklist.splice(blacklist.indexOf(columnName), 1);
        changed = true;
      }

      if (changed) {
        var attrs = {};
        attrs[attr] = blacklist.join(',');
        this.model.save(attrs, {patch: true});
      }
    },

    hasColumn: function (name) {
      var blacklist = (this.model.get(this.name + '_field_blacklist') || '').split(',');

      return blacklist.indexOf(name) >= 0;
    },

    serialize: function () {
      var data = {columns: []};
      var blacklist = (this.model.get(this.name + '_field_blacklist') || '').split(',');

      data.permission = __t('permissions_' + this.name);
      data.name = this.name;

      data.columns = app.schemaManager.getColumns('tables', this.model.get('table_name'))
        .filter(function (model) {
          // @TODO: custom primary key
          return model.id !== 'id';
        })
        .map(function (model) {
          return {
            column_name: model.id,
            blacklisted: blacklist.indexOf(model.id) >= 0
          };
        }, this);

      return data;
    },

    initialize: function (options) {
      this.name = options.type;
      this.render();
    }
  });

  var EditFieldsModal = ModalView.extend({
    beforeRender: function () {
      this.setView('.modal-bg', this.view);
    },

    initialize: function (options) {
      this.view = new EditFields(options);
    }
  });

  return Backbone.Layout.extend({
    prefix: 'app/core/interfaces/_internals/permissions/',

    template: 'table',

    events: {
      'click .js-status-toggle': 'toggleStatusSelector',
      'click .js-permission-toggle': 'togglePermission',
      'click .js-add-full-permissions': 'addFullPermissions',
      'click .js-remove-full-permissions': 'removeFullPermissions',
      'click .js-write.choose-column-blacklist': 'editWriteFields',
      'click .js-read.choose-column-blacklist': 'editReadFields'
    },

    toggleStatusSelector: function (event) {
      var $row = $(event.currentTarget).closest('tr');
      var id = $row.data('cid');
      var model = this.collection.get(id);
      var openWorkflow, tableName;

      if (!this.hasStatusColumn(model.get('table_name'))) {
        return;
      }

      this.state.workflowEnabled = !this.state.workflowEnabled;
      this.toggleWorkflow($row.data('table'));
      $row.toggleClass('workflow-enabled');
    },

    isWorkflowOpen: function (tableName) {
      return _.contains(this.state.openWorkflow, tableName);
    },

    openWorkflow: function (tableName) {
      this.state.openWorkflow.push(tableName);
    },

    closeWorkflow: function (tableName) {
      var index = _.indexOf(this.state.openWorkflow, tableName);

      if (index >= 0) {
        this.state.openWorkflow.splice(index, 1);
      }
    },

    toggleWorkflow: function (tableName) {
      if (!this.isWorkflowOpen(tableName)) {
        this.openWorkflow(tableName);
      } else {
        this.closeWorkflow(tableName);
      }
    },

    updateModel: function (id, attributes) {
      var model = this.collection.get(id);
      var options;

      if (!model) {
        throw new Error('Permission model (' + id + ') not found.');
      }

      options = {
        wait: true,
        patch: true
      };

      options.success = function (model) {
        var tableName = model.get('table_name');
        app.schemaManager.getOrFetchTable(tableName, function (tableModel) {
          app.schemaManager.registerPrivileges([model.toJSON()]);
          app.trigger('tables:change:permissions', tableModel, model);
        });
      };

      model.save(attributes, options);
    },

    addFullPermissions: function (event) {
      var self = this;
      var $button = $(event.currentTarget);
      var $row = $button.closest('tr');
      var permissions = {
        allow_add: 1,
        allow_edit: 2,
        allow_delete: 2,
        allow_alter: 1,
        allow_view: 2
      };

      this.updateModel($row.data('cid'), permissions);

      // TODO: Create a API to handle multiple status
      if (this.isWorkflowOpen($row.data('table'))) {
        $row.find('.workflow.js-permission').each(function () {
          var $el = $(this);

          self.updateModel($el.data('cid'), permissions);
        });
      }
    },

    removeFullPermissions: function (event) {
      var self = this;
      var $button = $(event.currentTarget);
      var $row = $button.closest('tr');
      var permissions = {
        allow_add: 0,
        allow_edit: 0,
        allow_delete: 0,
        allow_alter: 0,
        allow_view: 0
      };

      // TODO: Create a API to handle multiple status
      if (this.isWorkflowOpen($row.data('table'))) {
        $row.find('.workflow.js-permission').each(function () {
          var $el = $(this);

          self.updateModel($el.data('cid'), permissions);
        });
      }

      this.updateModel($row.data('cid'), permissions);
    },

    togglePermission: function (event) {
      event.stopPropagation();

      var $toggle = $(event.currentTarget);
      var permission = $toggle.closest('.js-permission-name').data('name');
      var permissionName = 'allow_' + permission;
      var $row = $toggle.closest('.js-permission');
      var model = this.collection.get($row.data('cid'));
      var attributes = {};
      var currentPermissionValue;

      currentPermissionValue = model.get(permissionName);
      if (currentPermissionValue > 1) {
        attributes[permissionName] = 0;
      } else if (currentPermissionValue == 1) {
        attributes[permissionName] = 2;
      } else {
        attributes[permissionName] = 1;
      }

      this.updateModel($row.data('cid'), attributes);
    },

    editReadFields: function (event) {
      var id = $(event.currentTarget).closest('.js-permission').data('cid');
      this.editFields('read', id);
    },

    editWriteFields: function (event) {
      var id = $(event.currentTarget).closest('.js-permission').data('cid');
      this.editFields('write', id);
    },

    editFields: function (type, id) {
      var model = this.collection.get(id);

      // @TODO: link real col
      app.router.openViewInModal(new EditFieldsModal({type: type, model: model}));
    },

    permissionTitle: function (model, name) {
      var title, permission;

      permission = 'allow_' + name;
      if (model.get(permission) > 1) {
        title = __t('permissions_can_' + name + '_any_items');
      } else if (model.get(permission) === 1) {
        title = __t('permissions_can_' + name + '_their_items');
      } else if (!model.has(permission)) {
        title = __t('permissions_can_' + name + '_items');
      } else {
        title = __t('permissions_can_not_' + name + '_items');
      }

      return title;
    },

    parsePermissions: function (model) {
      var permissions = [
        // View
        {
          name: 'view',
          view: model.has('allow_view') && model.get('allow_view') > 0,
          bigView: model.has('allow_view') && model.get('allow_view') === 2,
          onlyMine: model.has('allow_view') && model.get('allow_view') === 1,
          cannot: (function (model) {
            return !model.has('allow_view') || !(model.get('allow_view') > 0);
          })(model)
        },
        // Add
        {
          name: 'add',
          title: this.permissionTitle(model),
          add: (model.has('allow_add') && model.get('allow_add') > 0),
          onlyMine: false, // You either can or cannot add items
          cannot: (function (model) {
            return !model.has('allow_add') || !(model.get('allow_add') > 0);
          })(model)
        },
        // Edit
        {
          name: 'edit',
          edit: (model.has('allow_edit') && model.get('allow_edit') > 0),
          bigEdit: (model.has('allow_edit') && model.get('allow_edit') === 2),
          onlyMine: model.has('allow_edit') && model.get('allow_edit') === 1,
          cannot: (function (model) {
            return !model.has('allow_edit') || !(model.get('allow_edit') > 0);
          })(model)
        },
        // Delete
        {
          name: 'delete',
          delete: (model.has('allow_delete') && model.get('allow_delete') > 0),
          bigDelete: (model.has('allow_delete') && model.get('allow_delete') === 2),
          onlyMine: model.has('allow_delete') && model.get('allow_delete') === 1,
          cannot: (function (model) {
            return !model.has('allow_delete') || !(model.get('allow_delete') > 0);
          })(model)
        }
        // Alter
        // {
        //   alter: (model.has('allow_alter') && model.get('allow_alter') > 0),
        // },
      ];

      return permissions.map(function (permission) {
        permission.title = this.permissionTitle(model, permission.name);

        return permission;
      }, this);
    },

    getTables: function () {
      var tables = [];
      var showCoreTables = this.showCoreTables;

      app.schemaManager.getTables().forEach(function (table) {
        var hasPermissions = app.schemaManager.getPrivileges(table.id);

        if (!hasPermissions || (showCoreTables !== true && table.id.indexOf('directus_') === 0)) {
          return false;
        }

        tables.push(table);
      });

      return tables;
    },

    getTablePrivileges: function (table, status) {
      // Var privilege = app.schemaManager.getPrivileges(table, status);
      var privilege = this.collection.findWhere({
        table_name: table,
        status_id: status
      });

      if (!privilege) {
        privilege = this.getTableDefaultPrivileges(table, status);
        this.collection.add(privilege);
      }

      return privilege;
    },

    getTableDefaultPrivileges: function (tableName, statusId) {
      var privileges = app.schemaManager.getDefaultPrivileges(tableName, statusId);

      privileges.set('group_id', this.model.id);

      return privileges;
    },

    formatBlacklist: function (list) {
      list = list || '';

      if (list) {
        list = list.split(',').join(', ');
      }

      return list;
    },

    // Gets the table privilege information of the given permission
    parsePrivilegePermission: function (tableName, permissionName, statusId) {
      var privilege = this.getTablePrivileges(tableName, statusId);
      var data = this.parsePermissions(privilege);

      data = _.findWhere(data, {name: permissionName});
      data.table_name = tableName;
      data.id = privilege.id;
      data.cid = privilege.cid;
      data.statusId = statusId;

      return data;
    },

    parsePrivilege: function (privilege) {
      var data = privilege.toJSON();
      var tableName = data.table_name;

      data.cid = privilege.cid;
      data.title = app.capitalize(data.table_name, '_', true);
      data.readBlacklist = this.formatBlacklist(data.read_field_blacklist);
      data.writeBlacklist = this.formatBlacklist(data.write_field_blacklist);
      data.statusesReadBlacklist = [];
      data.statusesWriteBlacklist = [];

      // ----------------------------------------------------------------------------
      // Add workflow blacklist
      // ----------------------------------------------------------------------------
      // Gets the default status blacklist
      // data.statusesReadBlacklist.push({list: data.readBlacklist});
      // data.statusesWriteBlacklist.push({list: data.writeBlacklist});

      // Gets all over the statuses and get ech blacklist information
      this.tableStatuses(tableName, function (status) {
        var privilege = this.getTablePrivileges(tableName, status.get('id'));
        data.statusesReadBlacklist.push({
          cid: privilege.cid,
          list: this.formatBlacklist(privilege.get('read_field_blacklist'))
        });
        data.statusesWriteBlacklist.push({
          cid: privilege.cid,
          list: this.formatBlacklist(privilege.get('write_field_blacklist'))
        });
      });

      // Default permissions
      data.permissions = this.parsePermissions(privilege);
      _.each(data.permissions, function (permission) {
        var statuses = [];

        // Statuses.push(this.parsePrivilegePermission(tableName, permission.name, null));
        this.tableStatuses(tableName, function (status) {
          statuses.push(this.parsePrivilegePermission(tableName, permission.name, status.get('id')));
        });

        permission.statuses = statuses;
      }, this);

      return data;
    },

    // All statuses except the hard delete ones
    tableStatuses: function (tableName, fn, context) {
      context = context || this;

      app.statusMapping.get(tableName, true).get('mapping').each(function (status) {
        if (status.get('hard_delete') !== true) {
          fn.apply(context, [status]);
        }
      }, context);
    },

    getDefaultStatus: function () {
      return {
        name: 'All',
        value: null
      };
    },

    getStatuses: function (currentStatusId, tableName) {
      var statuses = [];

      // Statuses.push(this.getDefaultStatus());
      this.tableStatuses(tableName, function (status) {
        statuses.push({
          name: status.get('name'),
          value: status.get('id')
        });
      });

      statuses = statuses.filter(function (status) {
        return status.value != currentStatusId;
      });

      return statuses;
    },

    getPermissionsList: function () {
      var permissions = [];
      var tables = this.getTables();

      tables.forEach(_.bind(function (table) {
        var currentTableStatus = this.state.tables[table.id] || this.getDefaultStatus();
        var privilege = this.getTablePrivileges(table.id, currentTableStatus.value);
        var data = this.parsePrivilege(privilege);

        // Has status column?
        data.hasStatusColumn = this.hasStatusColumn(privilege.get('table_name'));
        data.statuses = data.hasStatusColumn ? this.getStatuses(currentTableStatus, table.id) : [];
        data.currentStatus = currentTableStatus;
        data.openWorkflow = _.contains(this.state.openWorkflow, table.id);
        data.isSystemTable = table.id.startsWith('directus_');

        permissions.push(data);
      }, this));

      return permissions;
    },

    serialize: function () {
      return {
        tables: this.getPermissionsList()
      };
    },

    hasStatusColumn: function (table) {
      var columns = app.schemaManager.getColumns('tables', table);
      var statusColumn;

      // Table without columns
      // it means the user doesn't have permission to view them
      // @TODO: Make a way to see the columns to admins
      if (!columns) {
        return false;
      }

      statusColumn = columns.table.get('status_column') || 'active';

      return columns.some(function (model) {
        return model.id === statusColumn;
      });
    },

    toggleTables: function () {
      this.showCoreTables = !this.showCoreTables;
      this.render();

      return this.showCoreTables;
    },

    initialize: function () {
      this.state = {
        default: 'all',
        status: 'all',
        openWorkflow: [],
        tables: {}
      };

      this.showCoreTables = false;
      this.listenTo(app, 'tables:change:permissions', this.render);
      this.listenTo(this.collection, 'change', this.render);
    }
  });
});
