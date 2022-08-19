import VSheet from '../src/components/v-sheet.vue';
document.body.classList.add('light')

import { fix } from './fix-actions';

export default {
    title: 'Example/VSheet',
    component: VSheet,
    argTypes: {

    },
};

const Template = (args, { argTypes }) => ({
    setup() {
        return { args: fix(args, argTypes) };
    },
    template: '<v-sheet v-bind="args" v-on="args" >This is some wanky sheet that is not even used inside Directus.</v-sheet>',
});

export const Primary = Template.bind({});
Primary.args = {
};