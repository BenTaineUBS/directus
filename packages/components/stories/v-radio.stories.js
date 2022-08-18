import VRadio from '../src/components/v-radio.vue';
document.body.classList.add('light')

export default {
    title: 'Example/VRadio',
    component: VRadio,
    argTypes: {

    },
};

const Template = (args) => ({
    setup() {
        return { args };
    },
    template: '<v-radio v-bind="args"/>',
});

export const Primary = Template.bind({});
Primary.args = {
    value: '1',
    label: 'My Radio',
    modelValue: '1'
};