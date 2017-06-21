define(['./interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  var statusMappingPlaceholder = JSON.stringify({
    0: {
      name: 'Delete',
      color: '#C1272D',
      sort: 3
    },
    1: {
      name: 'Active',
      color: '#3498DB',
      sort: 1
    },
    2: {
      name: 'Draft',
      color: '#BBBBBB',
      sort: 2
    }
  }, null, 2);

  return UIComponent.extend({
    id: 'status',
    dataTypes: ['TINYINT', 'SMALLINT', 'INT', 'BIGINT'],
    variables: [{
      id: 'delete_value',
      column_name: 'delete_value',
      ui: 'numeric',
      type: 'TINYINT',
      default_value: 0,
      required: false,
      nullable: true,
      system: false,
      hidden_list: false,
      hidden_input: false,
      sort: 6,
      comment: __t('directus_tables_delete_value_comment')
    }, {
      id: 'status_mapping',
      column_name: 'status_mapping',
      ui: 'textarea',
      type: 'TEXT',
      hidden_list: false,
      hidden_input: false,
      required: false,
      nullable: true,
      comment: __t('directus_tables_status_mapping_comment'),
      options: {
        rows: 17,
        placeholder_text: statusMappingPlaceholder,
        filter: 'number'
      }
    }],
    Input: Input
  });
});
