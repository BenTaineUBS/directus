//  Checkbox core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app','backbone'], function(app, Backbone) {

  'use strict';

  var Module = {};

  var template = '<input style="height: 44px;width: 44px;" type="checkbox" {{#if readonly}}disabled{{/if}} {{#if selected}}checked{{/if}}/> \
                  <input type="hidden" name="{{name}}" value="{{#if selected}}1{{else}}0{{/if}}">';

  Module.id = 'checkbox';
  Module.dataTypes = ['TINYINT'];

  Module.variables = [
    {id: 'mandatory', ui: 'checkbox', comment: 'if this field should always be checked by the user.'}
  ];

  Module.Input = Backbone.Layout.extend({

    tagName: 'div',
    attributes: {
      'class': 'field'
    },
    template: Handlebars.compile(template),

    events: {
      'change input[type=checkbox]': function(e) {
        var val = (this.$el.find('input[type=checkbox]:checked').val() === undefined) ? 0 : 1;
        this.$el.find('input[type=hidden]').val(val);
      }
    },

    serialize: function() {
      var value = this.options.value;

      // Get default value if there is one...
      if (value === undefined && this.options.schema.has('def')) {
        value = this.options.schema.get('def');
      }

      var selected = parseInt(value,10) === 1;

      if (
        this.options.model.isNew() &&
        this.options.schema.has('default_value')) {
          selected = parseInt(this.options.schema.get('default_value'),10) === 1;
      }

      return {
        name: this.options.name,
        selected: selected,
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite
      };
    }

  });

  Module.validate = function(value, options) {
    // If a checkbox is required, it MUST be checked to save – similar to "agree to terms" functionality
    if (options.settings.get('mandatory') && value == 0) {
      return 'This field is required';
    }
  };

  Module.list = function(options) {
    var val = (parseInt(options.value, 10) === 1) ? '<input type="checkbox" checked="true" disabled>' : '<input type="checkbox" disabled>';
    //var val = options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100);
    return val;//val;
  };


  return Module;
});
