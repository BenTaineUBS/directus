import VTemplateInput from '../src/components/v-template-input.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VTemplateInput',
    component: VTemplateInput,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-template-input v-bind="args" v-on="args" >My Template Input</v-template-input>',
});

export const Primary = Template.bind({});
Primary.args = {
    modelValue: 'Hey ho everyone, I am a new comment!',
    multiline: true,
    'trigger-character': '@',
    items: {
        item1: 'Test1',
        item2: 'Test2',
    },
    captureGroup: '(@[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12})'
};