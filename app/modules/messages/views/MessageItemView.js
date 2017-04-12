define(['app', 'backbone', 'moment-tz'], function (app, Backbone, moment) {

  return Backbone.View.extend({

    template: 'modules/messages/messages-item',

    events: {
      'click': 'onClick',
      'click .js-select-row': 'onSelect'
    },

    onClick: function () {
      this.trigger('clicked', this);
    },

    onSelect: function () {
      this.trigger('select', this);
    },

    attributes: function () {
      var classes = [
        'message-preview',
        'js-message'
      ];

      if (this.model.get('read') !== 1) {
        classes.push('unread')
      }

      if (this.model.get('archived') === 1) {
        classes.push('archived');
      }

      return {
        'class': classes.join(' '),
        'data-id': this.model.id
      }
    },

    hasAttachment: function (message) {
      return message.attachment && message.attachment.length > 0;
    },

    select: function () {
      this.selected = true;
      this.$el.addClass('active');
    },

    deselect: function () {
      this.selected = false;
      this.$el.removeClass('active');
    },

    serialize: function () {
      var model = this.model;
      var data = model.toJSON();
      var lastResponseTime = model.get('responses').last();
      var datetime = lastResponseTime ? lastResponseTime.get('datetime') : data.date_updated;
      var momentDate = moment(datetime);
      var currentMessage = this.options.parentView.state.currentMessage;
      var recipients;

      data.timestamp = parseInt(momentDate.format('X'), 10);
      data.niceDate = moment().diff(momentDate, 'days') > 1 ? momentDate.format('MMMM D') : momentDate.fromNow();
      data.read = model.getUnreadCount() === 0;
      data.responsesLength = data.responses.length;
      data.from = parseInt(data.from, 10);
      data.selected = currentMessage ? (currentMessage.get('id') === data.id) : false;
      data.count = model.get('responses').length + 1;
      data.showCounter = data.count > 1;

      if (data.recipients) {
        recipients = data.recipients.split(',');
      } else {
        recipients = [];
      }

      data.recipients = [];
      var extra = 0;

      for (var i=0; i<recipients.length; i++) {
        if (i > 2) {
          extra = recipients.length - i;
          break;
        }

        var user = app.users.get(recipients[i]);
        if (user !== undefined) {
          data.recipients.push(user.get('first_name'));
        }
      }

      data.recipients = data.recipients.join(", ");

      if (extra) {
        data.recipients += ' (+' + extra + ' more)';
      }

      data.hasAttachment = this.hasAttachment(data);
      data.hasResponses = data.responses && data.responses.length > 0;

      if (!data.hasAttachment) {
        _.each(data.responses, _.bind(function (response) {
          data.hasAttachment = this.hasAttachment(response);
        }, this));
      }

      return data;
    },

    initialize: function () {
      this.selected = false;
      this.listenTo(this.model, 'sync change', this.render);
      this.listenTo(this.model.get('responses'), 'sync add remove', this.render);
    }
  });
});
