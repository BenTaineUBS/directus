import VChip from '../src/components/v-chip.vue';
document.body.classList.add('light')

export default {
    title: 'Example/VChip',
    component: VChip,
    argTypes: {
        close: { 'control': 'boolean' }
    },
};

const Template = (args) => ({
    setup() {
        return { args };
    },
    template: '<v-chip v-bind="args" >Cake</v-chip>',
});

export const Primary = Template.bind({});
Primary.args = {
};