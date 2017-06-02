define([
  'app',
  'underscore',
  'backbone',
  'core/directus',
  'core/BasePageView',
  'core/notification',
  'core/t',
  'modules/tables/views/EditViewRightPane',
  'core/widgets/widgets'
], function(app, _, Backbone, Directus, BasePageView, Notification, __t, EditViewRightPane, Widgets) {

  'use strict';

  // TODO: Extend this view from EditView
  // EditUserView is a lot similar to EditView
  return BasePageView.extend({

    headerOptions: {
      route: {
        title: __t('edit_user'),
        breadcrumbs: [{ title: __t('users'), anchor: '#users'}]
      }
    },

    saveConfirm: function (event) {
      this.save(event);
    },

    save: function (event) {
      var self = this;
      var action = 'save-form-leave';
      var model = this.model;
      var isNew = this.model.isNew();
      var collection = this.model.collection;
      var success;

      if (event.target.options !== undefined) {
        action = $(event.target.options[event.target.selectedIndex]).val();
      }

      if (action === 'save-form-stay') {
        success = function(model, response, options) {
          var route = Backbone.history.fragment.split('/');
          route.pop();
          route.push(model.get('id'));
          self.model.disablePrompt();
          app.router.go(route);
        };
      } else {
        success = function(model, response, options) {
          var route = Backbone.history.fragment.split('/');
          route.pop();
          if (action === 'save-form-add') {
            // Trick the router to refresh this page when we are dealing with new items
            if (isNew) app.router.navigate("#", {trigger: false, replace: true});
            route.push('new');
          }
          self.model.disablePrompt();
          app.router.go(route);
        };
      }

      if (action === 'save-form-copy') {
        var clone = model.toJSON();
        delete clone.id;
        model = new collection.model(clone, {collection: collection, parse: true});
        collection.add(model);
      }

      if (!model.unsavedAttributes()) {
        Notification.warning('Nothing changed, nothing saved');

        return;
      }

      // patch only the changed values
      model.save(model.unsavedAttributes(), {
        success: success,
        error: function(model, xhr, options) {
          console.error('err');
        },
        wait: true,
        patch: true,
        includeRelationships: true
      });
    },

    leftToolbar: function() {
      var collection = this.model.collection;
      var canAdd = this.model.isNew() && collection.canAdd();
      var canEdit = !this.model.isNew() && collection.canEdit();
      var editView = this;

      if (!canAdd && !canEdit) {
        return;
      }

      this.saveWidget = new Widgets.SaveWidget({
        widgetOptions: {
          basicSave: this.headerOptions.basicSave
        },
        enabled: false,
        onClick: _.bind(this.saveConfirm, this)
      });

      if (this.model.canEdit()) {
        this.model.on('unsavedChanges', function(hasChanges, unsavedAttrs, model) {
          editView.saveWidget.setEnabled(hasChanges);
        });
      }

      this.infoWidget = new Widgets.InfoButtonWidget({
        onClick: function (event) {
          editView.toggleRightPane();
        }
      });

      return [
        this.saveWidget,
        this.infoWidget
      ];
    },

    rightPane: function() {
      return EditViewRightPane;
    },

    afterRender: function () {
      var editView = this.editView;

      this.setView('#page-content', editView);
      if (!this.model.isNew()) {
        this.model.fetch();
      } else {
        editView.render();
      }
    },

    cleanup: function () {
      this.model.stopTracking();
    },

    initialize: function () {
      this.editView = new Directus.EditView({model: this.model});
      this.headerOptions.route.title = (this.model.id) ? this.model.get('first_name') + ' ' + this.model.get('last_name') : __t('new_user');

      this.model.startTracking();
    }
  });
});
