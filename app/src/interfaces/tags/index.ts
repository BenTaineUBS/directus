import { defineInterface } from '@/interfaces/define';
import InterfaceTags from './tags.vue';

export default defineInterface({
	id: 'tags',
	name: '$t:interfaces.tags.tags',
	description: '$t:interfaces.tags.description',
	icon: 'local_offer',
	component: InterfaceTags,
	types: ['json', 'csv'],
	options: [
		{
			field: 'presets',
			name: '$t:presets',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'tags',
			},
		},
		{
			field: 'placeholder',
			name: '$t:placeholder',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'text-input',
				options: {
					placeholder: '$t:enter_a_placeholder',
				},
			},
		},
		{
			field: 'alphabetize',
			name: '$t:interfaces.tags.alphabetize',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:interfaces.tags.alphabetize_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'allowCustom',
			name: '$t:interfaces.dropdown.allow_other',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:interfaces.dropdown.allow_other_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'whitespace',
			name: '$t:interfaces.tags.whitespace',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					allowNone: true,
					choices: [
						{ text: '$t:interfaces.tags.hyphen', value: '-' },
						{ text: '$t:interfaces.tags.underscore', value: '_' },
						{ text: '$t:interfaces.tags.remove', value: '' },
					],
				},
			},
		},
		{
			field: 'capitalization',
			name: '$t:interfaces.tags.capitalization',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					allowNone: true,
					choices: [
						{ text: '$t:interfaces.tags.uppercase', value: 'uppercase' },
						{ text: '$t:interfaces.tags.lowercase', value: 'lowercase' },
						{ text: '$t:interfaces.tags.auto_formatter', value: 'auto-format' },
					],
				},
			},
		},
		{
			field: 'iconLeft',
			name: '$t:icon_left',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
		{
			field: 'iconRight',
			name: '$t:icon_right',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
	],
	recommendedDisplays: ['labels'],
});
