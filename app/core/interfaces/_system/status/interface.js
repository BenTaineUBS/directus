define(['underscore', 'core/UIView'
], function (_, UIView) {

  'use strict';

  var template = '<div class="status-group" style="padding: 12px 0;"> \
                  {{#mapping}} \
                    <label style="font-size:14px;margin-right:40px;display:inline-block;color:{{color}}" class="bold"><input style="display:inline-block;width:auto;margin-right:10px;" type="radio" {{#if ../readonly}}disabled{{/if}} name="{{../name}}" value="{{id}}" {{#if selected}}checked{{/if}}>{{name}}</label> \
                  {{/mapping}} \
                  </div>';

  return UIView.extend({
    template: '_system/status/input',
    events: {
      'change input[type=radio]': function (event) {
        var statusValue = $(event.currentTarget).val();

        this.$('input[type=hidden]').val(statusValue);
        this.model.set(this.name, statusValue);
      }
    },

    serialize: function () {
      var currentStatus = this.options.value;
      var model = this.model;
      var data = {};
      var statuses = [];

      _.each(model.getStatusVisible(), function (status) {
        var item = status.toJSON();

        // NOTE: do not strictly compare as status can (will) be string
        item.selected = status.get('id') == currentStatus;
        item.model = status;
        item.color = item.background_color || item.color;

        statuses.push(item);
      });

      statuses.sort(function (a, b) {
        return a.sort < b.sort;
      });

      data.name = this.options.name;
      data.readonly = !this.options.canWrite;
      data.mapping = statuses;

      return data;
    }
  });
});
